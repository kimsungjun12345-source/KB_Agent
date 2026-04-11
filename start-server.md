# 서버 시작 문제 해결 가이드

## 순서대로 시도하기:

### 1. 기본 방법
```bash
npm run dev
```

### 2. 의존성 문제일 경우
```bash
npm install
npm run dev
```

### 3. 캐시 문제일 경우
```bash
rm -rf .next
npm run dev
```

### 4. Node.js 메모리 문제일 경우
```bash
npm run build
npm start
```

### 5. 포트 충돌일 경우
```bash
npx kill-port 3000
npm run dev
```

또는 다른 포트 사용:
```bash
npx next dev -p 3001
```

### 6. 완전 초기화가 필요할 경우
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

## 자주 발생하는 에러별 해결:

- **EADDRINUSE**: 포트 충돌 → 방법 5 사용
- **Out of memory**: 메모리 부족 → 방법 4 사용
- **Module not found**: 의존성 문제 → 방법 2 또는 6 사용
- **Build 에러**: 캐시 문제 → 방법 3 사용