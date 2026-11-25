// A worker is assigned if their uid is in staffIds.
// Falls back to staff[].id for old documents that haven't been backfilled yet.
export function isAssigned(work, uid) {
  if (!work || !uid) return false;
  const ids = Array.isArray(work.staffIds)
    ? work.staffIds
    : (work.staff || []).map((s) => s.id);
  return ids.includes(uid);
}