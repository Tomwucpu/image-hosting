"use client";

import { useEffect, useRef, useState } from "react";

function getOrientation(width, height) {
  if (!width || !height) {
    return null;
  }

  if (height > width) {
    return "portrait";
  }

  if (width > height) {
    return "landscape";
  }

  return "square";
}

function getLayoutClass(orientation) {
  if (orientation === "landscape") {
    return "gallery-item gallery-item--wide";
  }

  if (orientation === "portrait") {
    return "gallery-item gallery-item--tall";
  }

  return "gallery-item";
}

export default function GalleryItem({ image, index, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [orientation, setOrientation] = useState(image.orientation);
  const imageRef = useRef(null);

  useEffect(() => {
    const current = imageRef.current;

    if (!current) {
      return undefined;
    }

    const handleReady = () => {
      const nextOrientation = getOrientation(current.naturalWidth, current.naturalHeight) ?? image.orientation;
      setOrientation(nextOrientation);
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
  }, [image.src, image.orientation]);

  return (
    <article
      className={`${getLayoutClass(orientation)}${isLoaded ? "" : " gallery-item--hidden"}`}
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
        <p className="gallery-overlay-title">{image.filename}</p>
        <p className="gallery-overlay-meta">
          {image.dimensionLabel === "尺寸待补充" ? image.size : image.dimensionLabel}
        </p>
      </div>
    </article>
  );
}
