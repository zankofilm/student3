import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const code=readFileSync(new URL('app/src/main/assets/girl-dashboard.js',root),'utf8');
const java=readFileSync(new URL('app/src/main/java/ir/madreseyar/student/MainActivity.java',root),'utf8');
const css=readFileSync(new URL('app/src/main/assets/girl-dashboard.css',root),'utf8');
function setup({online=true,syncOk=true}={}){
  let ready=false,current='home',syncCount=0,refreshCount=0,scrollPos=-1,shieldCount=0;
  const status={textContent:'حالت محلی'};
  const page={querySelector(sel){return sel==='.v115-hero'&&current==='home'?{}:null}};
  const home={classList:{contains(c){return c==='active'&&current==='home'}},click(){current='home';}};
  const more={click(){current='more';}};
  const elements=[];
  const body={classList:{toggle(){}},addEventListener(){},appendChild(node){elements.push(node);node.remove=()=>{node.removed=true;};if(node.id==='msySyncShieldV14')shieldCount++;}};
  const document={body,querySelector(sel){
    if(sel==='#appView')return ready?{classList:{contains(){return false}}}:null;
    if(sel==='#page')return page;
    if(sel==='#msyGirlHome')return current==='home'?{}:null;
    if(sel==='#bottomNav [data-page="home"]')return home;
    if(sel==='#bottomNav [data-page="more"]')return more;
    if(sel==='#syncLabel')return {textContent:'آخرین بروزرسانی: اکنون'};
    if(sel==='#msyGirlHome .msy-sync-status span')return status;
    return null;
  },addEventListener(){},createElement(){return {innerHTML:'',id:'',className:'',textContent:'',setAttribute(){},querySelector(){return null},remove(){this.removed=true;}}}};
  const win={history:{state:{msyStudentPage:'home'}},scrollY:282,scrollTo(x,y){scrollPos=y;},addEventListener(){},removeEventListener(){}};
  vm.runInNewContext(code,{window:win,document,navigator:{onLine:online},MutationObserver:class{observe(){}},setTimeout(fn){fn();},alert(){},Intl,Date});
  win.__msyStudentManualSync=async()=>{syncCount++;if(!syncOk)throw new Error('خطای آزمایشی');return {ok:true,detailFailed:0,skippedUnchangedDetails:4};};
  win.__msyStudentLastSyncLabel=()=> 'آخرین بروزرسانی: ۸ آبان ۱۴۰۵، ۱۵:۴۸';
  win.__msyStudentRefreshCurrentPage=()=>{refreshCount++;current='home';};
  ready=true;
  return {win,get current(){return current},get syncCount(){return syncCount},get refreshCount(){return refreshCount},get scrollPos(){return scrollPos},get displayText(){return status.textContent},get shieldCount(){return shieldCount},elements};
}
test('update on Home runs direct authorized sync without navigating through More',async()=>{
  const s=setup();await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.syncCount,1);assert.equal(s.refreshCount,1);
  assert.equal(s.scrollPos,282);assert.match(s.displayText,/آخرین بروزرسانی/);assert.equal(s.shieldCount,1);
  assert.ok(s.elements.some(x=>x.id==='msySyncShieldV14'&&x.removed));
});
test('offline update keeps home visible and never executes server sync',async()=>{
  const s=setup({online:false});await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.syncCount,0);assert.equal(s.shieldCount,0);
  assert.ok(s.elements.some(x=>x.className.includes('error')));
});
test('failed server sync keeps home and does not show a false success timestamp',async()=>{
  const s=setup({syncOk:false});await s.win.__msyGirlRefresh();
  assert.equal(s.current,'home');assert.equal(s.syncCount,1);assert.equal(s.refreshCount,0);
  assert.equal(s.displayText,'حالت محلی');assert.ok(s.elements.some(x=>x.className.includes('error')));
});
test('native update path and style no longer leave the app on More',()=>{
  assert.match(java,/window\.__msyGirlRefresh\(\)/);
  const method=java.slice(java.indexOf('private void updateNow()'),java.indexOf('private void askNotificationPermission()'));
  assert.doesNotMatch(method,/data-page=\\\"more/);
  assert.match(css,/#msySyncShieldV14/);
  assert.match(code,/__msyStudentManualSync/);
  assert.doesNotMatch(code,/manual\?\.onclick/);
});
