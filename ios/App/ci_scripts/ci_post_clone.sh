#!/bin/zsh
# Xcode Cloud는 저장소를 clone만 할 뿐 npm install을 실행하지 않는다.
# Capacitor 플러그인들이 로컬 SPM 패키지로 node_modules/@capacitor/*를
# 직접 참조하므로, 빌드 전에 의존성 설치 + capacitor.config.json 재생성이 필요하다.
set -e

# nvm으로 Node가 관리되는 이미지라면 로드 시도 (없으면 조용히 건너뜀)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  \. "$NVM_DIR/nvm.sh"
  nvm install 22
  nvm use 22
fi

# 그래도 npm이 없으면 Homebrew로 설치 (Xcode Cloud 이미지에는 Homebrew가 포함되어 있음)
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found, installing Node via Homebrew..."
  brew install node
fi

echo "node: $(command -v node) ($(node -v 2>/dev/null || echo 'not found'))"
echo "npm: $(command -v npm) ($(npm -v 2>/dev/null || echo 'not found'))"

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "Installing npm dependencies..."
npm ci

echo "Syncing Capacitor (regenerates capacitor.config.json, updates native plugins)..."
npx cap sync ios
