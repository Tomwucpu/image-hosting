"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import GalleryItem from "@/components/gallery-item";
import ThemeToggle from "@/components/theme-toggle";

const LIGHTBOX_CLOSE_DURATION = 280;

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

export default function GalleryClient({ images }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isLightboxClosing, setIsLightboxClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "";

      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const galleryImages = useMemo(() => {
    return [...images];
  }, [images]);

  const finishClose = () => {
    setLightboxImage(null);
    setIsLightboxClosing(false);
    setCopied(false);
    document.body.style.overflow = "auto";
    closeTimerRef.current = null;
  };

  const requestClose = () => {
    if (!lightboxImage || isLightboxClosing) {
      return;
    }

    setIsLightboxClosing(true);
    setCopied(false);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(finishClose, LIGHTBOX_CLOSE_DURATION);
  };

  useEffect(() => {
    if (!lightboxImage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImage, isLightboxClosing]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }

      copyResetTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleOpen = (image) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setLightboxImage(image);
    setIsLightboxClosing(false);
    setCopied(false);
    document.body.style.overflow = "hidden";
  };

  if (!galleryImages.length) {
    return (
      <main className="empty-state">
        <div>
          <h1>暂无图片</h1>
          <p>请先在 public/image-scenery 中补充图片资源。</p>
        </div>
      </main>
    );
  }

  const selectedImageUrl =
    lightboxImage && typeof window !== "undefined"
      ? new URL(lightboxImage.src, window.location.href).toString()
      : lightboxImage?.src ?? "";

  return (
    <div className="gallery-shell">
      <header className="gallery-header">
        <div className="gallery-brand">
          <Link href="/" className="gallery-brand-link">
            Gallery
          </Link>
          <div className="gallery-count">全部图片 · {galleryImages.length}</div>
        </div>

        <div className="gallery-tools">
          <div className="gallery-count">Random Picture Archive</div>
          <ThemeToggle solid />
        </div>
      </header>

      <main className="gallery-grid">
        {galleryImages.map((image, index) => (
          <GalleryItem
            key={image.id}
            image={image}
            index={index}
            onClick={() => handleOpen(image)}
          />
        ))}
      </main>

      {lightboxImage ? (
        <div
          className={`lightbox${isLightboxClosing ? " lightbox--closing" : ""}`}
          onClick={requestClose}
        >
          <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <div className="lightbox-visual">
              <img src={lightboxImage.src} alt={lightboxImage.alt} />
            </div>

            <aside className="lightbox-side">
              <div className="lightbox-toolbar">
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestClose();
                  }}
                  aria-label="关闭预览"
                >
                  ×
                </button>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">文件名</div>
                <div className="lightbox-value">{lightboxImage.filename}</div>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">资源地址</div>
                <div className="lightbox-linkbox">{selectedImageUrl}</div>
                <button
                  type="button"
                  className="lightbox-button"
                  onClick={() => handleCopy(selectedImageUrl)}
                >
                  {copied ? "已复制链接" : "复制图片链接"}
                </button>
              </div>

              <div className="lightbox-meta-grid">
                <div className="lightbox-group">
                  <div className="lightbox-label">分辨率</div>
                  <div className="lightbox-value">{lightboxImage.dimensionLabel}</div>
                </div>
                <div className="lightbox-group">
                  <div className="lightbox-label">文件大小</div>
                  <div className="lightbox-value">{lightboxImage.size}</div>
                </div>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">方向</div>
                <div className="lightbox-value">{getOrientationLabel(lightboxImage.orientation)}</div>
              </div>

              <div className="lightbox-actions">
                <a className="lightbox-download" href={lightboxImage.src} download>
                  保存图片
                </a>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      <footer className="gallery-footer">
        © {new Date().getFullYear()} Image Hosting · Inspired by EdgeOne Random Picture
      </footer>
    </div>
  );
}
