import Image from "next/image";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}

export function WatermarkedImage({
  src,
  alt,
  priority = false,
  sizes,
  className = "",
}: WatermarkedImageProps) {
  return (
    <div className={`relative overflow-hidden bg-[#f2f2f0] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        className="object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="watermark -rotate-6 select-none text-[clamp(0.7rem,2.2vw,1.25rem)] font-semibold tracking-[0.08em] text-white/52">
          Instagram: @social.bil
        </span>
      </div>
    </div>
  );
}
