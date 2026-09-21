# High School Credit Research Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Korean static information site named `고교학점제 탐구가이드` with data-driven posts, columns, trust pages, SEO files, and a localStorage CMS-lite admin mode.

**Architecture:** Use plain HTML/CSS/JavaScript with data files attached to `window.SiteData`. Public pages share one renderer in `assets/js/app.js`; admin pages use `assets/js/admin.js` and localStorage overrides. No backend is required.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, localStorage, Node.js validation scripts, gstack/browser QA after implementation.

---

## File Structure

Create this structure:

```text
index.html
404.html
robots.txt
sitemap.xml
README.md
assets/css/style.css
assets/js/app.js
assets/js/admin.js
assets/icons/favicon.svg
data/site.config.js
data/categories.js
data/posts.js
data/columns.js
categories/index.html
posts/index.html
posts/detail.html
columns/index.html
columns/detail.html
author/index.html
about/index.html
contact/index.html
privacy/index.html
terms/index.html
disclaimer/index.html
sitemap/index.html
admin/index.html
tools/validate-content.cjs
```

Responsibilities:

- `data/*.js`: default site config, category, post, and column data.
- `assets/js/app.js`: public rendering, routing by query string, SEO helpers, related content, sitemap rendering.
- `assets/js/admin.js`: demo login, dashboard, editor forms, localStorage persistence, JSON export/import.
- `assets/css/style.css`: responsive education research-site UI.
- `tools/validate-content.cjs`: content/schema validation before QA.
- HTML files: lightweight shells that load data and the renderer.

## Task 1: Scaffold Static Project Shell

**Files:**
- Create: all directories listed in File Structure
- Create: `assets/icons/favicon.svg`
- Create: HTML shell files

- [ ] **Step 1: Create directories**

Run:

```powershell
New-Item -ItemType Directory -Force -Path assets\css,assets\js,assets\icons,data,categories,posts,columns,author,about,contact,privacy,terms,disclaimer,sitemap,admin,tools | Out-Null
```

Expected: directories exist with no error.

- [ ] **Step 2: Create the shared public HTML shell**

Create `index.html` with this structure:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>고교학점제 탐구가이드</title>
  <meta name="description" content="과목 선택부터 탐구보고서, 세특, 서류기반면접 준비까지 연결해 설명하는 고등학생·학부모용 정보 가이드입니다.">
  <link rel="canonical" href="./">
  <link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body data-page="home">
  <div id="app"></div>
  <script src="data/site.config.js"></script>
  <script src="data/categories.js"></script>
  <script src="data/posts.js"></script>
  <script src="data/columns.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create nested public page shells**

For each nested page, create an HTML shell with adjusted relative paths and `data-page`:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>고교학점제 탐구가이드</title>
  <meta name="description" content="고교학점제 탐구가이드의 정보 페이지입니다.">
  <link rel="canonical" href="./">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body data-page="replace-page-name">
  <div id="app"></div>
  <script src="../data/site.config.js"></script>
  <script src="../data/categories.js"></script>
  <script src="../data/posts.js"></script>
  <script src="../data/columns.js"></script>
  <script src="../assets/js/app.js"></script>
</body>
</html>
```

Use these `data-page` values:

```text
categories/index.html -> categories
posts/index.html -> posts
posts/detail.html -> post-detail
columns/index.html -> columns
columns/detail.html -> column-detail
author/index.html -> author
about/index.html -> about
contact/index.html -> contact
privacy/index.html -> privacy
terms/index.html -> terms
disclaimer/index.html -> disclaimer
sitemap/index.html -> sitemap
404.html -> not-found
```

For `404.html`, use root-relative paths without `../`.

- [ ] **Step 4: Create admin shell**

Create `admin/index.html`:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>관리자 모드 | 고교학점제 탐구가이드</title>
  <meta name="description" content="고교학점제 탐구가이드 CMS-lite 관리자 화면입니다.">
  <link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body data-page="admin">
  <div id="admin-app"></div>
  <script src="../data/site.config.js"></script>
  <script src="../data/categories.js"></script>
  <script src="../data/posts.js"></script>
  <script src="../data/columns.js"></script>
  <script src="../assets/js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create favicon**

Create `assets/icons/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="고교학점제 탐구가이드">
  <rect width="64" height="64" rx="14" fill="#1f3d7a"/>
  <path d="M17 18h28a4 4 0 0 1 4 4v27H21a4 4 0 0 1-4-4V18z" fill="#ffffff"/>
  <path d="M24 25h18M24 32h18M24 39h12" stroke="#1f3d7a" stroke-width="3" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 6: Verify shell files exist**

Run:

```powershell
Get-ChildItem -Recurse -Filter *.html | Select-Object FullName
```

Expected: all public and admin HTML files appear.

## Task 2: Create Site Data

**Files:**
- Create: `data/site.config.js`
- Create: `data/categories.js`
- Create: `data/posts.js`
- Create: `data/columns.js`
- Create: `tools/validate-content.cjs`

- [ ] **Step 1: Create site config**

Create `data/site.config.js`:

```js
window.SiteData = window.SiteData || {};
window.SiteData.config = {
  name: "고교학점제 탐구가이드",
  tagline: "과목 선택부터 탐구보고서, 세특, 서류기반면접까지",
  description: "고등학생과 학부모가 고교학점제 안에서 탐구보고서를 학년·과목·진로/계열별로 설계하고, 세특과 면접 준비까지 연결해 볼 수 있도록 돕는 정보 사이트입니다.",
  url: "https://example.com",
  ownerName: "탐구가이드 편집실",
  ownerBio: "고교학점제, 탐구보고서 작성, 세특 연결, 서류기반면접 준비 흐름을 학생과 학부모 눈높이로 정리합니다.",
  contactEmail: "hello@example.com",
  mainColor: "#1f3d7a",
  subColor: "#eaf0ff",
  adminNotice: "이 관리자 모드는 브라우저 저장소 기반 CMS-lite입니다. 실제 보안 인증이나 서버 저장 기능을 제공하지 않습니다."
};
```

- [ ] **Step 2: Create categories**

Create `data/categories.js`:

```js
window.SiteData = window.SiteData || {};
window.SiteData.categories = [
  { id: 1, slug: "credit-system", name: "고교학점제 이해", group: "system", description: "고교학점제의 기본 구조와 과목 선택 흐름을 쉽게 설명합니다." },
  { id: 2, slug: "grade-guide", name: "학년별 탐구보고서", group: "grade", description: "고1, 고2, 고3 단계별 탐구보고서 작성 방향을 정리합니다." },
  { id: 3, slug: "subject-guide", name: "과목별 탐구보고서", group: "subject", description: "국어, 수학, 영어, 사회, 과학, 정보/AI 등 과목별 보고서 접근법을 안내합니다." },
  { id: 4, slug: "track-guide", name: "진로/계열별 탐구보고서", group: "track", description: "인문사회, 경영경제, 공학, 자연과학, 의생명 등 계열별 주제 설계를 돕습니다." },
  { id: 5, slug: "topic-examples", name: "주제 예시", group: "topic", description: "그대로 베끼는 예시가 아니라 좁은 탐구 질문을 만드는 예시를 제공합니다." },
  { id: 6, slug: "student-record", name: "세특 연결", group: "record", description: "보고서 활동을 세특에 자연스럽게 연결하는 관점을 설명합니다." },
  { id: 7, slug: "interview", name: "면접 대비", group: "interview", description: "서류기반면접 예상 질문과 꼬리질문 대비 흐름을 안내합니다." },
  { id: 8, slug: "parents", name: "학부모 가이드", group: "parents", description: "학부모가 대신 써주지 않고 질문을 정리하도록 돕는 방법을 설명합니다." }
];
```

- [ ] **Step 3: Create posts**

Create `data/posts.js` with 15 objects. Each object must include these fields:

```js
window.SiteData = window.SiteData || {};
window.SiteData.posts = [
  {
    id: 1,
    title: "고1 탐구보고서 시작법: 공통과목에서 진로 질문으로 넘어가기",
    slug: "grade-1-research-report-start",
    categorySlug: "grade-guide",
    grade: "고1",
    subject: "공통과목",
    track: "진로탐색",
    summary: "고1은 어려운 전공 주제보다 수업에서 배운 개념을 바탕으로 작은 질문을 만드는 것이 중요합니다.",
    content: "<p>고1 탐구보고서는 진로를 확정했다는 증명보다, 수업에서 배운 개념을 스스로 질문으로 바꿔보는 과정에 초점을 둡니다.</p><p>예를 들어 사회 시간에 배운 인구 구조, 과학 시간에 배운 에너지 전환, 국어 시간에 다룬 매체 표현 방식처럼 교과 안에서 출발점을 잡으면 보고서가 자연스럽습니다.</p>",
    tableOfContents: ["고1 보고서의 목표", "주제를 좁히는 방법", "면접 질문까지 생각하는 정리"],
    keyPoints: ["공통과목 개념에서 출발하기", "진로는 넓게 연결하기", "자료 조사는 2~3개 신뢰 출처로 시작하기"],
    reportFlow: ["수업 개념 선택", "관심 진로와 연결", "한 문장 탐구 질문 작성", "목차 구성", "한계와 배운 점 정리"],
    studentRecordPoints: ["수업 개념을 스스로 확장한 과정", "자료를 비교하며 질문을 좁힌 과정", "보고서의 한계를 인식한 태도"],
    interviewQuestions: ["이 주제를 선택한 이유는 무엇인가요?", "수업에서 배운 어떤 개념과 연결되나요?", "탐구 과정에서 가장 어려웠던 점은 무엇인가요?"],
    followUpQuestions: ["처음 주제와 최종 질문이 달라진 이유는 무엇인가요?", "자료가 서로 다를 때 어떤 기준으로 판단했나요?", "고2가 되면 이 주제를 어떻게 심화하고 싶나요?"],
    avoidExpressions: ["이 보고서로 세특이 좋아진다", "무조건 좋은 주제다", "대학이 좋아하는 주제다"],
    relatedPostSlugs: ["grade-2-subject-based-report", "interview-follow-up-checklist"],
    authorName: "탐구가이드 편집실",
    publishedAt: "2026-05-18",
    updatedAt: "2026-06-01",
    status: "published",
    featured: true
  }
];
```

Add 14 more posts using these titles and slugs:

```text
고2 선택과목 기반 탐구보고서 작성법 | grade-2-subject-based-report
고3 서류기반면접까지 고려한 보고서 정리법 | grade-3-interview-ready-report
수학 과목 탐구보고서 주제 좁히는 법 | math-research-question-guide
과학 과목 탐구보고서에서 오차와 한계 쓰는 법 | science-limit-analysis-guide
사회 과목 탐구보고서에서 정책의 양면성 다루는 법 | social-policy-two-sides-report
국어/문학 탐구보고서에서 작품 분석을 진로와 연결하는 법 | korean-literature-career-report
영어 과목 탐구보고서에서 원문 자료 활용하는 법 | english-source-based-report
정보/AI 탐구보고서에서 알고리즘 윤리 다루는 법 | ai-ethics-research-report
인문사회계열 탐구보고서 주제 예시 | humanities-social-topic-examples
공학계열 탐구보고서 주제 예시 | engineering-topic-examples
의생명/보건계열 탐구보고서 주제 예시 | bio-health-topic-examples
탐구보고서와 세특을 자연스럽게 연결하는 법 | student-record-natural-connection
서류기반면접 예상 질문 준비법 | document-based-interview-questions
꼬리질문에 대비하는 보고서 점검표 | interview-follow-up-checklist
```

For every added post, fill `content`, `keyPoints`, `reportFlow`, `studentRecordPoints`, `interviewQuestions`, `followUpQuestions`, and `avoidExpressions` with Korean educational guidance. Do not use guaranteed admission wording.

- [ ] **Step 4: Create columns**

Create `data/columns.js`:

```js
window.SiteData = window.SiteData || {};
window.SiteData.columns = [
  {
    id: 1,
    title: "좋은 탐구보고서는 멋진 주제보다 좁은 질문에서 시작합니다",
    slug: "narrow-question-before-big-topic",
    summary: "보고서의 완성도는 거창한 키워드보다 학생이 설명할 수 있는 질문의 구체성에서 시작됩니다.",
    content: "<p>탐구보고서 주제를 정할 때 많은 학생이 먼저 멋져 보이는 키워드를 찾습니다. 하지만 서류기반면접까지 생각하면 중요한 것은 그 주제를 본인이 어떤 질문으로 좁혔는지입니다.</p><p>좋은 질문은 과목 개념, 자료 조사, 한계 분석, 후속 질문을 모두 연결합니다.</p>",
    authorName: "탐구가이드 편집실",
    publishedAt: "2026-05-21",
    updatedAt: "2026-06-01",
    tags: ["탐구질문", "보고서작성", "면접대비"],
    relatedPostSlugs: ["grade-1-research-report-start", "interview-follow-up-checklist"],
    status: "published"
  },
  {
    id: 2,
    title: "탐구보고서의 한계 분석은 약점이 아니라 신뢰의 근거입니다",
    slug: "limit-analysis-builds-trust",
    summary: "오차, 한계, 반대 관점을 정리한 보고서는 면접 질문 앞에서 더 설득력 있게 설명됩니다.",
    content: "<p>완벽해 보이는 보고서보다 한계를 정직하게 설명하는 보고서가 더 신뢰를 줄 수 있습니다.</p><p>한계 분석은 실패 고백이 아니라 탐구 과정을 이해하고 있다는 증거입니다.</p>",
    authorName: "탐구가이드 편집실",
    publishedAt: "2026-05-25",
    updatedAt: "2026-06-01",
    tags: ["한계분석", "꼬리질문", "보고서루브릭"],
    relatedPostSlugs: ["science-limit-analysis-guide", "document-based-interview-questions"],
    status: "published"
  },
  {
    id: 3,
    title: "세특과 면접을 생각한다면 결론에 윤리적 성찰이 필요합니다",
    slug: "ethical-reflection-for-record-and-interview",
    summary: "기술, 정책, 생명, 데이터 주제는 사회적 책임과 윤리적 쟁점을 함께 정리해야 합니다.",
    content: "<p>탐구 주제가 기술이나 정책, 생명, 데이터와 연결될수록 결론에는 사회적 책임을 함께 담아야 합니다.</p><p>윤리적 성찰은 과장된 감상이 아니라, 탐구 결과가 실제 사회에서 어떻게 쓰일 수 있는지 따져보는 과정입니다.</p>",
    authorName: "탐구가이드 편집실",
    publishedAt: "2026-05-29",
    updatedAt: "2026-06-01",
    tags: ["윤리적성찰", "세특연결", "서류기반면접"],
    relatedPostSlugs: ["ai-ethics-research-report", "social-policy-two-sides-report"],
    status: "published"
  }
];
```

- [ ] **Step 5: Create content validator**

Create `tools/validate-content.cjs`:

```js
const fs = require("fs");
const vm = require("vm");

const sandbox = { window: {} };
sandbox.window.SiteData = {};
vm.createContext(sandbox);

for (const file of ["data/site.config.js", "data/categories.js", "data/posts.js", "data/columns.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
}

const data = sandbox.window.SiteData;
const errors = [];

function requireFields(collection, fields, label) {
  collection.forEach((item, index) => {
    fields.forEach((field) => {
      if (item[field] === undefined || item[field] === "" || item[field] === null) {
        errors.push(`${label}[${index}] missing ${field}`);
      }
    });
  });
}

requireFields(data.categories, ["id", "slug", "name", "group", "description"], "category");
requireFields(data.posts, ["id", "title", "slug", "categorySlug", "grade", "subject", "track", "summary", "content", "interviewQuestions", "followUpQuestions", "status"], "post");
requireFields(data.columns, ["id", "title", "slug", "summary", "content", "authorName", "status"], "column");

if (data.posts.length < 15) errors.push(`expected at least 15 posts, got ${data.posts.length}`);
if (data.columns.length < 3) errors.push(`expected at least 3 columns, got ${data.columns.length}`);

const categorySlugs = new Set(data.categories.map((category) => category.slug));
data.posts.forEach((post) => {
  if (!categorySlugs.has(post.categorySlug)) errors.push(`post ${post.slug} has unknown category ${post.categorySlug}`);
  if (!Array.isArray(post.followUpQuestions) || post.followUpQuestions.length < 3) errors.push(`post ${post.slug} needs at least 3 follow-up questions`);
});

const banned = ["합격 보장", "무조건 합격", "마스터키", "대학이 좋아하는 주제"];
for (const post of data.posts) {
  const haystack = JSON.stringify({ ...post, avoidExpressions: [] });
  for (const term of banned) {
    if (haystack.includes(term)) errors.push(`post ${post.slug} includes banned phrase ${term}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${data.posts.length} posts, ${data.columns.length} columns, ${data.categories.length} categories.`);
```

- [ ] **Step 6: Run validator**

Run:

```powershell
node tools\validate-content.cjs
```

Expected: `Validated 15 posts, 3 columns, 8 categories.`

## Task 3: Build Public Renderer and Styles

**Files:**
- Create: `assets/css/style.css`
- Create: `assets/js/app.js`

- [ ] **Step 1: Create CSS**

Create `assets/css/style.css` with:

```css
* { box-sizing: border-box; }
:root {
  --bg: #f7f8fb;
  --surface: #ffffff;
  --text: #172033;
  --muted: #5f6b80;
  --line: #dfe3eb;
  --primary: #1f3d7a;
  --primary-soft: #eaf0ff;
  --accent: #207a6b;
  --radius: 8px;
}
body {
  margin: 0;
  font-family: "Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  letter-spacing: 0;
}
a { color: inherit; }
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255,255,255,.96);
  border-bottom: 1px solid var(--line);
}
.header-inner, .container {
  width: min(1180px, calc(100% - 44px));
  margin: 0 auto;
}
.header-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.logo { font-weight: 900; color: var(--primary); text-decoration: none; white-space: nowrap; }
.nav { display: flex; gap: 16px; overflow-x: auto; white-space: nowrap; font-size: 14px; font-weight: 700; color: #45546f; }
.nav a { text-decoration: none; padding: 8px 0; }
.nav a:hover { color: var(--primary); }
.hero {
  padding: 46px 0 28px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
  gap: 28px;
  align-items: center;
}
.eyebrow, .badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
  padding: 6px 10px;
}
h1 { margin: 14px 0 12px; font-size: 38px; line-height: 1.2; letter-spacing: 0; }
h2 { margin: 0 0 12px; font-size: 25px; line-height: 1.3; }
h3 { margin: 0 0 8px; font-size: 19px; line-height: 1.35; }
p { line-height: 1.72; }
.lead { color: var(--muted); font-size: 17px; margin: 0 0 22px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 10px 15px;
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  font-weight: 900;
  text-decoration: none;
  background: #fff;
  color: var(--primary);
}
.button.primary { background: var(--primary); color: white; }
.section { padding: 26px 0; }
.section-head { display: flex; justify-content: space-between; align-items: end; gap: 18px; margin-bottom: 16px; }
.section-head p { margin: 4px 0 0; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card, .panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: 0 12px 28px rgba(31,61,122,.06);
}
.card p, .panel p { color: var(--muted); margin: 0; }
.meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; color: var(--muted); font-size: 13px; }
.tag { display: inline-flex; padding: 4px 8px; border-radius: 999px; background: #f0f3f8; color: #44516b; font-size: 12px; font-weight: 800; }
.article-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; align-items: start; padding: 34px 0; }
.article-body { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 28px; }
.article-body p { color: #2c364a; }
.aside { position: sticky; top: 84px; display: grid; gap: 14px; }
.list { display: grid; gap: 10px; padding-left: 18px; }
.question-box { border-left: 4px solid var(--primary); background: #f8faff; padding: 16px; border-radius: 0 var(--radius) var(--radius) 0; }
.footer { border-top: 1px solid var(--line); background: #fff; margin-top: 36px; padding: 26px 0; color: var(--muted); }
.footer a { color: var(--primary); text-decoration: none; font-weight: 800; }
@media (max-width: 900px) {
  .header-inner { align-items: flex-start; flex-direction: column; padding: 14px 0; }
  .nav { width: 100%; padding-bottom: 2px; }
  .hero, .article-layout, .grid, .grid.two { grid-template-columns: 1fr; }
  .aside { position: static; }
  h1 { font-size: 30px; }
}
```

- [ ] **Step 2: Create renderer helpers**

Create `assets/js/app.js` starting with:

```js
(function () {
  const data = window.SiteData;
  const page = document.body.dataset.page;
  const root = document.getElementById("app");
  const base = page === "home" || page === "not-found" ? "." : "..";

  function getStoredData() {
    try {
      const raw = localStorage.getItem("researchGuideData");
      if (!raw) return data;
      const stored = JSON.parse(raw);
      return {
        config: stored.siteSettings || data.config,
        categories: data.categories,
        posts: stored.posts || data.posts,
        columns: stored.columns || data.columns
      };
    } catch {
      return data;
    }
  }

  const site = getStoredData();

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function url(path) {
    return `${base}/${path}`.replace("/./", "/");
  }

  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function layout(content) {
    root.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="logo" href="${url("index.html")}">${escapeHtml(site.config.name)}</a>
          <nav class="nav" aria-label="상단 메뉴">
            <a href="${url("index.html")}">홈</a>
            <a href="${url("categories/index.html?category=credit-system")}">고교학점제</a>
            <a href="${url("categories/index.html?category=grade-guide")}">학년별 가이드</a>
            <a href="${url("categories/index.html?category=subject-guide")}">과목별 가이드</a>
            <a href="${url("categories/index.html?category=track-guide")}">진로/계열별</a>
            <a href="${url("categories/index.html?category=interview")}">면접 대비</a>
            <a href="${url("columns/index.html")}">칼럼</a>
          </nav>
        </div>
      </header>
      <main class="container">${content}</main>
      <footer class="footer">
        <div class="container">
          <p><strong>${escapeHtml(site.config.name)}</strong>은 일반 교육 정보 제공 사이트이며, 특정 입시 결과를 보장하지 않습니다.</p>
          <p>
            <a href="${url("about/index.html")}">소개</a> ·
            <a href="${url("author/index.html")}">${escapeHtml(site.config.ownerName)}</a> ·
            <a href="${url("contact/index.html")}">문의</a> ·
            <a href="${url("privacy/index.html")}">개인정보처리방침</a> ·
            <a href="${url("terms/index.html")}">이용약관</a> ·
            <a href="${url("disclaimer/index.html")}">면책고지</a>
          </p>
        </div>
      </footer>
    `;
  }

  function postCard(post) {
    return `<article class="card">
      <span class="badge">${escapeHtml(post.grade)} · ${escapeHtml(post.subject)}</span>
      <h3><a href="${url(`posts/detail.html?slug=${post.slug}`)}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.summary)}</p>
      <div class="meta"><span>${escapeHtml(post.track)}</span><span>${escapeHtml(post.updatedAt)}</span></div>
    </article>`;
  }

  function columnCard(column) {
    return `<article class="card">
      <span class="badge">칼럼</span>
      <h3><a href="${url(`columns/detail.html?slug=${column.slug}`)}">${escapeHtml(column.title)}</a></h3>
      <p>${escapeHtml(column.summary)}</p>
      <div class="meta"><span>${escapeHtml(column.authorName)}</span><span>${escapeHtml(column.updatedAt)}</span></div>
    </article>`;
  }
```

- [ ] **Step 3: Add page renderers**

Append these functions to `assets/js/app.js`:

```js
  function renderHome() {
    const featured = site.posts.filter((post) => post.featured).slice(0, 3);
    const latest = [...site.posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
    layout(`
      <section class="hero">
        <div>
          <span class="eyebrow">학생+학부모를 위한 탐구보고서 로드맵</span>
          <h1>과목 선택부터 탐구보고서, 세특, 서류기반면접까지 연결합니다</h1>
          <p class="lead">${escapeHtml(site.config.description)}</p>
          <div class="actions">
            <a class="button primary" href="${url("categories/index.html?category=grade-guide")}">학년별로 시작하기</a>
            <a class="button" href="${url("categories/index.html?category=interview")}">면접 대비 보기</a>
          </div>
        </div>
        <div class="panel">
          <h2>탐구보고서 작성 흐름</h2>
          <ol class="list">
            <li>학년과 선택 과목 확인</li>
            <li>진로/계열과 연결되는 작은 질문 만들기</li>
            <li>보고서 목차, 한계 분석, 윤리적 성찰 정리</li>
            <li>세특 포인트와 면접 꼬리질문 점검</li>
          </ol>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>학년별 빠른 선택</h2><p>학생이 현재 학년에 맞게 출발하도록 구성했습니다.</p></div></div>
        <div class="grid">
          <article class="card"><h3>고1</h3><p>공통과목에서 진로 탐색형 질문을 만드는 단계입니다.</p></article>
          <article class="card"><h3>고2</h3><p>선택과목을 바탕으로 계열 연결형 보고서를 설계합니다.</p></article>
          <article class="card"><h3>고3</h3><p>서류기반면접 질문까지 고려해 탐구를 정리합니다.</p></article>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>추천 글</h2><p>보고서 작성 흐름을 잡는 데 먼저 읽기 좋은 글입니다.</p></div></div>
        <div class="grid">${featured.map(postCard).join("")}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>최신 글</h2><p>최근 수정된 탐구보고서 가이드입니다.</p></div><a class="button" href="${url("posts/index.html")}">전체 글 보기</a></div>
        <div class="grid">${latest.map(postCard).join("")}</div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>탐구보고서 작성 칼럼</h2><p>주제 선정, 한계 분석, 윤리적 성찰처럼 보고서의 깊이를 만드는 관점을 다룹니다.</p></div></div>
        <div class="grid">${site.columns.map(columnCard).join("")}</div>
      </section>
    `);
  }

  function renderPosts() {
    layout(`<section class="section"><h1>전체 글</h1><p class="lead">학년·과목·진로/계열·면접 대비 흐름으로 정리한 탐구보고서 가이드입니다.</p><div class="grid">${site.posts.map(postCard).join("")}</div></section>`);
  }

  function renderCategories() {
    const selected = query("category");
    const category = site.categories.find((item) => item.slug === selected);
    if (!category) {
      layout(`<section class="section"><h1>카테고리</h1><div class="grid">${site.categories.map((item) => `<article class="card"><h3><a href="${url(`categories/index.html?category=${item.slug}`)}">${escapeHtml(item.name)}</a></h3><p>${escapeHtml(item.description)}</p></article>`).join("")}</div></section>`);
      return;
    }
    const posts = site.posts.filter((post) => post.categorySlug === category.slug);
    layout(`<section class="section"><span class="eyebrow">카테고리</span><h1>${escapeHtml(category.name)}</h1><p class="lead">${escapeHtml(category.description)}</p><div class="grid">${posts.map(postCard).join("")}</div></section>`);
  }

  function renderPostDetail() {
    const post = site.posts.find((item) => item.slug === query("slug"));
    if (!post) return renderNotFound();
    layout(`<article class="article-layout">
      <div class="article-body">
        <div class="meta"><a href="${url("posts/index.html")}">전체 글</a> / ${escapeHtml(post.categorySlug)}</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.summary)}</p>
        <div class="meta"><span class="tag">${escapeHtml(post.grade)}</span><span class="tag">${escapeHtml(post.subject)}</span><span class="tag">${escapeHtml(post.track)}</span><span>수정일 ${escapeHtml(post.updatedAt)}</span></div>
        ${post.content}
        <h2>보고서 작성 흐름</h2><ol class="list">${post.reportFlow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <h2>세특 연결 포인트</h2><ul class="list">${post.studentRecordPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <h2>서류기반면접 예상 질문</h2><div class="question-box"><ul class="list">${post.interviewQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <h2>꼬리질문 대비</h2><div class="question-box"><ul class="list">${post.followUpQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <h2>피해야 할 표현</h2><ul class="list">${post.avoidExpressions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <aside class="aside">
        <div class="panel"><h3>핵심 포인트</h3><ul class="list">${post.keyPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <div class="panel"><h3>운영자</h3><p><a href="${url("author/index.html")}">${escapeHtml(site.config.ownerName)}</a></p><p>${escapeHtml(site.config.ownerBio)}</p></div>
      </aside>
    </article>`);
  }

  function renderColumns() {
    layout(`<section class="section"><h1>탐구보고서 작성 칼럼</h1><p class="lead">탐구보고서를 면접에서 설명 가능한 기록으로 만드는 관점을 다룹니다.</p><div class="grid">${site.columns.map(columnCard).join("")}</div></section>`);
  }

  function renderColumnDetail() {
    const column = site.columns.find((item) => item.slug === query("slug"));
    if (!column) return renderNotFound();
    layout(`<article class="article-layout"><div class="article-body"><h1>${escapeHtml(column.title)}</h1><p class="lead">${escapeHtml(column.summary)}</p><div class="meta"><span>${escapeHtml(column.authorName)}</span><span>${escapeHtml(column.updatedAt)}</span></div>${column.content}</div><aside class="aside"><div class="panel"><h3>관련 태그</h3><div class="meta">${column.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div></div></aside></article>`);
  }
```

- [ ] **Step 4: Add trust and utility pages**

Append to `assets/js/app.js`:

```js
  function renderTrustPage(kind) {
    const pages = {
      about: ["사이트 소개", "이 사이트는 고교학점제 안에서 탐구보고서를 어떻게 설계하고 설명할지 정리하는 교육 정보 사이트입니다."],
      author: ["운영자 소개", `${site.config.ownerName}은 ${site.config.ownerBio}`],
      contact: ["문의", `문의는 이메일 ${site.config.contactEmail}로 보내주세요. 실제 메일 전송 기능은 포함되어 있지 않습니다.`],
      privacy: ["개인정보처리방침", "이 정적 사이트는 별도 회원가입을 제공하지 않습니다. 문의 시 사용자가 직접 제공한 이메일 정보는 답변 목적 외에 사용하지 않는다는 원칙으로 안내합니다."],
      terms: ["이용약관", "이 사이트의 콘텐츠는 일반 교육 정보 제공을 목적으로 하며, 학교별 기준과 공식 안내를 함께 확인해야 합니다."],
      disclaimer: ["면책고지", "이 사이트는 특정 대학 합격, 세특 평가, 면접 결과를 보장하지 않습니다. 입시 제도와 학교 운영 방식은 달라질 수 있으므로 공식 자료를 함께 확인해야 합니다."],
      sitemap: ["사이트맵", "주요 페이지와 글 목록을 한곳에서 확인할 수 있습니다."]
    };
    const [title, body] = pages[kind];
    const extra = kind === "sitemap" ? `<div class="grid">${site.categories.map((category) => `<article class="card"><h3>${escapeHtml(category.name)}</h3><p>${escapeHtml(category.description)}</p></article>`).join("")}</div>` : "";
    layout(`<section class="section"><h1>${title}</h1><p class="lead">${escapeHtml(body)}</p>${extra}</section>`);
  }

  function renderNotFound() {
    layout(`<section class="section"><h1>404 페이지를 찾을 수 없습니다</h1><p class="lead">요청한 페이지가 없거나 주소가 바뀌었습니다.</p><a class="button primary" href="${url("index.html")}">홈으로 돌아가기</a></section>`);
  }

  const routes = {
    home: renderHome,
    posts: renderPosts,
    categories: renderCategories,
    "post-detail": renderPostDetail,
    columns: renderColumns,
    "column-detail": renderColumnDetail,
    about: () => renderTrustPage("about"),
    author: () => renderTrustPage("author"),
    contact: () => renderTrustPage("contact"),
    privacy: () => renderTrustPage("privacy"),
    terms: () => renderTrustPage("terms"),
    disclaimer: () => renderTrustPage("disclaimer"),
    sitemap: () => renderTrustPage("sitemap"),
    "not-found": renderNotFound
  };

  (routes[page] || renderNotFound)();
})();
```

- [ ] **Step 5: Verify public render**

Run:

```powershell
node tools\validate-content.cjs
```

Expected: validation passes.

Open `index.html` in the browser or with gstack later and verify text contains `과목 선택부터 탐구보고서`.

## Task 4: Build CMS-lite Admin

**Files:**
- Create: `assets/js/admin.js`

- [ ] **Step 1: Create admin state and login**

Create `assets/js/admin.js`:

```js
(function () {
  const defaults = window.SiteData;
  const root = document.getElementById("admin-app");
  const storageKey = "researchGuideData";
  const sessionKey = "researchGuideAdmin";

  function loadData() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { siteSettings: defaults.config, posts: defaults.posts, columns: defaults.columns };
      return JSON.parse(raw);
    } catch {
      return { siteSettings: defaults.config, posts: defaults.posts, columns: defaults.columns };
    }
  }

  let state = loadData();

  function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function isLoggedIn() {
    return sessionStorage.getItem(sessionKey) === "yes";
  }

  function renderLogin() {
    root.innerHTML = `<main class="container section"><div class="panel"><h1>관리자 모드</h1><p>${escapeHtml(defaults.config.adminNotice)}</p><button class="button primary" id="login">데모 로그인</button></div></main>`;
    document.getElementById("login").addEventListener("click", () => {
      sessionStorage.setItem(sessionKey, "yes");
      renderAdmin("dashboard");
    });
  }
```

- [ ] **Step 2: Add admin layout and dashboard**

Append:

```js
  function adminLayout(content) {
    root.innerHTML = `<div class="admin-layout">
      <aside class="admin-sidebar">
        <a class="logo" href="../index.html">고교학점제 탐구가이드</a>
        <button data-view="dashboard">대시보드</button>
        <button data-view="posts">일반 글 관리</button>
        <button data-view="columns">칼럼 관리</button>
        <button data-view="settings">사이트 설정</button>
        <button data-view="data">데이터 관리</button>
      </aside>
      <main class="admin-main">${content}</main>
    </div>`;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => renderAdmin(button.dataset.view));
    });
  }

  function renderDashboard() {
    adminLayout(`<h1>대시보드</h1><p>${escapeHtml(defaults.config.adminNotice)}</p><div class="grid">
      <div class="card"><h3>전체 글</h3><p>${state.posts.length}개</p></div>
      <div class="card"><h3>칼럼</h3><p>${state.columns.length}개</p></div>
      <div class="card"><h3>추천 글</h3><p>${state.posts.filter((post) => post.featured).length}개</p></div>
    </div>`);
  }
```

Also add admin CSS to `assets/css/style.css`:

```css
.admin-layout { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr; background: var(--bg); }
.admin-sidebar { background: #fff; border-right: 1px solid var(--line); padding: 20px; display: grid; align-content: start; gap: 10px; }
.admin-sidebar button { text-align: left; border: 1px solid var(--line); background: #fff; border-radius: var(--radius); padding: 10px; font-weight: 800; color: var(--text); }
.admin-main { padding: 26px; }
.input, textarea, select { width: 100%; border: 1px solid var(--line); border-radius: var(--radius); padding: 10px; font: inherit; background: #fff; }
.form-grid { display: grid; gap: 12px; max-width: 860px; }
@media (max-width: 900px) { .admin-layout { grid-template-columns: 1fr; } .admin-sidebar { border-right: 0; border-bottom: 1px solid var(--line); } }
```

- [ ] **Step 3: Add post and column management**

Append:

```js
  function renderList(type) {
    const items = type === "posts" ? state.posts : state.columns;
    const label = type === "posts" ? "일반 글" : "칼럼";
    adminLayout(`<h1>${label} 관리</h1><button class="button primary" id="new-item">새 ${label} 작성</button><div class="section">${items.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><div class="actions"><button class="button" data-edit="${item.id}">수정</button><button class="button" data-delete="${item.id}">삭제</button></div></article>`).join("")}</div>`);
    document.getElementById("new-item").addEventListener("click", () => renderEditor(type));
    document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => renderEditor(type, Number(button.dataset.edit))));
    document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
      const id = Number(button.dataset.delete);
      if (!confirm("삭제하시겠습니까?")) return;
      state[type] = state[type].filter((item) => item.id !== id);
      saveData();
      renderList(type);
    }));
  }

  function renderEditor(type, id) {
    const items = state[type];
    const item = items.find((entry) => entry.id === id) || {
      id: Date.now(),
      title: "",
      slug: "",
      summary: "",
      content: "<p></p>",
      authorName: state.siteSettings.ownerName,
      publishedAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      status: "draft",
      tags: [],
      relatedPostSlugs: []
    };
    adminLayout(`<h1>${id ? "수정" : "새 작성"}</h1><form class="form-grid" id="editor">
      <label>제목<input class="input" name="title" value="${escapeHtml(item.title)}"></label>
      <label>슬러그<input class="input" name="slug" value="${escapeHtml(item.slug)}"></label>
      <label>요약<textarea name="summary" rows="3">${escapeHtml(item.summary)}</textarea></label>
      <label>본문 HTML<textarea name="content" rows="10">${escapeHtml(item.content)}</textarea></label>
      <label>상태<select name="status"><option value="published">발행</option><option value="draft">초안</option></select></label>
      <button class="button primary" type="submit">저장</button>
    </form>`);
    document.querySelector("[name=status]").value = item.status;
    document.getElementById("editor").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = { ...item, title: form.get("title"), slug: form.get("slug"), summary: form.get("summary"), content: form.get("content"), status: form.get("status"), updatedAt: new Date().toISOString().slice(0, 10) };
      const index = items.findIndex((entry) => entry.id === next.id);
      if (index >= 0) items[index] = next;
      else items.push(next);
      saveData();
      renderList(type);
    });
  }
```

- [ ] **Step 4: Add settings and import/export**

Append:

```js
  function renderSettings() {
    const config = state.siteSettings;
    adminLayout(`<h1>사이트 설정</h1><form class="form-grid" id="settings">
      <label>사이트명<input class="input" name="name" value="${escapeHtml(config.name)}"></label>
      <label>한줄 소개<input class="input" name="tagline" value="${escapeHtml(config.tagline)}"></label>
      <label>운영자명<input class="input" name="ownerName" value="${escapeHtml(config.ownerName)}"></label>
      <label>운영자 소개<textarea name="ownerBio" rows="3">${escapeHtml(config.ownerBio)}</textarea></label>
      <label>이메일<input class="input" name="contactEmail" value="${escapeHtml(config.contactEmail)}"></label>
      <button class="button primary" type="submit">설정 저장</button>
    </form>`);
    document.getElementById("settings").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.siteSettings = { ...config, name: form.get("name"), tagline: form.get("tagline"), ownerName: form.get("ownerName"), ownerBio: form.get("ownerBio"), contactEmail: form.get("contactEmail") };
      saveData();
      renderSettings();
    });
  }

  function renderDataTools() {
    adminLayout(`<h1>데이터 관리</h1><p>${escapeHtml(defaults.config.adminNotice)}</p><div class="actions"><button class="button primary" id="export">JSON 내보내기</button><label class="button">JSON 가져오기<input id="import" type="file" accept="application/json" hidden></label></div>`);
    document.getElementById("export").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "research-guide-data.json";
      link.click();
      URL.revokeObjectURL(link.href);
    });
    document.getElementById("import").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state = JSON.parse(reader.result);
        saveData();
        renderDashboard();
      };
      reader.readAsText(file);
    });
  }

  function renderAdmin(view) {
    if (view === "posts") return renderList("posts");
    if (view === "columns") return renderList("columns");
    if (view === "settings") return renderSettings();
    if (view === "data") return renderDataTools();
    return renderDashboard();
  }

  if (isLoggedIn()) renderAdmin("dashboard");
  else renderLogin();
})();
```

- [ ] **Step 5: Verify admin loads**

Open `admin/index.html`.

Expected:

- Login panel appears.
- Clicking `데모 로그인` shows dashboard cards.
- `일반 글 관리` lists posts.
- `데이터 관리` shows export/import controls.

## Task 5: SEO, Sitemap, Robots, README

**Files:**
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `README.md`

- [ ] **Step 1: Create robots.txt**

Create `robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

- [ ] **Step 2: Create sitemap.xml**

Create `sitemap.xml` with static page entries:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/categories/</loc></url>
  <url><loc>https://example.com/posts/</loc></url>
  <url><loc>https://example.com/columns/</loc></url>
  <url><loc>https://example.com/author/</loc></url>
  <url><loc>https://example.com/about/</loc></url>
  <url><loc>https://example.com/contact/</loc></url>
  <url><loc>https://example.com/privacy/</loc></url>
  <url><loc>https://example.com/terms/</loc></url>
  <url><loc>https://example.com/disclaimer/</loc></url>
  <url><loc>https://example.com/sitemap/</loc></url>
</urlset>
```

- [ ] **Step 3: Create README**

Create `README.md`:

```markdown
# 고교학점제 탐구가이드

고등학생과 학부모를 위한 정적 정보 사이트입니다. 과목 선택, 탐구보고서 작성, 세특 연결, 서류기반면접 꼬리질문 대비 흐름을 제공합니다.

## 실행 방법

Replit 또는 로컬에서 `index.html`을 열면 됩니다. 간단한 서버가 필요하면 아래 명령을 사용합니다.

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 수정 위치

- 사이트명, 이메일, 운영자명: `data/site.config.js`
- 색상: `assets/css/style.css`
- 카테고리: `data/categories.js`
- 일반 글: `data/posts.js`
- 칼럼: `data/columns.js`
- 관리자 문구: `data/site.config.js`의 `adminNotice`

## 관리자 모드

`admin/index.html`에서 데모 로그인 후 글, 칼럼, 사이트 설정을 수정할 수 있습니다. 저장 데이터는 브라우저 localStorage에 저장됩니다.

이 관리자 모드는 실제 보안 인증이나 서버 저장 기능이 없는 CMS-lite입니다. 기기나 브라우저가 바뀌면 저장 데이터가 유지되지 않을 수 있습니다.

## 주의

이 사이트는 일반 교육 정보 제공 목적입니다. 특정 대학 합격, 세특 평가, 면접 결과를 보장하지 않습니다.
```

- [ ] **Step 4: Verify SEO files**

Run:

```powershell
Get-Item robots.txt,sitemap.xml,README.md
```

Expected: all three files exist.

## Task 6: Validation and QA

**Files:**
- Modify if needed based on QA findings

- [ ] **Step 1: Run content validator**

Run:

```powershell
node tools\validate-content.cjs
```

Expected: validation passes.

- [ ] **Step 2: Run syntax checks**

Run:

```powershell
node -c assets\js\app.js
node -c assets\js\admin.js
node -c tools\validate-content.cjs
```

Expected: no syntax errors.

- [ ] **Step 3: Serve locally**

Run:

```powershell
python -m http.server 8000
```

Expected: server starts at `http://localhost:8000`.

- [ ] **Step 4: Use gstack to inspect key pages**

Run gstack/browser checks:

```bash
$B goto http://localhost:8000
$B text
$B console --errors
$B goto http://localhost:8000/posts/detail.html?slug=grade-1-research-report-start
$B text
$B console --errors
$B goto http://localhost:8000/admin/
$B snapshot -i
```

Expected:

- Home text includes `과목 선택부터 탐구보고서`.
- Detail page includes `서류기반면접 예상 질문` and `꼬리질문 대비`.
- Admin page shows `데모 로그인`.
- Console errors are empty.

- [ ] **Step 5: Check responsive layout with gstack**

Run:

```bash
$B goto http://localhost:8000
$B responsive work/research-guide
```

Expected:

- Mobile, tablet, desktop screenshots are generated.
- Header menu is usable on mobile.
- Cards do not overlap.
- Article text is readable.

- [ ] **Step 6: Fix QA issues**

If text overlaps, adjust `assets/css/style.css` by reducing grid columns or adding `overflow-x: auto` to the affected container. Re-run Steps 1, 2, 4, and 5 after each fix.

## Self-Review Checklist

- Spec coverage:
  - Public pages covered by Tasks 1 and 3.
  - Data-driven 15 posts and 3 columns covered by Task 2.
  - Interview and follow-up questions covered by post schema and detail renderer.
  - CMS-lite admin covered by Task 4.
  - SEO, robots, sitemap, README covered by Task 5.
  - gstack QA covered by Task 6.
- Placeholder scan:
  - The plan contains no blank placeholder work items.
  - The sample domain `https://example.com` is an explicit default placeholder value users can replace in `data/site.config.js`, `robots.txt`, and `sitemap.xml`.
- Type consistency:
  - `categorySlug`, `relatedPostSlugs`, `interviewQuestions`, `followUpQuestions`, `avoidExpressions`, and `featured` are used consistently in data, renderer, and validator.
