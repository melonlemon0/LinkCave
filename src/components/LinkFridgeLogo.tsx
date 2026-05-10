import Image from "next/image";

type Props = {
  /** Pixel width/height (square box; image keeps aspect ratio inside). */
  size?: number;
  className?: string;
  /** Use `alt=""` when visible text (e.g. “LinkFridge”) already labels the control. */
  alt?: string;
  /** LCP / header: set true for above-the-fold brand. */
  priority?: boolean;
};

/** Brand mark from `/public/logogo.png`. */
export function LinkFridgeLogo({
  size = 32,
  className = "",
  alt = "LinkFridge",
  priority = false,
}: Props) {
  return (
    <Image
      src="/logogo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
