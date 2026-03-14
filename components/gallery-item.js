"use client";

import { useEffect, useRef, useState } from "react";

function getLayoutClass(layout) {
  if (layout === "feature") {
    return "gallery-item gallery-item--feature";
  }

  if (layout === "wide") {
    return "gallery-item gallery-item--wide";
  }

  if (layout === "tall") {
    return "gallery-item gallery-item--tall";
  }

  return "gallery-item";
}

export default function GalleryItem({ image, index, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    const current = imageRef.current;

    if (!current) {
      return undefined;
    }

    const handleReady = () => {
      setIsLoaded(true);
    };

    if (current.complete) {
      handleReady();
    } else {
      current.addEventListener("load", handleReady);
      current.addEventListener("error", handleReady);

      if (current.decode) {
        current.decode().then(handleReady).catch(handleReady);
      }
    }

    const timer = window.setTimeout(handleReady, 2500);

    return () => {
      current.removeEventListener("load", handleReady);
      current.removeEventListener("error", handleReady);
      window.clearTimeout(timer);
    };
  }, [image.src]);

  return (
    <article
      className={`${getLayoutClass(image.layout)}${isLoaded ? "" : " gallery-item--hidden"}`}
      onClick={onClick}
    >
      <img
        ref={imageRef}
        src={image.src}
        alt={image.alt}
        loading={index < 12 ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
      <div className="gallery-overlay">
        <p className="gallery-overlay-title">{image.title}</p>
        <p className="gallery-overlay-meta">
          {image.filename} · {image.type}
        </p>
      </div>
    </article>
  );
}
