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

function requireObjectFields(item, fields, label) {
  fields.forEach((field) => {
    if (item[field] === undefined || item[field] === "" || item[field] === null) {
      errors.push(`${label} missing ${field}`);
    }
  });
}

function requireFields(collection, fields, label) {
  if (!Array.isArray(collection)) {
    errors.push(`${label} is not an array`);
    return;
  }

  collection.forEach((item, index) => {
    fields.forEach((field) => {
      if (item[field] === undefined || item[field] === "" || item[field] === null) {
        errors.push(`${label}[${index}] missing ${field}`);
      }
    });
  });
}

function requireArrayLength(item, field, minimum, label) {
  if (!Array.isArray(item[field]) || item[field].length < minimum) {
    errors.push(`${label} needs at least ${minimum} ${field}`);
  }
}

const configFields = [
  "name",
  "tagline",
  "description",
  "url",
  "ownerName",
  "ownerBio",
  "contactEmail",
  "mainColor",
  "subColor",
  "adminNotice"
];

const categoryFields = ["id", "slug", "name", "group", "description"];
const postFields = [
  "id",
  "title",
  "slug",
  "categorySlug",
  "grade",
  "subject",
  "track",
  "summary",
  "content",
  "tableOfContents",
  "keyPoints",
  "reportFlow",
  "studentRecordPoints",
  "interviewQuestions",
  "followUpQuestions",
  "avoidExpressions",
  "relatedPostSlugs",
  "authorName",
  "publishedAt",
  "updatedAt",
  "status",
  "featured"
];
const columnFields = [
  "id",
  "title",
  "slug",
  "summary",
  "content",
  "authorName",
  "publishedAt",
  "updatedAt",
  "tags",
  "relatedPostSlugs",
  "status"
];

requireObjectFields(data.config || {}, configFields, "config");
requireFields(data.categories, categoryFields, "category");
requireFields(data.posts, postFields, "post");
requireFields(data.columns, columnFields, "column");

if (!Array.isArray(data.categories) || data.categories.length !== 8) {
  errors.push(`expected 8 categories, got ${data.categories ? data.categories.length : 0}`);
}
if (!Array.isArray(data.posts) || data.posts.length < 15) {
  errors.push(`expected at least 15 posts, got ${data.posts ? data.posts.length : 0}`);
}
if (!Array.isArray(data.columns) || data.columns.length < 3) {
  errors.push(`expected at least 3 columns, got ${data.columns ? data.columns.length : 0}`);
}

const categorySlugs = new Set((data.categories || []).map((category) => category.slug));
const postSlugs = new Set((data.posts || []).map((post) => post.slug));
(data.posts || []).forEach((post) => {
  if (!categorySlugs.has(post.categorySlug)) {
    errors.push(`post ${post.slug} has unknown category ${post.categorySlug}`);
  }

  requireArrayLength(post, "tableOfContents", 3, `post ${post.slug}`);
  requireArrayLength(post, "keyPoints", 3, `post ${post.slug}`);
  requireArrayLength(post, "reportFlow", 4, `post ${post.slug}`);
  requireArrayLength(post, "studentRecordPoints", 3, `post ${post.slug}`);
  requireArrayLength(post, "interviewQuestions", 3, `post ${post.slug}`);
  requireArrayLength(post, "followUpQuestions", 3, `post ${post.slug}`);
  requireArrayLength(post, "avoidExpressions", 3, `post ${post.slug}`);

  if (post.status !== "published") {
    errors.push(`post ${post.slug} must be published`);
  }

  const paragraphCount = String(post.content || "").match(/<p\b/gi);
  if (!paragraphCount || paragraphCount.length < 2) {
    errors.push(`post ${post.slug} needs at least two HTML paragraphs`);
  }

  (post.relatedPostSlugs || []).forEach((slug) => {
    if (!postSlugs.has(slug)) {
      errors.push(`post ${post.slug} has unknown related post ${slug}`);
    }
  });
});

const enhancedPosts = (data.posts || []).filter((post) =>
  Array.isArray(post.briefingPoints) &&
  Array.isArray(post.comparisons) &&
  Array.isArray(post.bodyQuestions) &&
  Array.isArray(post.writingSteps)
);
if (enhancedPosts.length < 5) {
  errors.push(`expected at least 5 enhanced posts, got ${enhancedPosts.length}`);
}

(data.columns || []).forEach((column) => {
  if (column.status !== "published") {
    errors.push(`column ${column.slug} must be published`);
  }

  (column.relatedPostSlugs || []).forEach((slug) => {
    if (!postSlugs.has(slug)) {
      errors.push(`column ${column.slug} has unknown related post ${slug}`);
    }
  });
});

const banned = ["합격 보장", "무조건 합격", "마스터키", "대학이 좋아하는 주제"];
for (const post of data.posts || []) {
  const haystack = JSON.stringify({ ...post, avoidExpressions: [] });
  for (const term of banned) {
    if (haystack.includes(term)) {
      errors.push(`post ${post.slug} includes banned phrase ${term}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${data.posts.length} posts, ${data.columns.length} columns, ${data.categories.length} categories.`);
