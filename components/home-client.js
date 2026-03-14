"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ThemeToggle from "@/components/theme-toggle";

function pickRandomImage(images, currentFilename) {
  if (!images.length) {
    return null;
  }

  if (images.length === 1) {
    return images[0];
  }

  const nextPool = images.filter((image) => image.filename !== currentFilename);
  const randomIndex = Math.floor(Math.random() * nextPool.length);

  return nextPool[randomIndex];
}

function getOrientationLabel(orientation) {
  if (orientation === "portrait") {
    return "竖屏";
  }

  if (orientation === "landscape") {
    return "横屏";
  }

  if (orientation === "square") {
    return "方图";
  }

  return "未识别";
}

export default function HomeClient({ images }) {
  const [origin, setOrigin] = useState("");
  const [currentImage, setCurrentImage] = useState(images[0] ?? null);
  const [bgUrl, setBgUrl] = useState(images[0]?.src ?? "");
  const [isLoaded, setIsLoaded] = useState(Boolean(images[0]?.src));

  const apiUrl = useMemo(() => {
    return origin ? `${origin}/api/random` : "/api/random";
  }, [origin]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    document.body.style.overflow = "hidden";

    if (!images.length) {
      return () => {
        document.body.style.overflow = "";
      };
    }

    const initialImage = images[Math.floor(Math.random() * images.length)];
    const preload = new window.Image();

    preload.src = initialImage.src;
    preload.onload = () => {
      setCurrentImage(initialImage);
      setBgUrl(initialImage.src);
      setIsLoaded(true);
    };
    preload.onerror = () => {
      setCurrentImage(initialImage);
      setBgUrl(initialImage.src);
      setIsLoaded(true);
    };

    return () => {
      document.body.style.overflow = "";
    };
  }, [images]);

  const handleRefresh = () => {
    const nextImage = pickRandomImage(images, currentImage?.filename);

    if (!nextImage) {
      return;
    }

    setIsLoaded(false);

    const preload = new window.Image();
    preload.src = nextImage.src;
    preload.onload = () => {
      setCurrentImage(nextImage);
      setBgUrl(nextImage.src);
      setIsLoaded(true);
    };
    preload.onerror = () => {
      setCurrentImage(nextImage);
      setBgUrl(nextImage.src);
      setIsLoaded(true);
    };
  };

  if (!images.length) {
    return (
      <main className="empty-state">
        <div>
          <h1>暂无图片</h1>
          <p>请先在 public/image-scenery 中放入图片，启动或部署时会自动生成清单。</p>
        </div>
      </main>
    );
  }

  return (
    <div className="home-shell">
      <div className="home-toolbar">
        <ThemeToggle />
      </div>

      <div className="home-stage" style={{ opacity: isLoaded ? 1 : 0.2, transition: "opacity 700ms ease" }}>
        <div className="home-backdrop" style={{ backgroundImage: `url("${bgUrl}")` }} />
        <div className="home-veil" />
      </div>

      <main className="home-content">
        <div className="home-copy">
          <h1 className="home-title">Random Picture</h1>
          <p className="home-subtitle">Immersive image landing page</p>

          <div className="home-api">
            <code>{apiUrl}</code>
            <div className="home-divider" />
          </div>

          <div className="home-actions">
            <button type="button" className="home-button" onClick={handleRefresh}>
              随机一张
            </button>
            <Link href="/gallery" className="home-link">
              所有图片
            </Link>
          </div>

          {currentImage ? (
            <div className="home-current">
              <div className="home-current-label">Current image</div>
              <p className="home-current-title">{currentImage.filename}</p>
              <p className="home-current-meta">
                {getOrientationLabel(currentImage.orientation)} · {currentImage.dimensionLabel}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-footer-brand">Image Hosting</div>
        <div className="home-footer-meta">
          共 {images.length} 张图片 · Powered by Next.js
        </div>
      </footer>
    </div>
  );
}
