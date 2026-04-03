# 🚀 프로젝트 스케줄 간트차트 - 세팅 가이드

JSX 간트차트 UI + Google Sheets DB + Vercel 배포 + 메일 알림 자동화

---

## 📋 전체 구조

```
[팀원 브라우저] ←→ [Vercel 웹앱 (간트차트 UI)] ←→ [Google Sheets (데이터 저장)]
                                                          ↓
                                                   [Apps Script (메일 알림)]
```

- **팀원**: 웹 URL로 접속해서 간트차트 사용
- **Vercel**: React 앱 호스팅 (무료)
- **Google Sheets**: 데이터 저장소 + 메일 알림 자동 발송
- **30초마다 자동 동기화**: 다른 팀원의 변경사항이 자동 반영

---

## STEP 1: Google Sheets 준비 (5분)

### 1-1. 스프레드시트 생성
1. 앞서 받은 `project_schedule_gantt.xlsx` 파일을 Google Drive에 업로드
2. 파일 우클릭 → **Google 스프레드시트로 열기**
3. URL에서 스프레드시트 ID 복사 (나중에 사용)

```
https://docs.google.com/spreadsheets/d/【이 부분이 ID】/edit
```

### 1-2. Apps Script 메일 알림 설정
1. 스프레드시트 상단 → **확장 프로그램** → **Apps Script**
2. `Apps Script 가이드` 시트의 코드를 복사 → Apps Script에 붙여넣기
3. `ADMIN_EMAIL`을 본인 이메일로 변경
4. **저장(Ctrl+S)** → **실행** → 권한 승인
5. 왼쪽 **시계 아이콘(트리거)** → **트리거 추가**:
   - 함수: `sendDeadlineAlerts`
   - 이벤트: 시간 기반 트리거
   - 매일 오전 9시~10시

---

## STEP 2: Google Cloud 서비스 계정 설정 (10분)

웹앱에서 Google Sheets를 읽고 쓰려면 서비스 계정이 필요합니다.

### 2-1. Google Cloud 프로젝트 생성
1. https://console.cloud.google.com 접속
2. 상단 프로젝트 선택 → **새 프로젝트** → 이름 입력 → 만들기

### 2-2. Google Sheets API 활성화
1. 왼쪽 메뉴 → **API 및 서비스** → **라이브러리**
2. "Google Sheets API" 검색 → **사용** 클릭

### 2-3. 서비스 계정 만들기
1. 왼쪽 메뉴 → **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **서비스 계정**
3. 이름: `gantt-sheets` (아무거나 OK)
4. 완료 후, 만들어진 서비스 계정 클릭
5. **키** 탭 → **키 추가** → **새 키 만들기** → **JSON** → 다운로드

⚠️ **다운로드된 JSON 파일을 안전하게 보관하세요!**

### 2-4. 스프레드시트에 서비스 계정 공유
1. 다운로드한 JSON에서 `client_email` 값 복사 (예: `gantt-sheets@프로젝트ID.iam.gserviceaccount.com`)
2. Google Sheets로 이동 → **공유** 버튼 클릭
3. 위 이메일을 추가하고 **편집자** 권한 부여

---

## STEP 3: Vercel 배포 (10분)

### 3-1. GitHub에 코드 올리기
1. https://github.com 에서 새 리포지토리 생성 (예: `project-schedule`)
2. 제공된 `gantt-project` 폴더의 파일들을 모두 업로드

**폴더 구조:**
```
gantt-project/
├── package.json
├── next.config.js
├── .gitignore
├── .env.local.example
├── lib/
│   └── sheets.js          ← Google Sheets API 연동
├── pages/
│   ├── _app.js
│   ├── index.js            ← 간트차트 메인 UI
│   └── api/
│       └── tasks.js        ← API 엔드포인트
├── styles/
│   └── globals.css
└── public/
```

### 3-2. Vercel 연결
1. https://vercel.com 접속 → GitHub 계정으로 로그인
2. **Add New...** → **Project**
3. 방금 만든 GitHub 리포지토리 선택 → **Import**

### 3-3. 환경변수 설정 (중요!)
Deploy 전에 **Environment Variables** 섹션에서 두 가지를 추가:

| 변수명 | 값 |
|--------|-----|
| `GOOGLE_SHEET_ID` | STEP 1에서 복사한 스프레드시트 ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | STEP 2에서 다운로드한 JSON 파일의 **전체 내용**을 한 줄로 붙여넣기 |

**JSON 한 줄로 만드는 방법:**
- 메모장에서 JSON 파일 열기
- Ctrl+H → 찾기: `\n` (줄바꿈) → 바꾸기: (빈칸) → 모두 바꾸기
- 또는 터미널에서: `cat 키파일.json | tr -d '\n'`

### 3-4. 배포
1. **Deploy** 클릭
2. 2~3분 후 배포 완료
3. 할당된 URL (예: `https://project-schedule.vercel.app`)로 접속

---

## STEP 4: 팀원 공유 (1분)

배포된 URL을 팀원에게 공유하면 끝!

- 모든 팀원이 같은 URL로 접속
- 태스크 추가/상태 변경 시 Google Sheets에 실시간 저장
- 30초마다 자동으로 다른 사람의 변경사항 반영
- 매일 오전 9시에 마감 임박 태스크 메일 자동 발송

---

## 🔧 커스터마이징

### 담당자 추가/변경
`pages/index.js` 파일에서 아래 부분 수정:
```javascript
const TEAM = ["김은석", "이지은", "박성민", "최현아"];
const EMAILS = {
  김은석: "eunseok@woojoo.com",
  이지은: "jieun@woojoo.com",
  // 새 팀원 추가
};
```

### 동기화 간격 변경
`pages/index.js`에서 `30000` (30초)을 원하는 밀리초로 변경:
```javascript
const interval = setInterval(fetchTasks, 30000); // 60000 = 1분
```

### 메일 알림 시간 변경
Google Sheets → Apps Script → 트리거 → 편집에서 시간 변경

---

## ❓ 문제 해결

| 증상 | 해결 |
|------|------|
| "데이터를 불러올 수 없습니다" | 환경변수 확인, 서비스 계정 공유 권한 확인 |
| 태스크 추가가 안 됨 | 서비스 계정에 "편집자" 권한이 있는지 확인 |
| 메일이 안 옴 | Apps Script 트리거 설정 확인, Gmail 스팸함 확인 |
| Vercel 빌드 실패 | `package.json`의 dependencies 확인 |

---

## 💰 비용

**모두 무료입니다:**
- Google Sheets API: 무료 (일 500요청까지)
- Vercel: 무료 (Hobby 플랜)
- Apps Script: 무료
- GitHub: 무료
