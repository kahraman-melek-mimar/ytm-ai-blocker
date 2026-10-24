import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../extension/background.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
function setup(store){
 let click,message;
 const chrome={storage:{session:{get:async()=>({...store}),set:async values=>Object.assign(store,values)}},
 offscreen:{hasDocument:async()=>false,createDocument:async()=>{throw new Error('offscreen test failure');}},
 runtime:{onMessage:{addListener:f=>message=f},getURL:p=>'chrome-extension://test/'+p},
 action:{onClicked:{addListener:f=>click=f},setBadgeText:async()=>{},setTitle:async()=>{}},
 tabs:{sendMessage:async()=>{},onRemoved:{addListener:()=>{}}}};
 vm.runInNewContext(source,{chrome,console:{error:()=>{}},Decision:class{},Evidence:class{}});
 return {click,query:tabId=>new Promise(resolve=>message({type:'HELLO'},{tab:{id:tabId}},resolve))};
}
test('startup failure survives worker restart and is returned only to its own tab',async()=>{
 const store={};const first=setup(store);
 await first.click({id:7,url:'https://music.youtube.com/'});
 assert.match(store.startupError.detail,/offscreen: offscreen test failure/);
 const restarted=setup(store);
 assert.match((await restarted.query(7)).startupError,/offscreen test failure/);
 assert.equal((await restarted.query(8)).startupError,null);
});
