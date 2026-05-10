import Image from "next/image";

/** `/public/logo letter.png` — URL-encoded space. */
const SRC = "/logo%20letter.png";
const W = 2143;
const H = 778;

type Props = {
  className?: string;
  /** Tailwind height/width for layout, e.g. `h-7 w-auto` */
  heightClass?: string;
  alt?: string;
  priority?: boolean;
};

export function LinkFridgeWordmark({
  className = "",
  heightClass = "h-7 w-auto",
  alt = "LinkFridge",
  priority = false,
}: Props) {
  return (
    <Image
      src={SRC}
      alt={alt}
      width={W}
      height={H}
      priority={priority}
      className={`shrink-0 object-contain ${heightClass} ${className}`.trim()}
    />
  );
}
