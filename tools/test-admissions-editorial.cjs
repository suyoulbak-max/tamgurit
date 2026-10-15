#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const c = {window:{SiteData:{}}};
vm.createContext(c);
for (const f of ['site.config','posts']) vm.runInContext(fs.readFileSync(path.join(root,'data',f+'.js'),'utf8'),c);
const home = fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(home.includes('면접 반영 전형에서는 답변이 최종 평가에 영향을 줄 수 있습니다'), 'home needs qualified admissions relevance');
assert(home.includes('모든 대학·전형이 탐구보고서를 별도로 평가하는 것은 아닙니다'), 'home must not imply universal report scoring');
assert(!home.includes('adsbygoogle.js'), 'rewritten landing must stay ad-free before human review');
const slugs = ['grade-3-interview-ready-report','student-record-natural-connection','interview-follow-up-checklist','research-report-evaluation-rubric'];
for (const slug of slugs) {
 const post=c.window.SiteData.posts.find(p=>p.slug===slug);
 assert(post && post.fullArticle && post.ads===false, slug+': complete body and advertising exclusion required');
 const html=fs.readFileSync(path.join(root,'posts',slug+'.html'),'utf8');
 assert(html.includes(post.content),slug+': source body must be included verbatim');
 assert(!html.includes('adsbygoogle.js'),slug+': no ad loader');
 assert(!html.includes('"@type":"FAQPage"'),slug+': no synthetic FAQ schema');
 assert(/설명용|가상|교육용/.test(post.content),slug+': examples must be labelled');
 assert(/href="https:\/\/(?:admission\.snu\.ac\.kr|www\.moe\.go\.kr|star\.moe\.go\.kr|kosis\.kr|www\.ncic\.re\.kr)/.test(post.content),slug+': primary evidence link required');
 assert(home.includes('posts/'+slug+'.html'),slug+': landing must link directly');
 for (const m of post.content.matchAll(/href="\/posts\/([a-z0-9-]+)\.html"/g)) assert(c.window.SiteData.posts.some(p=>p.slug===m[1]),slug+': invalid related slug '+m[1]);
}
assert(new Set(c.window.SiteData.posts.map(post => post.slug)).size === c.window.SiteData.posts.length, 'post URLs must remain unique');
console.log('Admissions editorial regression PASS: landing + four existing ad-free complete articles.');
