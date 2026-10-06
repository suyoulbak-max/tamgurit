const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const [file,next,helpers] of [['tools/build-static.cjs','function listBlock',{esc:String,cleanDate:()=>'',}],['assets/js/app.js','  function renderHome',{escapeHtml:String,url:String,formatDate:()=>'',dateLabel:()=>''}]]){
 const source=fs.readFileSync(file,'utf8'),start=source.indexOf('function columnCard('),end=source.indexOf('\n'+(file.includes('app.js')?'  ':'' )+'function ',start+1),code=source.slice(start,end),c={...helpers};vm.createContext(c);vm.runInContext(code,c);
 const record={slug:'demo',title:'demo',summary:'demo',publishedAt:'2026-10-06',updatedAt:'2026-10-06',thumbnail:'assets/images/report-summary-to-analysis.webp'};
 assert(c.columnCard(record).includes('<img '),file+' must render optional column thumbnail');delete record.thumbnail;assert(!c.columnCard(record).includes('<img '),file+' must preserve old text-only cards');
}
console.log('Optional column thumbnails PASS: static and client cards');
