import test from 'node:test';
import assert from 'node:assert/strict';
import {communityVerdict,evaluateTrack,parseSnapshot} from '../core/catalog.mjs';
const record = () => ({videoId:'abcdefghijk',votes:{ai:16,human:4,unsure:7},evidence:[]});
const proof = (claim,kind='creator_declaration') => ({kind,claim,sourceUrl:'https://example.org/statement',reviewState:'accepted'});
test('20 decisive votes and 80 percent qualify; uncertain votes stay separate',()=>{
 assert.equal(communityVerdict({ai:16,human:4,unsure:100}).status,'ai');
 assert.equal(communityVerdict({ai:15,human:4,unsure:100}).status,'pending');
 assert.equal(communityVerdict({ai:10,human:10,unsure:0}).status,'disputed');
 assert.equal(communityVerdict({ai:4,human:16,unsure:0}).status,'human');
 assert.equal(communityVerdict({ai:0,human:0,unsure:20}).aiShare,null);
});
test('auto skip and community consent are independent; allowance overrides both',()=>{
 assert.equal(evaluateTrack(record()).skip,false);
 assert.equal(evaluateTrack(record(),{autoSkip:true}).skip,false);
 assert.equal(evaluateTrack(record(),{autoSkip:true,communitySkip:true}).skip,true);
 assert.equal(evaluateTrack(record(),{autoSkip:true,communitySkip:true,allowTrack:true}).skip,false);
 assert.equal(evaluateTrack(record(),{communitySkip:true}).community.status,'ai');
});
test('model estimates and reports never become accepted provenance',()=>{
 const r=record();r.evidence=[proof('ai_generated','model_estimate'),proof('ai_generated','user_report')];
 assert.equal(evaluateTrack(r,{autoSkip:true,provenanceSkip:true}).skip,false);
 r.evidence=[{...proof('ai_generated'),reviewState:'pending'}];
 assert.equal(evaluateTrack(r).provenance,'unknown');
});
test('accepted opposing or assisted evidence prevents community override',()=>{
 for (const claim of ['human','ai_assisted']) {
  const r=record();r.evidence=[proof(claim)];
  assert.equal(evaluateTrack(r,{autoSkip:true,communitySkip:true,provenanceSkip:true}).skip,false);
 }
 const r=record();r.evidence=[proof('human'),proof('ai_generated')];
 assert.equal(evaluateTrack(r,{autoSkip:true,communitySkip:true,provenanceSkip:true}).provenance,'disputed');
 assert.equal(evaluateTrack(r,{autoSkip:true,communitySkip:true,provenanceSkip:true}).skip,false);
});
test('no record is unknown rather than human; accepted generated evidence can skip',()=>{
 assert.equal(evaluateTrack(null).provenance,'unknown');
 const r=record();r.evidence=[proof('ai_generated')];
 assert.equal(evaluateTrack(r,{autoSkip:true,provenanceSkip:true}).reason,'provenance');
});
test('reject corrupt snapshots, duplicate identities, unsupported versions and forged counts',()=>{
 const snapshot={schemaVersion:1,generatedAt:'2026-10-24T00:00:00Z',tracks:[record()]};
 assert.equal(parseSnapshot(snapshot).size,1);
 for(const update of [{schemaVersion:2},{generatedAt:'invalid'},{tracks:[record(),record()]},
   {tracks:[{...record(),votes:{ai:-1,human:0,unsure:0}}]},
   {tracks:[{...record(),evidence:[{...proof('ai_generated'),kind:'fake'}]}]}]) {
  assert.throws(()=>parseSnapshot({...snapshot,...update}));
 }
 assert.throws(()=>communityVerdict({ai:Infinity,human:0,unsure:0}));
 assert.throws(()=>communityVerdict({ai:Number.MAX_SAFE_INTEGER,human:1,unsure:0}));
});
