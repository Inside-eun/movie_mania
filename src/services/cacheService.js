import fs from 'fs';
import path from 'path';

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheDir = path.join(process.cwd(), '.cache');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  generateCacheKey(type, date, params = null) {
    const dateStr = date.replace(/[^\d]/g, ''); // YYYYMMDD 형식
    const paramStr = params ? JSON.stringify(params) : '';
    return `${type}_${dateStr}_${Buffer.from(paramStr).toString('base64')}`;
  }

  getFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  isExpired(item) {
    return Date.now() > item.expiresAt;
  }

  // 메모리 캐시에서 조회
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item || this.isExpired(item)) {
      if (item) this.memoryCache.delete(key);
      return null;
    }
    return item.data;
  }

  // 파일 캐시에서 조회
  getFromFile(key) {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const item = JSON.parse(content);
      
      if (this.isExpired(item)) {
        fs.unlinkSync(filePath);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('파일 캐시 읽기 실패:', error);
      return null;
    }
  }

  // 메모리 캐시에 저장
  setToMemory(key, data, ttlMs) {
    const item = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    this.memoryCache.set(key, item);
  }

  // 파일 캐시에 저장
  setToFile(key, data, ttlMs) {
    const item = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    };

    try {
      const filePath = this.getFilePath(key);
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
    } catch (error) {
      console.error('파일 캐시 저장 실패:', error);
    }
  }

  /**
   * 캐시에서 데이터 조회
   * @param {string} type 캐시 타입 ('movies', 'kofa', 'art' 등)
   * @param {string} date 날짜 (YYYY-MM-DD 형식)
   * @param {*} params 추가 파라미터
   */
  get(type, date, params = null) {
    const key = this.generateCacheKey(type, date, params);
    
    // 1. 메모리 캐시에서 먼저 조회
    const memoryData = this.getFromMemory(key);
    if (memoryData) {
      console.log(`메모리 캐시 히트: ${key}`);
      return memoryData;
    }

    // 2. 파일 캐시에서 조회
    const fileData = this.getFromFile(key);
    if (fileData) {
      console.log(`파일 캐시 히트: ${key}`);
      // 파일에서 가져온 데이터를 메모리 캐시에도 저장
      this.setToMemory(key, fileData, this.getTTL(type));
      return fileData;
    }

    console.log(`캐시 미스: ${key}`);
    return null;
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} type 캐시 타입
   * @param {string} date 날짜
   * @param {*} data 저장할 데이터
   * @param {*} params 추가 파라미터
   */
  set(type, date, data, params = null) {
    const key = this.generateCacheKey(type, date, params);
    const ttl = this.getTTL(type);

    console.log(`캐시 저장: ${key}, TTL: ${ttl}ms`);
    
    // 메모리와 파일 모두에 저장
    this.setToMemory(key, data, ttl);
    this.setToFile(key, data, ttl);
  }

  /**
   * 캐시 타입별 TTL 설정
   */
  getTTL(type) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 당일 데이터는 자정까지, 미래 데이터는 환경 변수에서 설정된 시간 (기본 6시간)
    const isToday = type.includes(today.toISOString().split('T')[0]);
    const defaultHours = parseInt(process.env.CACHE_TTL_HOURS) || 6;
    
    if (isToday) {
      // 당일 데이터: 자정까지
      return tomorrow.getTime() - Date.now();
    } else {
      // 미래 데이터: 환경 변수 설정 시간
      return defaultHours * 60 * 60 * 1000;
    }
  }

  /**
   * 특정 캐시 삭제
   */
  delete(type, date, params = null) {
    const key = this.generateCacheKey(type, date, params);
    
    // 메모리에서 삭제
    this.memoryCache.delete(key);
    
    // 파일에서 삭제
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.log(`캐시 삭제: ${key}`);
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup() {
    // 메모리 캐시 정리
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // 파일 캐시 정리
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const item = JSON.parse(content);
          
          if (this.isExpired(item)) {
            fs.unlinkSync(filePath);
            console.log(`만료된 캐시 파일 삭제: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('캐시 정리 중 오류:', error);
    }
  }

  /**
   * 전체 캐시 삭제
   */
  clear() {
    this.memoryCache.clear();
    
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
      console.log('전체 캐시 삭제 완료');
    } catch (error) {
      console.error('캐시 삭제 중 오류:', error);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats() {
    let fileCount = 0;
    try {
      const files = fs.readdirSync(this.cacheDir);
      fileCount = files.filter(f => f.endsWith('.json')).length;
    } catch (error) {
      // 디렉토리가 없거나 읽기 실패
    }

    return {
      memoryCount: this.memoryCache.size,
      fileCount,
      cacheHits: 0 // 실제 구현에서는 히트 카운터 추가 필요
    };
  }
}

// 싱글톤 인스턴스
export const cacheService = new CacheService();
