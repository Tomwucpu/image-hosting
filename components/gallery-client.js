"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { getCompactImageOrder } from "@/lib/gallery-order";
import GalleryItem from "@/components/gallery-item";
import ThemeToggle from "@/components/theme-toggle";

const LIGHTBOX_CLOSE_DURATION = 280;
const INITIAL_IMAGE_COUNT = 24;
const IMAGE_BATCH_SIZE = 24;
const DEFAULT_LIGHTBOX_SCALE = 1;
const MIN_LIGHTBOX_SCALE = 0.25;
const MAX_LIGHTBOX_SCALE = 4;
const LIGHTBOX_SCALE_STEP = 0.2;
const LIGHTBOX_SCALE_EPSILON = 0.001;

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultLightboxOffset() {
  return { x: 0, y: 0 };
}

function isDefaultLightboxScale(scale) {
  return Math.abs(scale - DEFAULT_LIGHTBOX_SCALE) < LIGHTBOX_SCALE_EPSILON;
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

function LightboxNavIcon({ direction }) {
  const path =
    direction === "prev"
      ? "M14.5 5.75 8.25 12l6.25 6.25"
      : "M9.5 5.75 15.75 12 9.5 18.25";

  return (
    <svg className="lightbox-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GalleryClient({ images }) {
  const [lightboxFilename, setLightboxFilename] = useState(null);
  const [isLightboxClosing, setIsLightboxClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_IMAGE_COUNT);
  const [columnCount, setColumnCount] = useState(0);
  const [rowSize, setRowSize] = useState(120);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(DEFAULT_LIGHTBOX_SCALE);
  const [lightboxOffset, setLightboxOffset] = useState(() => getDefaultLightboxOffset());
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const copyResetTimer = useRef(null);
  const closeTimerRef = useRef(null);
  const gridRef = useRef(null);
  const loadMoreRef = useRef(null);
  const visualFrameRef = useRef(null);
  const visualImageRef = useRef(null);
  const dragStateRef = useRef(null);

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

  useEffect(() => {
    setVisibleCount(INITIAL_IMAGE_COUNT);
  }, [images]);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 560);
    };

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackToTopVisibility);
    };
  }, []);

  useEffect(() => {
    const current = gridRef.current;

    if (!current) {
      return undefined;
    }

    const updateColumnCount = () => {
      const computedStyle = window.getComputedStyle(current);
      const columnWidths = computedStyle.gridTemplateColumns
        .split(" ")
        .map((value) => Number.parseFloat(value))
        .filter(Number.isFinite);
      const nextColumnCount = columnWidths.length;
      const averageColumnWidth =
        columnWidths.reduce((total, width) => total + width, 0) / Math.max(nextColumnCount, 1);
      const columnGap = Number.parseFloat(computedStyle.columnGap) || 0;
      const nextRowSize =
        nextColumnCount >= 2
          ? Math.round((((averageColumnWidth * 2) + columnGap) * 9) / 16)
          : 120;

      setColumnCount((previousCount) =>
        previousCount === nextColumnCount ? previousCount : nextColumnCount,
      );
      setRowSize((previousSize) => (previousSize === nextRowSize ? previousSize : nextRowSize));
    };

    updateColumnCount();

    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const current = loadMoreRef.current;

    if (!current || visibleCount >= images.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleCount((count) => Math.min(count + IMAGE_BATCH_SIZE, images.length));
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [images.length, visibleCount]);

  const orderedImages = getCompactImageOrder(images, columnCount);
  const visibleImages = orderedImages.slice(0, visibleCount);
  const hasMoreImages = visibleCount < orderedImages.length;
  const lightboxIndex = lightboxFilename
    ? orderedImages.findIndex((image) => image.filename === lightboxFilename)
    : -1;
  const lightboxImage = lightboxIndex >= 0 ? orderedImages[lightboxIndex] : null;
  const hasPreviousImage = lightboxIndex > 0;
  const hasNextImage = lightboxIndex >= 0 && lightboxIndex < orderedImages.length - 1;
  const selectedOriginalImageUrl =
    lightboxImage && typeof window !== "undefined"
      ? new URL(lightboxImage.src, window.location.href).toString()
      : lightboxImage?.src ?? "";
  const selectedPreviewSrc = lightboxImage?.previewSrc ?? lightboxImage?.src ?? "";
  const lightboxScaleLabel = `${Math.round(lightboxScale * 100)}%`;

  const releaseLightboxPointerCapture = () => {
    const activePointerId = dragStateRef.current?.pointerId;
    const viewport = visualFrameRef.current;

    if (
      viewport &&
      activePointerId !== undefined &&
      viewport.hasPointerCapture(activePointerId)
    ) {
      viewport.releasePointerCapture(activePointerId);
    }
  };

  const resetLightboxViewport = () => {
    releaseLightboxPointerCapture();
    dragStateRef.current = null;
    setIsLightboxDragging(false);
    setLightboxScale(DEFAULT_LIGHTBOX_SCALE);
    setLightboxOffset(getDefaultLightboxOffset());
  };

  const clampLightboxOffset = (nextOffset, nextScale = lightboxScale) => {
    if (isDefaultLightboxScale(nextScale)) {
      return getDefaultLightboxOffset();
    }

    const viewport = visualFrameRef.current;
    const imageElement = visualImageRef.current;

    if (!viewport || !imageElement) {
      return nextOffset;
    }

    const scaledWidth = imageElement.offsetWidth * nextScale;
    const scaledHeight = imageElement.offsetHeight * nextScale;
    const maxX = Math.abs(scaledWidth - viewport.clientWidth) / 2;
    const maxY = Math.abs(scaledHeight - viewport.clientHeight) / 2;

    return {
      x: clampValue(nextOffset.x, -maxX, maxX),
      y: clampValue(nextOffset.y, -maxY, maxY),
    };
  };

  const finishClose = () => {
    setLightboxFilename(null);
    setIsLightboxClosing(false);
    setCopied(false);
    resetLightboxViewport();
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

  const handleSelectImage = (nextIndex) => {
    if (isLightboxClosing || nextIndex < 0 || nextIndex >= orderedImages.length) {
      return;
    }

    const nextImage = orderedImages[nextIndex];

    if (!nextImage) {
      return;
    }

    setLightboxFilename(nextImage.filename);
    setCopied(false);
    resetLightboxViewport();
  };

  const handlePreviousImage = () => {
    handleSelectImage(lightboxIndex - 1);
  };

  const handleNextImage = () => {
    handleSelectImage(lightboxIndex + 1);
  };

  const handleOpen = (image) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setLightboxFilename(image.filename);
    setIsLightboxClosing(false);
    setCopied(false);
    resetLightboxViewport();
    document.body.style.overflow = "hidden";
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetLightboxViewport = () => {
    resetLightboxViewport();
  };

  const handleLightboxWheel = (event) => {
    if (!lightboxImage || isLightboxClosing) {
      return;
    }

    event.preventDefault();

    const scaleDelta = event.deltaY < 0 ? LIGHTBOX_SCALE_STEP : -LIGHTBOX_SCALE_STEP;

    setLightboxScale((currentScale) => {
      const nextScale = clampValue(
        Math.round((currentScale + scaleDelta) * 100) / 100,
        MIN_LIGHTBOX_SCALE,
        MAX_LIGHTBOX_SCALE,
      );

      setLightboxOffset((currentOffset) => clampLightboxOffset(currentOffset, nextScale));

      return nextScale;
    });
  };

  const stopDraggingLightboxImage = () => {
    releaseLightboxPointerCapture();
    dragStateRef.current = null;
    setIsLightboxDragging(false);
  };

  const handleLightboxPointerDown = (event) => {
    if (!lightboxImage || isDefaultLightboxScale(lightboxScale) || event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: lightboxOffset.x,
      originY: lightboxOffset.y,
    };

    setIsLightboxDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleLightboxPointerMove = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextOffset = clampLightboxOffset(
      {
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      },
      lightboxScale,
    );

    setLightboxOffset(nextOffset);
  };

  const handleLightboxPointerUp = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopDraggingLightboxImage();
  };

  const handleLightboxPointerCancel = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopDraggingLightboxImage();
  };

  useEffect(() => {
    if (!lightboxImage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }

      if (isLightboxClosing) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        handlePreviousImage();
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        handleNextImage();
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        handleResetLightboxViewport();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxFilename, isLightboxClosing, lightboxIndex, columnCount, images]);

  useEffect(() => {
    if (!lightboxImage) {
      return undefined;
    }

    const handleResize = () => {
      setLightboxOffset((currentOffset) => clampLightboxOffset(currentOffset, lightboxScale));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [lightboxImage, lightboxScale]);

  useEffect(() => {
    if (lightboxImage) {
      return undefined;
    }

    stopDraggingLightboxImage();
    return undefined;
  }, [lightboxImage]);

  if (!images.length) {
    return (
      <main className="empty-state">
        <div>
          <h1>暂无图片</h1>
          <p>请先在 public/image-scenery 中补充图片资源，启动或部署时会自动生成清单。</p>
        </div>
      </main>
    );
  }

  return (
    <div className="gallery-shell">
      <header className="gallery-header">
        <div className="gallery-brand">
          <Link href="/" className="gallery-brand-link">
            Gallery
          </Link>
          <div className="gallery-count">全部图片 · {images.length}</div>
        </div>

        <div className="gallery-tools">
          <div className="gallery-count">Random Picture Archive</div>
          <ThemeToggle solid />
        </div>
      </header>

      <main
        className="gallery-grid"
        ref={gridRef}
        style={{ "--gallery-row-size": `${rowSize}px` }}
      >
        {visibleImages.map((image, index) => (
          <GalleryItem
            key={image.filename}
            image={image}
            index={index}
            onClick={() => handleOpen(image)}
          />
        ))}
      </main>

      <div className="gallery-loadmore" ref={loadMoreRef} aria-live="polite">
        {hasMoreImages ? `继续滚动加载更多 · ${visibleCount}/${images.length}` : `已加载全部图片 · ${images.length}/${images.length}`}
      </div>

      {showBackToTop && !lightboxImage ? (
        <button
          type="button"
          className="back-to-top"
          onClick={handleBackToTop}
          aria-label="回到顶部"
        >
          ↑
        </button>
      ) : null}

      {lightboxImage ? (
        <div
          className={`lightbox${isLightboxClosing ? " lightbox--closing" : ""}`}
          onClick={requestClose}
        >
          <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <div className="lightbox-visual">
              <button
                type="button"
                className="lightbox-nav lightbox-nav--prev"
                onClick={handlePreviousImage}
                aria-label="查看上一张图片"
                disabled={!hasPreviousImage || isLightboxClosing}
              >
                <LightboxNavIcon direction="prev" />
              </button>

              <div
                ref={visualFrameRef}
                className={`lightbox-visual-frame${!isDefaultLightboxScale(lightboxScale) ? " lightbox-visual-frame--interactive" : ""}${isLightboxDragging ? " lightbox-visual-frame--dragging" : ""}`}
                onWheel={handleLightboxWheel}
                onPointerDown={handleLightboxPointerDown}
                onPointerMove={handleLightboxPointerMove}
                onPointerUp={handleLightboxPointerUp}
                onPointerCancel={handleLightboxPointerCancel}
              >
                <img
                  ref={visualImageRef}
                  className={`lightbox-image${isLightboxDragging ? " lightbox-image--dragging" : ""}`}
                  src={selectedPreviewSrc}
                  alt={lightboxImage.filename}
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  onLoad={() => {
                    setLightboxOffset((currentOffset) =>
                      clampLightboxOffset(currentOffset, lightboxScale),
                    );
                  }}
                  style={{
                    transform: `translate3d(${lightboxOffset.x}px, ${lightboxOffset.y}px, 0) scale(${lightboxScale})`,
                  }}
                />
              </div>

              <button
                type="button"
                className="lightbox-nav lightbox-nav--next"
                onClick={handleNextImage}
                aria-label="查看下一张图片"
                disabled={!hasNextImage || isLightboxClosing}
              >
                <LightboxNavIcon direction="next" />
              </button>
            </div>

            <aside className="lightbox-side">
              <div className="lightbox-toolbar">
                <div className="lightbox-toolbar-meta">
                  <span>{lightboxIndex + 1}/{orderedImages.length}</span>
                  <span>{lightboxScaleLabel}</span>
                </div>

                <div className="lightbox-toolbar-actions">
                  <button
                    type="button"
                    className="lightbox-toolbar-button"
                    onClick={handleResetLightboxViewport}
                    disabled={
                      isDefaultLightboxScale(lightboxScale) &&
                      lightboxOffset.x === 0 &&
                      lightboxOffset.y === 0
                    }
                  >
                    复原
                  </button>

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
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">文件名</div>
                <div className="lightbox-value">{lightboxImage.filename}</div>
              </div>

              <div className="lightbox-group">
                <div className="lightbox-label">原图地址</div>
                <div className="lightbox-linkbox">{selectedOriginalImageUrl}</div>
                <button
                  type="button"
                  className="lightbox-button"
                  onClick={() => handleCopy(selectedOriginalImageUrl)}
                >
                  {copied ? "已复制原图链接" : "复制原图链接"}
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

              <div className="lightbox-group">
                <div className="lightbox-label">操作</div>
                <div className="lightbox-hint">
                  滚轮缩放，缩小时或放大后都支持拖拽移动，左右或上下方向键切换图片，按 0 可快速复原。
                </div>
              </div>

              <div className="lightbox-actions">
                <a className="lightbox-download" href={lightboxImage.src} download>
                  下载原图
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

