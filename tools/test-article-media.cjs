"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/app.js'),'utf8');
const helpers=source.slice(source.indexOf('  function escapeHtml('),source.indexOf('  function itemKey('))+source.slice(source.indexOf('  function safeContent('),source.indexOf('  function list('));
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();await page.route('**/*',r=>r.fulfill({body:'<html><body></body></html>',contentType:'text/html'}));
 await page.goto('http://test.local/posts/article.html');await page.addScriptTag({content:helpers});
 const result=await page.evaluate(()=>{
  const out=sanitizeContent('<figure onclick="alert(1)"><img src="../assets/images/example.webp" alt="읽기 & 질문" width="1200" height="675" onerror="alert(1)"><figcaption>설명</figcaption></figure><code>ACGT</code><script>alert(1)</script>');
  const t=document.createElement('template');t.innerHTML=out;const im=t.content.querySelector('figure img');
  return {out,image:!!im,alt:im&&im.alt,width:im&&im.width,height:im&&im.height,code:!!t.content.querySelector('code'),caption:!!t.content.querySelector('figcaption'),bad:/onerror|onclick|alert|<script/i.test(out),unsafe:['javascript:alert(1)','data:image/png;base64,AAAA','https://evil.test/assets/images/a.webp','//evil.test/assets/images/a.webp','../assets/images/../../admin/index.html'].map(src=>sanitizeContent('<img src="'+src+'">'))};
 });
 assert(result.image,'client sanitizer must preserve a local article illustration');assert(result.caption&&result.code,'preserve authored figure caption and code');assert.equal(result.alt,'읽기 & 질문');assert.equal(result.width,1200);assert.equal(result.height,675);assert(!result.bad);for(const out of result.unsafe)assert(!out.includes('<img'),out);
 console.log('Article media sanitizer PASS: local figure, caption, code, alt/dimensions; active attributes and unsafe/external sources removed.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
