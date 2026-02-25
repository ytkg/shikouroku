import { useEffect } from "react";

const BRAND_NAME = "shikouroku";
const BRAND_SUFFIX = ` | ${BRAND_NAME}`;
const DEFAULT_OG_IMAGE_PATH = "/ogp-default.png";
const DYNAMIC_JSON_LD_ID = "dynamic-seo-json-ld";

type SeoJsonLd = Record<string, unknown>;

export type SeoOptions = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
  ogImagePath?: string;
  jsonLd?: SeoJsonLd | SeoJsonLd[];
};

function toAbsoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

function withBrandSuffix(title: string): string {
  if (title.endsWith(BRAND_SUFFIX)) {
    return title;
  }
  return `${title}${BRAND_SUFFIX}`;
}

function upsertMeta(selectorName: "name" | "property", key: string, content: string): void {
  const selector = `meta[${selectorName}="${key}"]`;
  let metaTag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.setAttribute(selectorName, key);
    document.head.append(metaTag);
  }
  metaTag.content = content;
}

function upsertCanonicalLink(href: string): void {
  let linkTag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!linkTag) {
    linkTag = document.createElement("link");
    linkTag.rel = "canonical";
    document.head.append(linkTag);
  }
  linkTag.href = href;
}

function removeDynamicJsonLd(): void {
  const existingScript = document.getElementById(DYNAMIC_JSON_LD_ID);
  if (existingScript) {
    existingScript.remove();
  }
}

function setDynamicJsonLd(jsonLd: SeoOptions["jsonLd"]): void {
  removeDynamicJsonLd();
  if (!jsonLd) {
    return;
  }

  const script = document.createElement("script");
  script.id = DYNAMIC_JSON_LD_ID;
  script.type = "application/ld+json";
  script.text = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
  document.head.append(script);
}

export function applySeo(options: SeoOptions): void {
  const canonicalUrl = toAbsoluteUrl(options.path ?? window.location.pathname);
  const ogImageUrl = toAbsoluteUrl(options.ogImagePath ?? DEFAULT_OG_IMAGE_PATH);
  const normalizedTitle = withBrandSuffix(options.title);
  const robotsContent = options.noIndex ? "noindex, nofollow" : "index, follow";

  document.title = normalizedTitle;

  upsertCanonicalLink(canonicalUrl);
  upsertMeta("name", "description", options.description);
  upsertMeta("name", "robots", robotsContent);

  upsertMeta("property", "og:title", normalizedTitle);
  upsertMeta("property", "og:description", options.description);
  upsertMeta("property", "og:type", options.ogType ?? "website");
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:site_name", BRAND_NAME);
  upsertMeta("property", "og:image", ogImageUrl);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", normalizedTitle);
  upsertMeta("name", "twitter:description", options.description);
  upsertMeta("name", "twitter:image", ogImageUrl);

  setDynamicJsonLd(options.jsonLd);
}

export function useSeo(options: SeoOptions | null): void {
  useEffect(() => {
    if (!options) {
      return;
    }
    const { title, description, path, noIndex, ogType, ogImagePath, jsonLd } = options;
    applySeo({ title, description, path, noIndex, ogType, ogImagePath, jsonLd });
  }, [options]);
}
