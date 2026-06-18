export function dedupeAndSort(messages: any[]): any[] {
  const map = new Map<string, any>();
  for (const m of messages) {
    const existing = map.get(m.entity_id);
    if (!existing || new Date(m.updated_at) > new Date(existing.updated_at)) {
      map.set(m.entity_id, m);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const getDate = (m: any) => {
      if (m.data?.internalDate) return Number(m.data.internalDate);
      if (m.internalDate) return Number(m.internalDate);
      return new Date(m.updated_at).getTime();
    };
    return getDate(b) - getDate(a);
  });
}
