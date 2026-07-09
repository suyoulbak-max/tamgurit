# 고교학점제 탐구가이드

## 목적

고교학점제 탐구가이드는 고등학생과 학부모를 위한 정적 정보 사이트입니다.

주요 내용은 다음과 같습니다.

- 과목 선택
- 탐구 보고서
- 학생부 기록
- 서류 기반 면접 후속 질문

## 실행 방법

가장 간단한 방법은 `index.html` 파일을 브라우저에서 직접 여는 것입니다.

로컬 서버로 확인하려면 프로젝트 폴더에서 아래 명령을 실행합니다.

```powershell
python -m http.server 8000
```

그 다음 브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8000
```

## Replit 실행 안내

Replit에서는 프로젝트 파일을 업로드한 뒤, Shell에서 아래 명령을 실행하면 됩니다.

```bash
python -m http.server 8000
```

실행 후 Replit이 제공하는 미리보기 또는 웹 URL로 사이트를 확인할 수 있습니다.

## 수정 위치

- 사이트 이름, 이메일, 운영자 정보: `data/site.config.js`
- 색상: `assets/css/style.css`
- 카테고리: `data/categories.js`
- 게시글: `data/posts.js`
- 칼럼: `data/columns.js`
- 관리자 안내 문구: `config`의 `adminNotice`

## 관리자 모드

관리자 모드는 `admin/index.html`에서 확인할 수 있습니다.

이 기능은 브라우저 `localStorage`를 사용하는 CMS-lite 방식입니다. 실제 보안 기능이나 서버 저장 기능은 없습니다.

브라우저나 기기가 바뀌면 수정한 데이터가 유지되지 않을 수 있습니다.

## 교육 관련 고지

이 사이트의 내용은 교육 정보 제공을 위한 참고 자료입니다.

입시 결과, 면접 결과, 학생부 평가 결과를 보장하지 않습니다.
