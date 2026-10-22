import Image from "next/image";

/**
 * The user's own photo; supports /public paths and picked-photo data URLs.
 * With no photo yet, shows their initial.
 */
export function ProfilePhoto({ src, alt, size, className = "" }: { src: string; alt: string; size: number; className?: string }) {
  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-heading font-bold text-white ${className}`}
      >
        {alt.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={src.startsWith("data:")}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      priority
    />
  );
}
