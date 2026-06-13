/* eslint-disable */
// @ts-nocheck
export function dedupeAndSort(messages: any[]): any[] {
  const deduped = new Map();
  for (const msg of messages) {
    const existing = deduped.get(msg.entity_id);
    if (!existing || new Date(msg.updated_at) > new Date(existing.updated_at)) {
      deduped.set(msg.entity_id, msg);
    }
  }
  return Array.from(deduped.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}
