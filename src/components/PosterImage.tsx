"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface PosterImageProps {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export default function PosterImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 1024px) 50vw, 33vw",
  className = "object-cover",
}: PosterImageProps) {
  const [imgSrc, setImgSrc] = useState(src || "/images/no-poster.webp");

  useEffect(() => {
    setImgSrc(src || "/images/no-poster.webp");
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setImgSrc("/images/no-poster.webp")}
    />
  );
}
