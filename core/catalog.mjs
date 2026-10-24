// Community ratios describe votes, never a probability of AI origin.
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
const count = value => Number.isSafeInteger(value) && value >= 0;
export function communityVerdict(votes, {minimumVotes = 20, threshold = 0.8} = {}) {
  if (!Number.isSafeInteger(minimumVotes) || minimumVotes < 1 || !Number.isFinite(threshold) || threshold <= 0.5 || threshold > 1) throw new Error('Invalid voting policy');
  if (!votes || !['ai','human','unsure'].every(key => count(votes[key]))) throw new Error('Invalid votes');
  const decisive = votes.ai + votes.human;
  if (!Number.isSafeInteger(decisive) || !Number.isSafeInteger(decisive + votes.unsure)) throw new Error('Vote overflow');
  const aiShare = decisive ? votes.ai / decisive : null;
  const status = decisive < minimumVotes ? 'pending' : aiShare >= threshold ? 'ai' : votes.human / decisive >= threshold ? 'human' : 'disputed';
  return {status, decisive, unsure: votes.unsure, aiShare};
}
export function provenanceVerdict(evidence) {
  const accepted = evidence.filter(item => item.reviewState === 'accepted' &&
    ['creator_declaration','signed_provenance'].includes(item.kind));
  const claims = [...new Set(accepted.map(item => item.claim).filter(claim => claim !== 'unknown'))];
  return claims.length > 1 ? 'disputed' : claims[0] || 'unknown';
}
export function evaluateTrack(record, {autoSkip = false, allowTrack = false, communitySkip = false, provenanceSkip = false, minimumVotes = 20, threshold = 0.8} = {}) {
  if (!record) return {community: null, provenance: 'unknown', skip: false, reason: null};
  if (!validId(record.videoId) || !Array.isArray(record.evidence)) throw new Error('Invalid track record');
  const community = communityVerdict(record.votes, {minimumVotes, threshold});
  const provenance = provenanceVerdict(record.evidence);
  // Conflicting accepted provenance is a hold, not a majority override.
  const reason = provenance === 'disputed' ? null : provenanceSkip && provenance === 'ai_generated' ? 'provenance' :
    communitySkip && community.status === 'ai' && provenance === 'unknown' ? 'community' : null;
  return {community, provenance, skip: Boolean(autoSkip && !allowTrack && reason), reason};
}
export function parseSnapshot(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.tracks) || data.tracks.length > 100000 ||
    typeof data.generatedAt !== 'string' || !Number.isFinite(Date.parse(data.generatedAt))) throw new Error('Invalid catalog snapshot');
  const tracks = new Map();
  for (const record of data.tracks) {
    if (!record || !validId(record.videoId) || tracks.has(record.videoId) || !Array.isArray(record.evidence)) throw new Error('Invalid or duplicate track');
    for (const item of record.evidence) {
      if (!item || !['creator_declaration','signed_provenance','user_report','model_estimate'].includes(item.kind) ||
        !['ai_generated','ai_assisted','human','unknown'].includes(item.claim) ||
        !['pending','accepted','rejected','withdrawn'].includes(item.reviewState) ||
        typeof item.sourceUrl !== 'string' || !item.sourceUrl.startsWith('https://')) throw new Error('Invalid evidence');
    }
    evaluateTrack(record);
    tracks.set(record.videoId, structuredClone(record));
  }
  return tracks;
}
