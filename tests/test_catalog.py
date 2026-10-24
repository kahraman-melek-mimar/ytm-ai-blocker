import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from catalog import Catalog

class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.c=Catalog();self.c.add_track('abcdefghijk','Test','Artist')
    def tearDown(self):self.c.db.close()
    def test_single_vote_and_change(self):
        self.c.vote('abcdefghijk','account-1','ai');self.c.vote('abcdefghijk','account-1','ai')
        self.assertEqual(self.c.lookup('abcdefghijk')['votes']['ai'],1)
        self.c.vote('abcdefghijk','account-1','human')
        self.assertEqual(self.c.lookup('abcdefghijk')['votes'],{'ai':0,'human':1,'unsure':0})
        self.c.remove_vote('abcdefghijk','account-1')
        self.assertEqual(sum(self.c.lookup('abcdefghijk')['votes'].values()),0)
    def test_unregistered_track_and_invalid_choice(self):
        with self.assertRaises(Exception):self.c.vote('zzzzzzzzzzz','account-1','ai')
        with self.assertRaises(ValueError):self.c.vote('abcdefghijk','','ai')
        with self.assertRaises(ValueError):self.c.vote('abcdefghijk','account-1','forged')
        with self.assertRaises(ValueError):self.c.add_track('invalid')
    def test_evidence_starts_pending_review_has_history(self):
        eid=self.c.submit_evidence('abcdefghijk','creator_declaration','ai_generated','https://example.org/proof')
        self.assertEqual(self.c.lookup('abcdefghijk')['evidence'][0]['reviewState'],'pending')
        self.c.review(eid,'moderator-1','accepted','Checked original statement')
        self.c.review(eid,'moderator-1','withdrawn','Statement corrected')
        self.assertEqual(self.c.lookup('abcdefghijk')['evidence'][0]['reviewState'],'withdrawn')
        self.assertEqual(self.c.db.execute('SELECT COUNT(*) FROM reviews').fetchone()[0],2)
    def test_review_rollback_and_public_snapshot(self):
        eid=self.c.submit_evidence('abcdefghijk','user_report','ai_generated','https://example.org/report')
        with self.assertRaises(Exception):self.c.review(eid,'moderator-1','invalid','reason')
        self.assertEqual(self.c.lookup('abcdefghijk')['evidence'][0]['reviewState'],'pending')
        self.c.vote('abcdefghijk','private-account-id','unsure')
        public=self.c.snapshot()
        self.assertNotIn('private-account-id',str(public));self.assertEqual(public['schemaVersion'],1)
        self.assertIsNone(self.c.lookup('zzzzzzzzzzz'))
    def test_python_snapshot_matches_javascript_contract(self):
        import json,subprocess
        self.c.vote('abcdefghijk','account-1','ai')
        script="import {parseSnapshot} from './core/catalog.mjs';let s='';for await (const c of process.stdin)s+=c;console.log(parseSnapshot(JSON.parse(s)).size);"
        result=subprocess.run(['node','--input-type=module','-e',script],input=json.dumps(self.c.snapshot()),text=True,capture_output=True,cwd=Path(__file__).resolve().parents[1],check=True)
        self.assertEqual(result.stdout.strip(),'1')
if __name__=='__main__':unittest.main()
