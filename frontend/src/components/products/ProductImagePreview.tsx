import { useState } from "react";

export function shouldShowProductImage(imageUrl?: string | null, failed = false) {
  return Boolean(imageUrl && !failed);
}

export function ProductImagePreview({ imageUrl, alt, className = "productImage", showFallback = false }: { imageUrl?: string | null; alt: string; className?: string; showFallback?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!shouldShowProductImage(imageUrl, failed)) return showFallback ? <span className={`${className} productImageFallback`} role="img" aria-label={`Kein Bild für ${alt} verfügbar`}>Kein Bild</span> : null;
  return <img className={className} src={imageUrl ?? ""} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
