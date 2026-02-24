type RelatedEntityCardProps = {
  label: string;
  firstImageUrl?: string | null;
  imageAlt?: string;
  interactive?: boolean;
  onSelect?: () => void;
};

export function RelatedEntityCard({
  label,
  firstImageUrl,
  imageAlt,
  interactive = false,
  onSelect
}: RelatedEntityCardProps) {
  const rootClassName = `rounded-lg border border-border/70 bg-card/80 ${
    firstImageUrl ? "overflow-hidden p-0" : "px-3"
  }`;
  const content = (
    <div className="flex min-h-16 items-center gap-3">
      <div className={`min-w-0 flex-1 ${firstImageUrl ? "px-3" : ""}`}>
        <p className="ui-body-text text-left">{label}</p>
      </div>
      {firstImageUrl && (
        <div className="h-16 w-16 shrink-0 overflow-hidden border-l border-border/70 bg-muted">
          <img
            src={firstImageUrl}
            alt={imageAlt ?? `${label}の画像サムネイル`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );

  if (!interactive || !onSelect) {
    return <div className={rootClassName}>{content}</div>;
  }

  return (
    <article
      role="link"
      tabIndex={0}
      className={`${rootClassName} cursor-pointer transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        onSelect();
      }}
    >
      {content}
    </article>
  );
}
