/**
 * Logo resmi Laundro (komponen React SVG murni).
 * Mendukung varian "mark" (ikon saja) dan "full" (ikon + wordmark),
 * serta adaptif di Light Mode dan Dark Mode lewat currentColor dan token text-utama.
 */
export default function LogoLaundro({
  varian = "full",
  className = "",
  nama = "Laundro",
}) {
  const isMarkOnly = varian === "mark";
  const label = String(nama || "Laundro").trim() || "Laundro";

  const markSvg = (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden={!isMarkOnly}
      role={isMarkOnly ? "img" : undefined}
      aria-label={isMarkOnly ? label : undefined}
      className={isMarkOnly ? `shrink-0 ${className || "h-7 w-7"}` : "h-7 w-7 shrink-0"}
    >
      {isMarkOnly ? <title>{label}</title> : null}
      <path
        fill="currentColor"
        d="M 24 44 A 20 20 0 0 1 64 44 L 64 168 A 24 24 0 0 0 88 192 L 212 192 A 20 20 0 0 1 212 232 L 88 232 A 64 64 0 0 1 24 168 Z"
      />
      <path
        className="text-utama"
        fill="currentColor"
        d="M 156 32 A 68 68 0 1 0 224 100 A 16 16 0 0 0 192 100 A 36 36 0 1 1 156 64 A 16 16 0 0 0 156 32 Z"
      />
      <circle className="text-utama" cx="208" cy="48" r="16" fill="currentColor" />
    </svg>
  );

  if (isMarkOnly) {
    return markSvg;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 text-teks ${className}`}>
      {markSvg}
      <span className="text-[18px] font-semibold tracking-[-0.025em] leading-none">
        {label}
      </span>
    </span>
  );
}
