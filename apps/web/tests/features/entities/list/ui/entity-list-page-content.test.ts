import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const pageContentPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/list/ui/entity-list-page-content.tsx"
);

describe("entity list page content infinite scroll", () => {
  it("IntersectionObserver で画面下部到達時に loadMore を自動実行する", () => {
    const source = fs.readFileSync(pageContentPath, "utf-8");

    expect(source).toContain("const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);");
    expect(source).toContain("new IntersectionObserver(");
    expect(source).toContain("if (!entry?.isIntersecting || autoLoadPendingRef.current || page.isLoadingMore)");
    expect(source).toContain("autoLoadPendingRef.current = true;");
    expect(source).toContain("void page.loadMore();");
  });

  it("IntersectionObserver 非対応時は手動のもっと見るボタンを表示する", () => {
    const source = fs.readFileSync(pageContentPath, "utf-8");

    expect(source).toContain("const canUseIntersectionObserver = typeof IntersectionObserver !== \"undefined\";");
    expect(source).toContain("canUseIntersectionObserver ? (");
    expect(source).toContain("{page.isLoadingMore ? \"読み込み中...\" : \"もっと見る\"}");
  });

  it("検索入力のIME変換中は確定イベントでのみ検索更新する", () => {
    const source = fs.readFileSync(pageContentPath, "utf-8");

    expect(source).toContain("onCompositionStart={page.startQueryComposition}");
    expect(source).toContain("onCompositionEnd={page.endQueryComposition}");
    expect(source).toContain("onBlur={page.endQueryComposition}");
    expect(source).toContain("if (isSearchOptionsOpen) {");
    expect(source).toContain("page.endQueryComposition();");
  });

  it("初回検索中でも空のmainを返さず、読み込み文言を表示する", () => {
    const source = fs.readFileSync(pageContentPath, "utf-8");

    expect(source).not.toContain("if (page.isLoading && page.entities.length === 0)");
    expect(source).toContain('{page.isLoading ? "読み込み中..." : "表示できる登録がありません。"}');
  });

  it("一覧タグクリック時は詳細遷移を止めてタグ検索を適用する", () => {
    const source = fs.readFileSync(pageContentPath, "utf-8");

    expect(source).toContain("event.stopPropagation();");
    expect(source).toContain("page.applyTagFilter(tag.name);");
  });
});
