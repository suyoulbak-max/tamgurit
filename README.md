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

## 정적 페이지 생성과 검증

`data/*.js`를 수정한 뒤 아래 명령을 실행합니다. HTML 원본을 직접 고치면 다음 생성 때 덮어씁니다.

```powershell
node tools/build-static.cjs
node tools/validate-content.cjs
node tools/test-adsense-readiness.cjs
node tools/test-static-post-layout.cjs
node tools/test-toc-numbering.cjs
node tools/test-column-thumbnail.cjs
node tools/test-site-integrity.cjs
```

위 검사의 글 수·길이 조건은 프로젝트의 자체 검사이며 Google 승인 기준이 아닙니다. 브라우저 검사는 Playwright가 설치된 환경에서 `node tools/smoke-test.cjs`로 실행합니다. 이 검사는 외부 요청을 차단하므로 실광고를 호출하지 않습니다.

`ads: false`인 글에는 광고 로더를 넣지 않습니다. 본문을 사람 검토한 뒤 광고를 적용하려면 이 설정을 별도로 검토하고 다시 생성·검증하세요. 계정 확인 메타태그는 광고 요청을 발생시키지 않습니다. `ads.txt`는 별도로 관리하며 생성기가 판매자 행을 덮어쓰지 않습니다.

배포 파일은 `node tools/prepare-pages.cjs`로 `_site`에 복사하고 `node tools/test-site-integrity.cjs _site`로 확인합니다. `_site`가 이미 있으면 이전 프리뷰를 다른 위치로 옮긴 뒤 실행합니다. 공개 폴더 목록에 있는 파일만 복사하며 내부 기록, 개발 도구, 저장소 문서는 배포하지 않습니다.

운영 반영은 검토 완료 후 변경 파일을 커밋하여 `main`에 push하면 기존 GitHub Pages 워크플로가 생성·검사·패키징·배포합니다. push는 운영 배포를 유발하므로 운영자의 명시적인 허용 후 수행하세요. 배포 후 `https://plus-literacy.co.kr/`와 수정한 글, `/ads.txt`, `/privacy/`, 존재하지 않는 주소의 404를 확인합니다. 로컬 작업 자체가 운영 반영을 뜻하지 않습니다.

## 읽기 전용 관리자 화면

관리자 모드는 `admin/index.html`에서 확인할 수 있습니다.

이 기능은 공개 GitHub Pages에서 보여 주는 읽기 전용 CMS-lite 데모입니다. 공개 정적 사이트에서는 관리자 비밀번호를 안전하게 숨길 수 없으므로 새 글·수정·삭제·JSON 가져오기는 비활성화되어 있습니다.

실제 콘텐츠 수정은 저장소의 `data/*.js` 파일을 수정한 뒤 GitHub Pages로 배포하는 방식으로 진행합니다.

## 교육 관련 고지

이 사이트의 내용은 교육 정보 제공을 위한 참고 자료입니다.

입시 결과, 면접 결과, 학생부 평가 결과를 보장하지 않습니다.
