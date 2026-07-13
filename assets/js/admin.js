(function () {
  "use strict";

  var storageKey = "researchGuideData";
  var sessionKey = "researchGuideAdmin";
  var readOnlyDemo = true;
  var defaults = window.SiteData || {};
  var root = document.getElementById("admin-app");
  var state = {
    view: "dashboard",
    data: loadData()
  };

  if (!root) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function itemKey(item) {
    return item && (item.slug || item.id);
  }

  function mergeItems(defaultItems, storedItems) {
    var merged = [];
    var seen = {};

    (Array.isArray(defaultItems) ? defaultItems : []).forEach(function (item) {
      var key = itemKey(item);
      if (key != null) seen[key] = merged.length;
      merged.push(item);
    });

    (Array.isArray(storedItems) ? storedItems : []).forEach(function (item) {
      var key = itemKey(item);
      if (key != null && Object.prototype.hasOwnProperty.call(seen, key)) {
        merged[seen[key]] = item;
      } else {
        if (key != null) seen[key] = merged.length;
        merged.push(item);
      }
    });

    return merged;
  }

  function loadData() {
    var config = defaults.config || {};
    var fallback = {
      siteSettings: copy(config),
      config: copy(config),
      categories: Array.isArray(defaults.categories) ? defaults.categories.slice() : [],
      posts: Array.isArray(defaults.posts) ? defaults.posts.slice() : [],
      columns: Array.isArray(defaults.columns) ? defaults.columns.slice() : []
    };

    try {
      var raw = window.localStorage && window.localStorage.getItem(storageKey);
      if (!raw) return fallback;
      var stored = JSON.parse(raw);
      var settings = stored.siteSettings || stored.config || fallback.siteSettings;
      return {
        siteSettings: copy(settings),
        config: copy(settings),
        categories: mergeItems(fallback.categories, stored.categories),
        posts: mergeItems(fallback.posts, stored.posts),
        columns: mergeItems(fallback.columns, stored.columns)
      };
    } catch (error) {
      return fallback;
    }
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function saveData() {
    state.data.config = copy(state.data.siteSettings);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        siteSettings: state.data.siteSettings,
        config: state.data.config,
        categories: state.data.categories || [],
        posts: state.data.posts || [],
        columns: state.data.columns || []
      }, null, 2));
      return true;
    } catch (error) {
      window.alert("브라우저 저장소에 저장하지 못했습니다. 저장 공간이나 브라우저 설정을 확인해 주세요.");
      return false;
    }
  }

  function isLoggedIn() {
    try {
      return window.sessionStorage.getItem(sessionKey) === "demo";
    } catch (error) {
      return false;
    }
  }

  function notice() {
    return (state.data.siteSettings && state.data.siteSettings.adminNotice) ||
      (defaults.config && defaults.config.adminNotice) ||
      "관리자 모드는 브라우저 저장소 기반 CMS-lite입니다. 실제 보안 인증이나 서버 저장 기능은 제공하지 않습니다.";
  }

  function renderLogin() {
    root.innerHTML = '<main class="admin-login">' +
      '<section class="panel admin-login-panel">' +
      '<span class="tag accent">CMS-lite</span>' +
      '<h1>관리자 모드</h1>' +
      '<p class="lead">' + escapeHtml(notice()) + '</p>' +
      '<p class="admin-help">이 화면은 읽기 전용 데모입니다. 공개 GitHub Pages 환경에서는 실제 관리자 비밀번호를 안전하게 숨길 수 없어 수정·삭제·가져오기는 비활성화했습니다.</p>' +
      '<button class="button primary" id="demo-login" type="button">데모 보기</button>' +
      '</section>' +
      '</main>';
    document.getElementById("demo-login").addEventListener("click", function () {
      window.sessionStorage.setItem(sessionKey, "demo");
      render();
    });
  }

  function render() {
    if (!isLoggedIn()) {
      renderLogin();
      return;
    }

    root.innerHTML = '<div class="admin-layout">' +
      '<aside class="admin-sidebar">' +
      '<div class="admin-brand"><strong>고교학점제 탐구가이드</strong><span>읽기 전용 데모</span></div>' +
      sidebarButton("dashboard", "대시보드") +
      sidebarButton("posts", "일반 글 관리") +
      sidebarButton("columns", "칼럼 관리") +
      sidebarButton("settings", "사이트 설정") +
      sidebarButton("data", "데이터 관리") +
      '<button class="admin-logout" id="admin-logout" type="button">로그아웃</button>' +
      '</aside>' +
      '<main class="admin-main">' + viewHtml() + '</main>' +
      '</div>';

    bindLayout();
    bindView();
  }

  function sidebarButton(view, label) {
    var current = state.view === view ? ' aria-current="page"' : "";
    return '<button type="button" data-view="' + view + '"' + current + ">" + escapeHtml(label) + "</button>";
  }

  function bindLayout() {
    Array.prototype.forEach.call(root.querySelectorAll("[data-view]"), function (button) {
      button.addEventListener("click", function () {
        state.view = button.getAttribute("data-view");
        render();
      });
    });

    document.getElementById("admin-logout").addEventListener("click", function () {
      window.sessionStorage.removeItem(sessionKey);
      render();
    });
  }

  function viewHtml() {
    if (state.view === "posts") return listHtml("posts");
    if (state.view === "columns") return listHtml("columns");
    if (state.view === "settings") return settingsHtml();
    if (state.view === "data") return dataToolsHtml();
    return dashboardHtml();
  }

  function dashboardHtml() {
    var posts = state.data.posts || [];
    var columns = state.data.columns || [];
    var featured = posts.filter(function (post) { return post.featured; });
    var drafts = posts.concat(columns).filter(function (item) { return item.status === "draft"; });
    var recentItems = posts.concat(columns).slice().sort(function (a, b) {
      return String(b.updatedAt || b.publishedAt || "").localeCompare(String(a.updatedAt || a.publishedAt || ""));
    }).slice(0, 5);
    var recentRows = recentItems.map(function (item) {
      return '<li><strong>' + escapeHtml(item.title || "제목 없음") + '</strong>' +
        '<span>' + escapeHtml(item.updatedAt || item.publishedAt || "날짜 미정") + ' · ' + escapeHtml(item.status || "draft") + '</span></li>';
    }).join("");

    return '<section class="admin-section">' +
      '<h1>대시보드</h1>' +
      '<p class="admin-notice">' + escapeHtml(notice()) + '</p>' +
      '<div class="admin-cards">' +
      statCard("전체 글", posts.length) +
      statCard("칼럼", columns.length) +
      statCard("추천 글", featured.length) +
      '</div>' +
      '<div class="admin-dashboard-grid">' +
      '<article class="admin-dashboard-panel"><div class="admin-panel-head"><h2>최근 업데이트</h2><span>' + escapeHtml(recentItems.length) + '건</span></div>' +
      '<ul class="admin-mini-list">' + (recentRows || '<li><strong>아직 업데이트가 없습니다.</strong><span>새 글을 등록하면 여기에 표시됩니다.</span></li>') + '</ul></article>' +
      '<article class="admin-dashboard-panel"><div class="admin-panel-head"><h2>운영 체크</h2><span>' + escapeHtml(drafts.length) + '개 초안</span></div>' +
      '<ul class="admin-checklist">' +
      '<li><span></span>학년·과목·진로계열 정보가 서로 맞는지 확인</li>' +
      '<li><span></span>면접 꼬리질문과 세특 연결 포인트 보강</li>' +
      '<li><span></span>개인정보·면책고지·문의 정보 최신 상태 점검</li>' +
      '</ul>' +
      '<div class="admin-quick-actions">' +
      '<button class="button primary" type="button" data-view="posts">글 관리</button>' +
      '<button class="button" type="button" data-view="columns">칼럼 관리</button>' +
      '</div></article>' +
      '</div>' +
      '</section>';
  }

  function statCard(label, value) {
    return '<article class="admin-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></article>';
  }

  function listHtml(type) {
    var items = state.data[type] || [];
    var isColumn = type === "columns";
    var title = isColumn ? "칼럼 관리" : "일반 글 관리";
    var buttonLabel = isColumn ? "새 칼럼" : "새 글";
    var rows = items.map(function (item) {
      return '<article class="admin-list-item">' +
        '<div><h2>' + escapeHtml(item.title || "제목 없음") + '</h2>' +
        '<p>' + escapeHtml(item.summary || "") + '</p>' +
        '<div class="meta"><span>' + escapeHtml(item.slug || "") + '</span><span class="status-pill">' + escapeHtml(item.status || "draft") + '</span></div></div>' +
        '<div class="admin-row-actions">' +
        '<button class="button" type="button" data-edit="' + escapeHtml(type) + '" data-id="' + escapeHtml(item.id) + '">보기</button>' +
        '<button class="button danger" type="button" disabled aria-disabled="true">삭제 비활성</button>' +
        '</div>' +
        '</article>';
    }).join("");

    return '<section class="admin-section">' +
      '<div class="admin-section-header"><div><h1>' + title + '</h1><p class="admin-help">읽기 전용 데모입니다. 공개 사이트에서는 새 글·수정·삭제가 저장되지 않습니다.</p></div>' +
      '<button class="button primary" type="button" disabled aria-disabled="true">' + buttonLabel + ' 비활성</button></div>' +
      '<div class="admin-list">' + (rows || '<div class="empty">등록된 항목이 없습니다.</div>') + '</div>' +
      '</section>';
  }

  function editorHtml(type, id) {
    var item = findItem(type, id) || newItem(type);
    var isNew = !findItem(type, id);
    var title = (type === "columns" ? "칼럼" : "일반 글") + (isNew ? " 미리보기" : " 보기");

    return '<section class="admin-section">' +
      '<button class="button" type="button" data-back="' + type + '">목록으로</button>' +
      '<h1>' + title + '</h1>' +
      '<p class="admin-notice">읽기 전용 데모라 이 화면의 값은 수정·저장되지 않습니다.</p>' +
      '<form class="form-grid" id="editor-form" data-type="' + type + '" data-id="' + escapeHtml(item.id) + '">' +
      field("title", "제목", item.title, true) +
      field("slug", "슬러그", item.slug, true) +
      field("summary", "요약", item.summary, true) +
      textareaField("content", "본문 HTML", item.content, 12, true) +
      '<label><span>상태</span><select name="status" disabled><option value="published"' + selected(item.status, "published") + '>published</option><option value="draft"' + selected(item.status, "draft") + '>draft</option></select></label>' +
      '<div class="actions"><button class="button" type="button" data-back="' + type + '">목록으로</button></div>' +
      '</form>' +
      '</section>';
  }

  function field(name, label, value, readonly) {
    return '<label><span>' + escapeHtml(label) + '</span><input class="input" name="' + name + '" value="' + escapeHtml(value || "") + '"' + (readonly ? ' readonly' : '') + '></label>';
  }

  function textareaField(name, label, value, rows, readonly) {
    return '<label><span>' + escapeHtml(label) + '</span><textarea name="' + name + '" rows="' + rows + '"' + (readonly ? ' readonly' : '') + '>' + escapeHtml(value || "") + '</textarea></label>';
  }

  function selected(value, expected) {
    return value === expected ? " selected" : "";
  }

  function settingsHtml() {
    var settings = state.data.siteSettings || {};
    return '<section class="admin-section">' +
      '<h1>사이트 설정</h1>' +
      '<form class="form-grid" id="settings-form">' +
      '<p class="admin-notice">읽기 전용 데모라 사이트 설정은 저장되지 않습니다.</p>' +
      field("name", "사이트 이름", settings.name, true) +
      field("tagline", "태그라인", settings.tagline, true) +
      field("ownerName", "운영자 이름", settings.ownerName, true) +
      textareaField("ownerBio", "운영자 소개", settings.ownerBio, 5, true) +
      field("contactEmail", "문의 이메일", settings.contactEmail, true) +
      '<div class="actions"><button class="button" type="button" data-view="dashboard">대시보드로</button></div>' +
      '</form>' +
      '</section>';
  }

  function dataToolsHtml() {
    return '<section class="admin-section">' +
      '<h1>데이터 관리</h1>' +
      '<p class="admin-notice">' + escapeHtml(notice()) + '</p>' +
      '<div class="actions">' +
      '<button class="button primary" id="export-json" type="button">JSON 내보내기</button>' +
      '<button class="button" type="button" disabled aria-disabled="true">JSON 가져오기 비활성</button>' +
      '</div>' +
      '<textarea id="json-preview" rows="16" readonly>' + escapeHtml(JSON.stringify(state.data, null, 2)) + '</textarea>' +
      '</section>';
  }

  function bindView() {
    var editorForm = document.getElementById("editor-form");
    var settingsForm = document.getElementById("settings-form");
    var exportButton = document.getElementById("export-json");
    var importInput = document.getElementById("import-json");

    Array.prototype.forEach.call(root.querySelectorAll("[data-new]"), function (button) {
      button.addEventListener("click", function () {
        root.querySelector(".admin-main").innerHTML = editorHtml(button.getAttribute("data-new"));
        bindView();
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll("[data-edit]"), function (button) {
      button.addEventListener("click", function () {
        root.querySelector(".admin-main").innerHTML = editorHtml(button.getAttribute("data-edit"), button.getAttribute("data-id"));
        bindView();
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll("[data-delete]"), function (button) {
      button.addEventListener("click", function () {
        deleteItem(button.getAttribute("data-delete"), button.getAttribute("data-id"));
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll("[data-back]"), function (button) {
      button.addEventListener("click", function () {
        state.view = button.getAttribute("data-back");
        render();
      });
    });

    if (editorForm) editorForm.addEventListener("submit", saveEditor);
    if (settingsForm) settingsForm.addEventListener("submit", saveSettings);
    if (exportButton) exportButton.addEventListener("click", exportJson);
    if (importInput) importInput.addEventListener("change", importJson);
  }

  function findItem(type, id) {
    return (state.data[type] || []).find(function (item) {
      return String(item.id) === String(id);
    });
  }

  function nextId(type) {
    return (state.data[type] || []).reduce(function (max, item) {
      return Math.max(max, Number(item.id) || 0);
    }, 0) + 1;
  }

  function slugify(value) {
    return String(value || "new-item")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-item";
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function newItem(type) {
    var id = nextId(type);
    var title = type === "columns" ? "새 칼럼" : "새 글";
    var settings = state.data.siteSettings || {};
    return {
      id: id,
      title: title,
      slug: slugify(title + "-" + id),
      summary: "",
      content: "<p></p>",
      authorName: settings.ownerName || "",
      publishedAt: today(),
      updatedAt: today(),
      status: "draft",
      featured: false
    };
  }

  function ensureNewItemDefaults(type, item) {
    if (type === "columns") {
      item.tags = Array.isArray(item.tags) ? item.tags : [];
      item.relatedPostSlugs = Array.isArray(item.relatedPostSlugs) ? item.relatedPostSlugs : [];
      return item;
    }

    item.categorySlug = item.categorySlug || firstCategorySlug();
    item.grade = item.grade || "고1-고3";
    item.subject = item.subject || "탐구";
    item.track = item.track || "진로탐색";
    item.tableOfContents = requiredList(item.tableOfContents, ["탐구 질문 정리", "자료 조사 방향", "보고서 마무리"]);
    item.keyPoints = requiredList(item.keyPoints, ["수업 개념에서 출발하기", "자료의 근거 확인하기", "배운 점을 구체적으로 쓰기"]);
    item.reportFlow = requiredList(item.reportFlow, ["주제 선택", "탐구 질문 작성", "자료 조사", "결론과 한계 정리"]);
    item.studentRecordPoints = requiredList(item.studentRecordPoints, ["수업 내용과 연결한 과정", "자료를 비교한 태도", "후속 질문을 만든 점"]);
    item.interviewQuestions = requiredList(item.interviewQuestions, ["이 주제를 선택한 이유는 무엇인가요?", "가장 중요하게 본 근거는 무엇인가요?", "탐구 과정에서 배운 점은 무엇인가요?"]);
    item.followUpQuestions = requiredList(item.followUpQuestions, ["다시 탐구한다면 무엇을 보완하겠나요?", "다른 관점에서는 어떻게 볼 수 있나요?", "자료의 한계는 무엇이었나요?"]);
    item.avoidExpressions = requiredList(item.avoidExpressions, ["합격 보장 표현", "과장된 성과 표현", "근거 없는 단정"]);
    item.relatedPostSlugs = Array.isArray(item.relatedPostSlugs) ? item.relatedPostSlugs : [];
    item.featured = Boolean(item.featured);
    return item;
  }

  function requiredList(value, fallback) {
    return Array.isArray(value) && value.length >= fallback.length ? value : fallback.slice();
  }

  function firstCategorySlug() {
    var categories = state.data.categories || defaults.categories || [];
    return (categories[0] && categories[0].slug) || "grade-guide";
  }

  function saveEditor(event) {
    event.preventDefault();
    if (readOnlyDemo) {
      window.alert("읽기 전용 데모라 저장할 수 없습니다.");
      return;
    }
    var form = event.currentTarget;
    var type = form.getAttribute("data-type");
    var id = form.getAttribute("data-id");
    var items = state.data[type] || [];
    var existing = findItem(type, id);
    var item = existing ? copy(existing) : ensureNewItemDefaults(type, newItem(type));

    item.title = form.elements.title.value.trim() || item.title;
    item.slug = slugify(form.elements.slug.value || item.title);
    item.summary = form.elements.summary.value.trim();
    item.content = form.elements.content.value;
    item.status = form.elements.status.value;
    item.updatedAt = today();

    if (existing) {
      items = items.map(function (current) {
        return String(current.id) === String(id) ? item : current;
      });
    } else {
      items = items.concat(item);
    }

    state.data[type] = items;
    if (!saveData()) return;
    state.view = type;
    render();
  }

  function saveSettings(event) {
    event.preventDefault();
    if (readOnlyDemo) {
      window.alert("읽기 전용 데모라 설정을 저장할 수 없습니다.");
      return;
    }
    var form = event.currentTarget;
    var settings = copy(state.data.siteSettings);
    ["name", "tagline", "ownerName", "ownerBio", "contactEmail"].forEach(function (name) {
      settings[name] = form.elements[name].value.trim();
    });
    state.data.siteSettings = settings;
    if (!saveData()) return;
    render();
  }

  function deleteItem(type, id) {
    if (readOnlyDemo) {
      window.alert("읽기 전용 데모라 삭제할 수 없습니다.");
      return;
    }
    var item = findItem(type, id);
    if (!item) return;
    if (!window.confirm("'" + (item.title || "항목") + "'을 삭제할까요?")) return;
    state.data[type] = (state.data[type] || []).filter(function (current) {
      return String(current.id) !== String(id);
    });
    if (!saveData()) return;
    render();
  }

  function exportJson() {
    var json = JSON.stringify(state.data, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "research-guide-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function importJson(event) {
    if (readOnlyDemo) {
      window.alert("읽기 전용 데모라 JSON을 가져올 수 없습니다.");
      return;
    }
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(String(reader.result || "{}"));
        if (!isPlainObject(imported)) {
          throw new Error("Imported JSON root must be an object.");
        }
        if (Object.prototype.hasOwnProperty.call(imported, "siteSettings") && !isPlainObject(imported.siteSettings)) {
          throw new Error("siteSettings must be an object.");
        }
        if (Object.prototype.hasOwnProperty.call(imported, "categories") && !isObjectArray(imported.categories)) {
          throw new Error("categories must be an array of objects.");
        }
        if (Object.prototype.hasOwnProperty.call(imported, "posts") && !isObjectArray(imported.posts)) {
          throw new Error("posts must be an array of objects.");
        }
        if (Object.prototype.hasOwnProperty.call(imported, "columns") && !isObjectArray(imported.columns)) {
          throw new Error("columns must be an array of objects.");
        }

        var settings = Object.prototype.hasOwnProperty.call(imported, "siteSettings") ? imported.siteSettings : state.data.siteSettings;
        state.data = {
          siteSettings: copy(settings),
          config: copy(settings),
          categories: Object.prototype.hasOwnProperty.call(imported, "categories") ? imported.categories : state.data.categories,
          posts: Object.prototype.hasOwnProperty.call(imported, "posts") ? imported.posts : state.data.posts,
          columns: Object.prototype.hasOwnProperty.call(imported, "columns") ? imported.columns : state.data.columns
        };
        if (!saveData()) return;
        render();
      } catch (error) {
        window.alert("JSON 형식을 확인해 주세요.");
      }
    };
    reader.readAsText(file);
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isObjectArray(value) {
    return Array.isArray(value) && value.every(function (item) {
      return isPlainObject(item);
    });
  }

  render();
})();
