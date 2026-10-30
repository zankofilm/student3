import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const web=read('server-integration/INSTALL-ROOT/student/app.js');
const server=read('server-integration/INSTALL-ROOT/server.mjs');
const java=read('app/src/main/java/ir/madreseyar/student/MainActivity.java');
const gradle=read('app/build.gradle');
const workflow=read('.github/workflows/android-apk.yml');
const shell=read('app/src/main/assets/girl-dashboard.js');

test('dashboard exposes a persisted Persian last-successful-sync timestamp',()=>{
  assert.match(web,/LAST_SYNC_PREFIX_V112/);
  assert.match(web,/fa-IR-u-ca-persian/);
  assert.match(web,/آخرین بروزرسانی:/);
  assert.match(web,/markSuccessfulSyncV112\(\)/);
  assert.match(shell,/__msyStudentLastSyncLabel/);
});

test('manual sync skips unchanged report details using server result revision metadata',()=>{
  assert.match(server,/resultRevision:/);
  assert.match(server,/resultUpdatedAt:/);
  assert.match(web,/changedResultDetailIdsV112\(freshResults\)/);
  assert.match(web,/detailMatchesResultV112/);
  assert.match(web,/skippedUnchangedDetails/);
  const start=web.indexOf('  function resultRevisionKeyV112(');
  const end=web.indexOf('  async function changedResultDetailIdsV112(',start);
  const snippet=web.slice(start,end)+'\nglobalThis.match=detailMatchesResultV112;';
  const ctx={}; vm.runInNewContext(snippet,ctx);
  assert.equal(ctx.match({examId:'e1',resultRevision:3,resultUpdatedAt:50,status:'final',score:18,total:20},{examId:'e1',resultRevision:3,resultUpdatedAt:50,status:'final',score:18,total:20}),true);
  assert.equal(ctx.match({examId:'e1',resultRevision:2,resultUpdatedAt:40,status:'final',score:17,total:20},{examId:'e1',resultRevision:3,resultUpdatedAt:50,status:'final',score:18,total:20}),false);
});

test('account switching clears every student-bound IndexedDB store while same-account login is preserved',()=>{
  const start=web.indexOf('async function resetStudentResultCacheIfAccountChangedV2');
  const end=web.indexOf('function examStateId(',start);
  const fn=web.slice(start,end);
  assert.match(fn,/oldId && oldId !== nextId/);
  assert.match(fn,/EXAM_STORE, DRAFT_STORE, QUEUE_STORE, CACHE_STORE/);
  assert.match(fn,/localStorage\.setItem\(ACTIVE_STUDENT_KEY_V112, nextId\)/);
});


test('login persists the bearer only after the first dashboard is safely cached',()=>{
  const start=web.indexOf('async function login()');
  const end=web.indexOf('async function logout(',start);
  const fn=web.slice(start,end);
  const fetchDashboard=fn.indexOf('const firstDashboard=await api("/api/student/dashboard")');
  const cacheDashboard=fn.indexOf('storePut(CACHE_STORE,{id:"dashboard"');
  const persistToken=fn.indexOf('localStorage.setItem(TOKEN_KEY,token)',fetchDashboard);
  assert.ok(fetchDashboard>=0 && cacheDashboard>fetchDashboard && persistToken>cacheDashboard);
  assert.match(fn,/catch\(e\)\{token="";localStorage\.removeItem\(TOKEN_KEY\)/);
});

test('new submission queue rows are tagged and filtered by active student',()=>{
  assert.match(web,/studentId:currentStudentIdV112\(\), submissionKey/);
  assert.match(web,/studentId:currentStudentIdV112\(\),submissionKey/);
  const start=web.indexOf('async function syncQueue(');
  const end=web.indexOf('async function manualRetryQueue',start);
  const fn=web.slice(start,end);
  assert.match(fn,/const sid = currentStudentIdV112\(\)/);
  assert.match(fn,/String\(item\.studentId\) === sid/);
});
test('logout unregisters push device and revokes server session before it can be reused',()=>{
  const start=web.indexOf('async function logout(callServer = true)');
  const end=web.indexOf('async function syncDashboard(',start);
  const fn=web.slice(start,end);
  assert.match(fn,/mobile-push\/unregister/);
  assert.match(fn,/\/api\/student\/logout/);
  assert.match(fn,/const bearer = token/);
  assert.match(server,/url\.pathname==="\/api\/student\/mobile-push\/unregister"/);
  assert.match(server,/url\.pathname === "\/api\/student\/logout"/);
});

test('native push registration adopts Firebase token rotations saved by the messaging service',()=>{
  assert.match(java,/lastPushToken/);
  assert.match(java,/if\(latest!=null&&!latest\.isEmpty\(\)&&!latest\.equals\(pushToken\)\) pushToken=latest/);
});

test('Android and server advertise the same 1.12 release and CI supports secret-backed release signing',()=>{
  assert.match(gradle,/versionCode 12/);
  assert.match(gradle,/versionName '1\.12\.0'/);
  assert.match(server,/STUDENT_ANDROID_VERSION = "1\.12\.0"/);
  assert.match(server,/STUDENT_ANDROID_VERSION_CODE = 12/);
  assert.match(gradle,/ANDROID_KEYSTORE_PATH/);
  assert.match(workflow,/ANDROID_RELEASE_KEYSTORE_BASE64/);
  assert.match(workflow,/:app:assembleRelease/);
  assert.match(workflow,/:app:assembleDebug/);
});
