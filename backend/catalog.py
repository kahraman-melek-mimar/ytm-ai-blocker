"""Local DB core, not a public API. Web auth/moderation must wrap write methods."""
from pathlib import Path
import re, sqlite3
from datetime import datetime, timezone
VIDEO = re.compile(r'[A-Za-z0-9_-]{11}\Z')
def video_id(value):
    if not isinstance(value,str) or not VIDEO.fullmatch(value):
        raise ValueError('Invalid YouTube video ID')
    return value

class Catalog:
    def __init__(self,path=':memory:'):
        self.db=sqlite3.connect(path)
        self.db.row_factory=sqlite3.Row
        self.db.executescript(Path(__file__).with_name('schema.sql').read_text())
    def add_track(self,identity,title='',artist=''):
        with self.db:
            self.db.execute('INSERT INTO tracks(video_id,title,artist) VALUES(?,?,?) ON CONFLICT(video_id) DO NOTHING',
                            (video_id(identity),title,artist))
    def vote(self,identity,account_id,choice):
        # Caller must supply an already authenticated stable account ID.
        if not isinstance(account_id,str) or not account_id.strip(): raise ValueError('Account required')
        if choice not in ('ai','human','unsure'): raise ValueError('Invalid choice')
        with self.db:
            self.db.execute('''INSERT INTO votes(video_id,account_id,choice) VALUES(?,?,?)
              ON CONFLICT(video_id,account_id) DO UPDATE SET choice=excluded.choice,
              updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')''',(video_id(identity),account_id,choice))
    def remove_vote(self,identity,account_id):
        with self.db:self.db.execute('DELETE FROM votes WHERE video_id=? AND account_id=?',(video_id(identity),account_id))
    def submit_evidence(self,identity,kind,claim,source_url):
        if not isinstance(source_url,str) or not source_url.startswith('https://'): raise ValueError('HTTPS source required')
        with self.db:
            cur=self.db.execute('INSERT INTO evidence(video_id,kind,claim,source_url) VALUES(?,?,?,?)',
                                (video_id(identity),kind,claim,source_url))
        return cur.lastrowid
    def review(self,evidence_id,reviewer_id,state,note):
        # Moderator authorization belongs to the future HTTP boundary.
        if not reviewer_id or not note.strip(): raise ValueError('Reviewer and reason required')
        with self.db:
            cur=self.db.execute('UPDATE evidence SET review_state=?,reviewer_id=? WHERE id=?',(state,reviewer_id,evidence_id))
            if cur.rowcount!=1: raise ValueError('Unknown evidence')
            self.db.execute('INSERT INTO reviews(evidence_id,reviewer_id,state,note) VALUES(?,?,?,?)',
                            (evidence_id,reviewer_id,state,note))
    def lookup(self,identity):
        row=self.db.execute('SELECT * FROM tracks WHERE video_id=?',(video_id(identity),)).fetchone()
        if row is None:return None
        counts={k:0 for k in ('ai','human','unsure')}
        for vote in self.db.execute('SELECT choice,COUNT(*) AS n FROM votes WHERE video_id=? GROUP BY choice',(identity,)):
            counts[vote['choice']]=vote['n']
        evidence=[dict(r) for r in self.db.execute('SELECT kind,claim,source_url,review_state FROM evidence WHERE video_id=? ORDER BY id',(identity,))]
        return {'videoId':identity,'title':row['title'],'artist':row['artist'],'votes':counts,
                'evidence':[{'kind':e['kind'],'claim':e['claim'],'sourceUrl':e['source_url'],'reviewState':e['review_state']} for e in evidence]}
    def snapshot(self):
        # No voter IDs, private reviewer IDs or vote timestamps in the public snapshot.
        ids=[r[0] for r in self.db.execute('SELECT video_id FROM tracks ORDER BY video_id')]
        return {'schemaVersion':1,'generatedAt':datetime.now(timezone.utc).isoformat(),
                'tracks':[self.lookup(identity) for identity in ids]}
