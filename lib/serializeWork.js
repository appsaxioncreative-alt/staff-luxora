const iso = (v) => (v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : null);

function log(entry) {
  return entry ? { at: iso(entry.at), by: entry.by || null } : null;
}

// Turns a Firestore "works" document into plain JSON for the browser.
// The worker app only ADDS these fields to a work: fieldStage, fieldLog, returnReport.
// It never changes the admin's fields (status, items, staff, ...).
export function toJob(d) {
  const w = d.data();
  const fl = w.fieldLog || {};
  return {
    id: d.id,
    name: w.name,
    venueType: w.venueType,
    location: w.location,
    startAt: iso(w.startAt),
    contactName: w.contactName || "",
    contactPhone: w.contactPhone || "",
    items: w.items || [],
    staff: w.staff || [],
    vehicles: w.vehicles || [],
    status: w.status, // ongoing | completed | cancelled (set by the admin panel)
    fieldStage: w.fieldStage || "assigned", // assigned | delivered | unloaded | returned
    fieldLog: { delivered: log(fl.delivered), unloaded: log(fl.unloaded), returned: log(fl.returned) },
    returnReport: w.returnReport
      ? { ...w.returnReport, submittedAt: iso(w.returnReport.submittedAt) }
      : null,
    createdAt: iso(w.createdAt),
  };
}
