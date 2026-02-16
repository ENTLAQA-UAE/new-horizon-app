/**
 * Kawadir brand icon component — renders the shared favicon image
 * at the requested size. Drop-in replacement for lucide Sparkles.
 */
export function KawadirIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <img
      src="/new-favicon-final.PNG"
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  )
}
