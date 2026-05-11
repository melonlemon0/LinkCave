import Image from "next/image";

type Props = {
  /** Pixel width/height (square box; image keeps aspect ratio inside). */
  size?: number;
  className?: string;
  /** Use `alt=""` when the image alone is sufficient (decorative / home link). */
  alt?: string;
  /** LCP / header: set true for above-the-fold brand. */
  priority?: boolean;
};

/** Brand mark from `/public/linkfridge.png`. */
export function LinkFridgeLogo({
  size = 32,
  className = "",
  alt = "",
  priority = false,
}: Props) {
  return (
    <Image
      src="/linkfridge.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
