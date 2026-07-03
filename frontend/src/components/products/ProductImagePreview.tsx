import { useState } from "react";

export function shouldShowProductImage(imageUrl?: string | null, failed = false) {
  return Boolean(imageUrl && !failed);
}

export function ProductImagePreview({ imageUrl, alt, className = "productImage" }: { imageUrl?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!shouldShowProductImage(imageUrl, failed)) return null;
  return <img className={className} src={imageUrl ?? ""} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
