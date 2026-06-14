export function dedupeAndSort(messages: any[]): any[] {
  const map = new Map<string, any>();
  for (const m of messages) {
    const existing = map.get(m.entity_id);
    if (!existing || new Date(m.updated_at) > new Date(existing.updated_at)) {
      map.set(m.entity_id, m);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}
