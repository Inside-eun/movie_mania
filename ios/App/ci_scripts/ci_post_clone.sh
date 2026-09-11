#!/bin/sh
# Xcode Cloud는 저장소를 clone만 할 뿐 npm install을 실행하지 않는다.
# Capacitor 플러그인들이 로컬 SPM 패키지로 node_modules/@capacitor/*를
# 직접 참조하므로, 빌드 전에 의존성 설치 + capacitor.config.json 재생성이 필요하다.
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "Installing npm dependencies..."
npm ci

echo "Syncing Capacitor (regenerates capacitor.config.json, updates native plugins)..."
npx cap sync ios
