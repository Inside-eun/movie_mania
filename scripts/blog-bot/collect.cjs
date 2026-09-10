#!/usr/bin/env node
'use strict';

/**
 * 하루치 작업 원본 로그 수집기.
 * - 터미널(zsh) 히스토리 중 movie_mania 디렉터리 안에서 실행된 명령
 * - 해당 날짜의 Claude Code 세션 대화(movie_mania 프로젝트)
 * stdout 으로 원본 로그를 출력. 그 날 활동이 전혀 없으면 exit code 1.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();
const PROJECT_ROOT = '/Users/choedam-eun/Desktop/work/Movie/movie_mania';
const CLAUDE_PROJECT_DIR = path.join(
  HOME,
  '.claude/projects/-Users-choedam-eun-Desktop-work-Movie-movie-mania'
);

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const targetDate = process.argv[2] || defaultDate();

function dayRangeMs(dateStr) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return [start.getTime(), end.getTime()];
}

const [dayStartMs, dayEndMs] = dayRangeMs(targetDate);

function redact(text) {
  return text
    .replace(
      /((?:api[_-]?key|secret|token|password|authorization|bearer)\s*[:=]\s*)(['"]?)([^\s'"]{4,})(['"]?)/gi,
      '$1$2[REDACTED]$4'
    )
    .replace(/\bBearer\s+[A-Za-z0-9._-]{10,}/g, 'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9]{10,}/g, 'sk-[REDACTED]');
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...(중략, 원문 ${text.length}자)...`;
}

// ---------- 1. 터미널 히스토리 ----------

function parseZshHistory(raw) {
  const lines = raw.split('\n');
  const commands = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^: (\d+):(\d+);(.*)$/);
    if (m) {
      if (current) commands.push(current);
      current = { ts: parseInt(m[1], 10) * 1000, cmd: m[3] };
    } else if (current) {
      current.cmd += `\n${line}`;
    }
  }
  if (current) commands.push(current);
  return commands;
}

function collectShellHistory() {
  const histPath = path.join(HOME, '.zsh_history');
  let raw;
  try {
    raw = fs.readFileSync(histPath, 'latin1');
  } catch {
    return [];
  }
  const commands = parseZshHistory(raw);
  let cwd = HOME;
  const entries = [];
  for (const { ts, cmd } of commands) {
    const trimmed = cmd.trim();
    const cdMatch = trimmed.match(/^cd\s+(.+)$/);
    if (cdMatch) {
      let target = cdMatch[1].trim().split(/\s+/)[0].replace(/^["']|["']$/g, '');
      if (target && target !== '-') {
        if (target.startsWith('~')) target = path.join(HOME, target.slice(1));
        else if (!target.startsWith('/')) target = path.resolve(cwd, target);
        cwd = target;
      }
    }
    if (ts >= dayStartMs && ts <= dayEndMs && cwd.startsWith(PROJECT_ROOT)) {
      entries.push({ time: new Date(ts), cmd: redact(trimmed) });
    }
  }
  return entries;
}

// ---------- 2. Claude Code 세션 대화 ----------

function collectClaudeSessions() {
  let files;
  try {
    files = fs.readdirSync(CLAUDE_PROJECT_DIR).filter((f) => f.endsWith('.jsonl'));
  } catch {
    return [];
  }
  const turns = [];
  for (const file of files) {
    const full = path.join(CLAUDE_PROJECT_DIR, file);
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      if (obj.isSidechain) continue;
      const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : null;
      if (!ts || ts < dayStartMs || ts > dayEndMs) continue;
      if ((obj.type === 'user' || obj.type === 'assistant') && obj.message?.content) {
        const content_ = Array.isArray(obj.message.content)
          ? obj.message.content
          : [];
        const text = content_
          .filter((c) => c.type === 'text' && c.text && c.text.trim())
          .map((c) => c.text.trim())
          .join('\n');
        if (text) {
          turns.push({
            time: new Date(ts),
            role: obj.type === 'user' ? '사용자' : 'Claude',
            text: redact(truncate(text, 3000)),
          });
        }
      }
    }
  }
  turns.sort((a, b) => a.time - b.time);
  return turns;
}

// ---------- 출력 ----------

function hhmmss(d) {
  return d.toTimeString().slice(0, 8);
}

const shellEntries = collectShellHistory();
const claudeTurns = collectClaudeSessions();

let out = `# ${targetDate} 작업 원본 로그\n\n`;
out += '## 터미널 명령 기록 (movie_mania 디렉터리 내)\n\n';
if (shellEntries.length === 0) {
  out += '- (해당 날짜의 터미널 명령 기록 없음)\n';
} else {
  for (const e of shellEntries) {
    out += `- [${hhmmss(e.time)}] ${e.cmd.replace(/\n/g, ' \\n ')}\n`;
  }
}
out += '\n## Claude Code 세션 대화 기록\n\n';
if (claudeTurns.length === 0) {
  out += '- (해당 날짜의 Claude Code 대화 기록 없음)\n';
} else {
  for (const t of claudeTurns) {
    out += `**[${hhmmss(t.time)}] ${t.role}**\n${t.text}\n\n`;
  }
}

process.stdout.write(out);

if (shellEntries.length === 0 && claudeTurns.length === 0) {
  process.exitCode = 1;
}
