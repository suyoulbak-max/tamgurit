#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/app.js'),'utf8');
function run(at, dates) {
  let now = Date.parse(at);
  const badges = dates.map(date => ({dataset:{publishedAt:date,updatedAt:'2026-10-14'},hidden:true}));
  let timer;
  class Clock extends Date { static now(){ return now; } }
  const context = {
    Date:Clock, window:{SiteData:{},location:{search:''}},
    document:{body:{dataset:{page:'home',prerendered:'true'}},getElementById:()=>({}),querySelectorAll:()=>badges,addEventListener:()=>{}},
    clearTimeout:()=>{timer=null;}, setTimeout:(fn,delay)=>{timer={fn,delay};return 1;}
  };
  vm.runInNewContext(source,context);
  return {badges,get timer(){return timer;},advance(){assert(timer,'visible badges must have an expiry timer');const t=timer;now+=t.delay;t.fn();}};
}
const r=run('2026-10-14T00:00:00+09:00',['2026-10-14','2026-10-08','2026-10-07','2026-10-15','2026-02-30','','garbage','2026-10-01']);
assert.equal(r.badges[0].hidden,false,'new publication must be visible at KST midnight');
assert.equal(r.badges[1].hidden,false,'six-day-old publication stays NEW');
for(let i=2;i<r.badges.length;i++)assert.equal(r.badges[i].hidden,true,'expired/future/invalid/only-updated dates must not be NEW');
const boundary=run('2026-10-14T23:59:59+09:00',['2026-10-08']);
assert.equal(boundary.badges[0].hidden,false);
assert.equal(boundary.timer.delay,1000,'must expire at KST midnight, not viewer timezone');
boundary.advance();
assert.equal(boundary.badges[0].hidden,true,'open pages must hide the badge without reload or rebuild');
assert.equal(boundary.timer,null,'no recurring timer needed when no badge is visible');
const leap=run('2024-03-01T12:00:00+09:00',['2024-02-29','2023-02-29']);
assert.equal(leap.badges[0].hidden,false);
assert.equal(leap.badges[1].hidden,true);
console.log('NEW badge rules PASS: KST, seven-day boundary, invalid/future dates, no updated-date reset, automatic expiry.');
