"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import GalleryItem from "@/components/gallery-item";
import ThemeToggle from "@/components/theme-toggle";

export default function GalleryClient({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "";
      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  const galleryImages = useMemo(() => {
    return [...images];
  }, [images]);

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
    setSelectedImage(image);
    setCopied(false);
    document.body.style.overflow = "hidden";
  };

  const handleClose = () => {
    setSelectedImage(null);
    setCopied(false);
    document.body.style.overflow = "auto";
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
    selectedImage && typeof window !== "undefined"
      ? new URL(selectedImage.src, window.location.href).toString()
      : selectedImage?.src ?? "";

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

      {selectedImage ? (
        <div className="lightbox" onClick={handleClose}>
          <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <div className="lightbox-visual">
              <img src={selectedImage.src} alt={selectedImage.alt} />
            </div>

            <aside className="lightbox-side">
              <button type="button" className="lightbox-close" onClick={handleClose} aria-label="关闭预览">
                ×
              </button>

              <div>
                <h2 className="lightbox-title">{selectedImage.title}</h2>
                <p className="lightbox-subtitle">{selectedImage.description}</p>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">资源地址</div>
                <div className="lightbox-linkbox">{selectedImageUrl}</div>
              </div>

              <div className="lightbox-meta-grid">
                <div className="lightbox-group">
                  <div className="lightbox-label">分辨率</div>
                  <div className="lightbox-value">{selectedImage.dimensionLabel}</div>
                </div>
                <div className="lightbox-group">
                  <div className="lightbox-label">文件大小</div>
                  <div className="lightbox-value">{selectedImage.size}</div>
                </div>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">类型</div>
                <div className="lightbox-value">{selectedImage.type === "PC" ? "横屏" : "竖屏"}</div>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">文件名</div>
                <div className="lightbox-value">{selectedImage.filename}</div>
              </div>

              <div className="lightbox-actions">
                <button
                  type="button"
                  className="lightbox-button"
                  onClick={() => handleCopy(selectedImageUrl)}
                >
                  {copied ? "已复制链接" : "复制图片链接"}
                </button>
                <a className="lightbox-download" href={selectedImage.src} download>
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
