import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uiDirPath = path.resolve(
  currentDir,
  "../../../../../src/features/entities/list/ui"
);

describe("entity list page content infinite scroll", () => {
  it("IntersectionObserver で画面下部到達時に loadMore を自動実行する", () => {
    const source = fs.readFileSync(path.resolve(uiDirPath, "use-infinite-load-trigger.ts"), "utf-8");

    expect(source).toContain("const triggerRef = useRef<HTMLDivElement | null>(null);");
    expect(source).toContain("new IntersectionObserver(");
    expect(source).toContain("if (!entry?.isIntersecting || autoLoadPendingRef.current || isLoadingMore)");
    expect(source).toContain("autoLoadPendingRef.current = true;");
    expect(source).toContain("void onLoadMore();");
  });

  it("IntersectionObserver 非対応時は手動のもっと見るボタンを表示する", () => {
    const pageSource = fs.readFileSync(path.resolve(uiDirPath, "entity-list-page-content.tsx"), "utf-8");
    const loadMoreSource = fs.readFileSync(path.resolve(uiDirPath, "entity-list-load-more.tsx"), "utf-8");

    expect(pageSource).toContain("const canUseIntersectionObserver = typeof IntersectionObserver !== \"undefined\";");
    expect(loadMoreSource).toContain("canUseIntersectionObserver ? (");
    expect(loadMoreSource).toContain("{isLoadingMore ? \"読み込み中...\" : \"もっと見る\"}");
  });

  it("検索入力のIME変換中は確定イベントでのみ検索更新する", () => {
    const pageSource = fs.readFileSync(path.resolve(uiDirPath, "entity-list-page-content.tsx"), "utf-8");
    const searchOptionsSource = fs.readFileSync(path.resolve(uiDirPath, "entity-search-options.tsx"), "utf-8");

    expect(searchOptionsSource).toContain("onCompositionStart={onQueryCompositionStart}");
    expect(searchOptionsSource).toContain("onCompositionEnd={onQueryCompositionEnd}");
    expect(searchOptionsSource).toContain("onBlur={onQueryCompositionEnd}");
    expect(pageSource).toContain("if (isSearchOptionsOpen) {");
    expect(pageSource).toContain("page.endQueryComposition();");
  });

  it("初回検索中でも空のmainを返さず、読み込み文言を表示する", () => {
    const source = fs.readFileSync(path.resolve(uiDirPath, "entity-list-page-content.tsx"), "utf-8");

    expect(source).not.toContain("if (page.isLoading && page.entities.length === 0)");
    expect(source).toContain('{page.isLoading ? "読み込み中..." : "表示できる登録がありません。"}');
  });

  it("一覧カードはLink経由で遷移し、タグクリックは独立してタグ検索を適用する", () => {
    const source = fs.readFileSync(path.resolve(uiDirPath, "entity-list-result-card.tsx"), "utf-8");

    expect(source).toContain("import { Link } from \"react-router-dom\";");
    expect(source).toContain("<Link");
    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("detailPath");
    expect(source).toContain("detailSearch");
    expect(source).toContain("onClick={() => onTagClick(tag.name)}");
  });

  it("一覧ページはカードへ詳細遷移先をpropsで渡し、navigate依存を持たない", () => {
    const source = fs.readFileSync(path.resolve(uiDirPath, "entity-list-page-content.tsx"), "utf-8");

    expect(source).not.toContain("useNavigate");
    expect(source).toContain("detailPath={getEntityDetailPath(entity.id)}");
    expect(source).toContain("detailSearch={location.search}");
  });

  it("カード内のタグ領域はLink外に配置され、イベント競合回避を構造で担保する", () => {
    const source = fs.readFileSync(path.resolve(uiDirPath, "entity-list-result-card.tsx"), "utf-8");

    expect(source).not.toContain("event.stopPropagation()");
    expect(source.indexOf("</Link>")).toBeLessThan(source.indexOf("{entity.tags.length > 0 && ("));
  });
});
