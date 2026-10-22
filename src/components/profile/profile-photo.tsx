import Image from "next/image";

/** The user's own photo; supports both /public paths and picked-photo data URLs. */
export function ProfilePhoto({ src, alt, size, className = "" }: { src: string; alt: string; size: number; className?: string }) {
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
