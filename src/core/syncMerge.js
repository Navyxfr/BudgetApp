const normalize = record => ({
  exists: !!record?.exists,
  deleted: !!record?.deleted,
  updatedAt: Number(record?.updatedAt || 0),
  value: record?.value ?? null
});

export function isTombstoneExpired(record, { ttlMs, now = Date.now() } = {}) {
  if (!record?.deleted) return false;
  if (!ttlMs || ttlMs <= 0) return false;
  const ts = Number(record.updatedAt || 0);
  if (!ts) return false;
  return now - ts >= ttlMs;
}

export function purgeExpiredTombstones(records, { ttlMs, now = Date.now() } = {}) {
  if (!Array.isArray(records)) return [];
  return records.filter(r => !isTombstoneExpired(r, { ttlMs, now }));
}

export function mergeByUpdatedAt({ local, cloud, preferOnEqual = "cloud" }) {
  const l = normalize(local);
  const c = normalize(cloud);

  if (!l.exists && !c.exists) {
    return { winner: "none", record: { exists: false, deleted: false, updatedAt: 0, value: null }, reason: "none" };
  }
  if (!l.exists) return { winner: "cloud", record: c, reason: "local-missing" };
  if (!c.exists) return { winner: "local", record: l, reason: "cloud-missing" };

  if (l.updatedAt > c.updatedAt) return { winner: "local", record: l, reason: "local-newer" };
  if (c.updatedAt > l.updatedAt) return { winner: "cloud", record: c, reason: "cloud-newer" };

  // Same updatedAt: deletion wins over data to avoid resurrection.
  if (l.deleted !== c.deleted) {
    return l.deleted
      ? { winner: "local", record: l, reason: "equal-ts-local-deleted" }
      : { winner: "cloud", record: c, reason: "equal-ts-cloud-deleted" };
  }

  if (l.value === c.value) return { winner: preferOnEqual, record: preferOnEqual === "local" ? l : c, reason: "equal-ts-same-value" };
  return { winner: preferOnEqual, record: preferOnEqual === "local" ? l : c, reason: "equal-ts-conflict" };
}
