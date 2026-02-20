import { describe, expect, it } from "vitest";
import { isTombstoneExpired, mergeByUpdatedAt, purgeExpiredTombstones } from "./syncMerge.js";

describe("mergeByUpdatedAt", () => {
  it("uses cloud when local is absent", () => {
    const result = mergeByUpdatedAt({
      local: { exists: false },
      cloud: { exists: true, updatedAt: 10, value: "cloud" }
    });
    expect(result.winner).toBe("cloud");
    expect(result.reason).toBe("local-missing");
  });

  it("keeps local when cloud is absent", () => {
    const result = mergeByUpdatedAt({
      local: { exists: true, updatedAt: 10, value: "local" },
      cloud: { exists: false }
    });
    expect(result.winner).toBe("local");
    expect(result.reason).toBe("cloud-missing");
  });

  it("cloud wins when cloud updatedAt is newer", () => {
    const result = mergeByUpdatedAt({
      local: { exists: true, updatedAt: 10, value: "local" },
      cloud: { exists: true, updatedAt: 11, value: "cloud" }
    });
    expect(result.winner).toBe("cloud");
    expect(result.reason).toBe("cloud-newer");
  });

  it("local wins when local updatedAt is newer", () => {
    const result = mergeByUpdatedAt({
      local: { exists: true, updatedAt: 12, value: "local" },
      cloud: { exists: true, updatedAt: 11, value: "cloud" }
    });
    expect(result.winner).toBe("local");
    expect(result.reason).toBe("local-newer");
  });

  it("cloud is preferred on equal updatedAt", () => {
    const result = mergeByUpdatedAt({
      local: { exists: true, updatedAt: 12, value: "local" },
      cloud: { exists: true, updatedAt: 12, value: "cloud" }
    });
    expect(result.winner).toBe("cloud");
    expect(result.reason).toBe("equal-ts-conflict");
  });

  it("deleted tombstone is prioritized at equal timestamp", () => {
    const result = mergeByUpdatedAt({
      local: { exists: true, updatedAt: 12, deleted: true, value: null },
      cloud: { exists: true, updatedAt: 12, deleted: false, value: "cloud" }
    });
    expect(result.winner).toBe("local");
    expect(result.record.deleted).toBe(true);
  });
});

describe("tombstone TTL helpers", () => {
  it("detects expired tombstone", () => {
    const expired = isTombstoneExpired(
      { deleted: true, updatedAt: 1_000 },
      { now: 40_000, ttlMs: 30_000 }
    );
    expect(expired).toBe(true);
  });

  it("purges expired tombstones from collection", () => {
    const records = [
      { id: "a", deleted: true, updatedAt: 1_000 },
      { id: "b", deleted: true, updatedAt: 20_000 },
      { id: "c", deleted: false, updatedAt: 1_000 }
    ];
    const purged = purgeExpiredTombstones(records, { now: 40_000, ttlMs: 30_000 });
    expect(purged.map(r => r.id)).toEqual(["b", "c"]);
  });
});

