"use client";

import { useEffect, useRef, useState } from "react";

const EMPTY_IMAGE_SRC = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";
const loadedImageFilenames = new Set();

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
  const displaySrc = image.previewSrc ?? image.src;
  const isKnownLoaded = loadedImageFilenames.has(image.filename);
  const [isLoaded, setIsLoaded] = useState(isKnownLoaded);
  const [shouldLoad, setShouldLoad] = useState(index < 6 || isKnownLoaded);
  const [orientation, setOrientation] = useState(image.orientation);
  const articleRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const knownLoaded = loadedImageFilenames.has(image.filename);

    setIsLoaded(knownLoaded);
    setShouldLoad(index < 6 || knownLoaded);
    setOrientation(image.orientation);
  }, [image.filename, image.orientation, displaySrc, index]);

  useEffect(() => {
    const current = articleRef.current;

    if (!current || shouldLoad) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad]);

  useEffect(() => {
    const current = imageRef.current;

    if (!current || !shouldLoad) {
      return undefined;
    }

    const handleReady = () => {
      const nextOrientation = getOrientation(current.naturalWidth, current.naturalHeight) ?? image.orientation;
      loadedImageFilenames.add(image.filename);
      setOrientation(nextOrientation);
      setIsLoaded(true);
    };

    if (current.complete && current.currentSrc !== EMPTY_IMAGE_SRC) {
      handleReady();
    } else {
      current.addEventListener("load", handleReady);
      current.addEventListener("error", handleReady);
    }

    const timer = window.setTimeout(handleReady, 2500);

    return () => {
      current.removeEventListener("load", handleReady);
      current.removeEventListener("error", handleReady);
      window.clearTimeout(timer);
    };
  }, [image.orientation, displaySrc, shouldLoad]);

  return (
    <article
      ref={articleRef}
      className={`${getLayoutClass(orientation)}${isLoaded ? "" : " gallery-item--hidden"}`}
      onClick={onClick}
    >
      <img
        ref={imageRef}
        src={shouldLoad ? displaySrc : EMPTY_IMAGE_SRC}
        alt={image.filename}
        loading={index < 4 ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={index < 4 ? "high" : "low"}
        onLoad={(event) => {
          if (event.currentTarget.currentSrc === EMPTY_IMAGE_SRC) {
            return;
          }

          loadedImageFilenames.add(image.filename);
          setIsLoaded(true);
        }}
        onError={() => {
          if (!shouldLoad) {
            return;
          }

          setIsLoaded(true);
        }}
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
