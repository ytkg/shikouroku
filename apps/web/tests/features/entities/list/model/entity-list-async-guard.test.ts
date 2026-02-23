import { describe, expect, it, vi } from "vitest";
import { createEntityListAsyncGuard } from "@/features/entities/list/model/entity-list-async-guard";

describe("entity-list async guard", () => {
  it("現在の条件キーに一致する場合だけコールバックを実行する", () => {
    const guard = createEntityListAsyncGuard("criteria-a");
    const onCurrent = vi.fn();

    expect(guard.runIfCurrent("criteria-a", onCurrent)).toBe(true);
    expect(onCurrent).toHaveBeenCalledTimes(1);
  });

  it("条件変更後の古い結果は無視する", () => {
    const guard = createEntityListAsyncGuard("criteria-a");
    const onStale = vi.fn();

    guard.sync("criteria-b");

    expect(guard.runIfCurrent("criteria-a", onStale)).toBe(false);
    expect(onStale).not.toHaveBeenCalled();
  });

  it("loadMore失敗のような遅延エラーも条件不一致なら無視する", () => {
    const guard = createEntityListAsyncGuard("criteria-a");
    const applyError = vi.fn();

    guard.sync("criteria-b");

    expect(guard.runIfCurrent("criteria-a", applyError)).toBe(false);
    expect(guard.isCurrent("criteria-a")).toBe(false);
    expect(guard.isCurrent("criteria-b")).toBe(true);
    expect(applyError).not.toHaveBeenCalled();
  });
});
