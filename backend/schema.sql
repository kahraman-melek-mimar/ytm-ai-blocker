PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS tracks (
 video_id TEXT PRIMARY KEY CHECK(length(video_id)=11),
 title TEXT NOT NULL DEFAULT '', artist TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- account_id must come from authenticated server identity, never a request body.
CREATE TABLE IF NOT EXISTS votes (
 video_id TEXT NOT NULL REFERENCES tracks(video_id),
 account_id TEXT NOT NULL,
 choice TEXT NOT NULL CHECK(choice IN ('ai','human','unsure')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(video_id,account_id)
);
CREATE TABLE IF NOT EXISTS evidence (
 id INTEGER PRIMARY KEY,
 video_id TEXT NOT NULL REFERENCES tracks(video_id),
 kind TEXT NOT NULL CHECK(kind IN ('creator_declaration','signed_provenance','user_report','model_estimate')),
 claim TEXT NOT NULL CHECK(claim IN ('ai_generated','ai_assisted','human','unknown')),
 source_url TEXT NOT NULL,
 review_state TEXT NOT NULL DEFAULT 'pending' CHECK(review_state IN ('pending','accepted','rejected','withdrawn')),
 reviewer_id TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 CHECK(review_state != 'accepted' OR reviewer_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS reviews (
 id INTEGER PRIMARY KEY,
 evidence_id INTEGER NOT NULL REFERENCES evidence(id),
 reviewer_id TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','accepted','rejected','withdrawn')),
 note TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
