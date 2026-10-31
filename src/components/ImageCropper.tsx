import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Maximize2,
  Move,
  RotateCcw,
  Sliders,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ImageCropRect } from '../core/converter/imageConverter';

export type AspectRatioPreset = '3:2' | '1:1' | '2:3' | 'free' | 'full';

interface ImageCropperProps {
  file: File;
  defaultPreset?: AspectRatioPreset;
  onCropChange: (crop: ImageCropRect, preset: AspectRatioPreset) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  file,
  defaultPreset = '3:2',
  onCropChange,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [preset, setPreset] = useState<AspectRatioPreset>(defaultPreset);

  // Normalized crop rectangle: all values in [0, 1] relative to natural image dimensions
  const [normCrop, setNormCrop] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  });

  const [boxScale, setBoxScale] = useState<number>(100); // 20% to 100%
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragModeRef = useRef<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; crop: { x: number; y: number; w: number; h: number } }>({
    clientX: 0,
    clientY: 0,
    crop: { x: 0, y: 0, w: 1, h: 1 },
  });

  // Load image object URL
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Compute preset aspect ratio multiplier K = R_target * (H_nat / W_nat)
  // so that norm_w = norm_h * K
  const getRatioMultiplier = useCallback((p: AspectRatioPreset, wNat: number, hNat: number): number | null => {
    if (wNat <= 0 || hNat <= 0) return null;
    let rTarget: number;
    if (p === '3:2') rTarget = 1.5;
    else if (p === '1:1') rTarget = 1.0;
    else if (p === '2:3') rTarget = 2 / 3;
    else return null;

    return rTarget * (hNat / wNat);
  }, []);

  // Calculate centered crop box for a given preset and scale factor (0.2 to 1.0)
  const applyPreset = useCallback((p: AspectRatioPreset, scalePct: number = 100, wNat = naturalSize.width, hNat = naturalSize.height) => {
    if (wNat <= 0 || hNat <= 0) return;
    setPreset(p);

    if (p === 'full') {
      const full = { x: 0, y: 0, w: 1, h: 1 };
      setNormCrop(full);
      setBoxScale(100);
      onCropChange({ x: 0, y: 0, width: wNat, height: hNat }, 'full');
      return;
    }

    if (p === 'free') {
      setBoxScale(scalePct);
      // Keep current crop or default to 80% centered box
      return;
    }

    const K = getRatioMultiplier(p, wNat, hNat);
    if (!K) return;

    // Maximum possible box that fits inside 1.0 x 1.0
    let maxW: number;
    let maxH: number;
    if (K <= 1.0) {
      maxW = K;
      maxH = 1.0;
    } else {
      maxW = 1.0;
      maxH = 1.0 / K;
    }

    const scale = Math.max(0.2, Math.min(1.0, scalePct / 100));
    const w = maxW * scale;
    const h = maxH * scale;
    const x = (1.0 - w) / 2;
    const y = (1.0 - h) / 2;

    const newCrop = { x, y, w, h };
    setNormCrop(newCrop);
    setBoxScale(scalePct);

    onCropChange(
      {
        x: Math.round(x * wNat),
        y: Math.round(y * hNat),
        width: Math.round(w * wNat),
        height: Math.round(h * hNat),
      },
      p
    );
  }, [getRatioMultiplier, naturalSize, onCropChange]);

  // Handle Image onLoad
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const wNat = img.naturalWidth;
    const hNat = img.naturalHeight;
    setNaturalSize({ width: wNat, height: hNat });
    applyPreset(defaultPreset, 100, wNat, hNat);
  };

  // Synchronize pixel crop changes to parent
  const emitCrop = useCallback((crop: { x: number; y: number; w: number; h: number }, p = preset) => {
    if (naturalSize.width <= 0 || naturalSize.height <= 0) return;
    const px = Math.round(crop.x * naturalSize.width);
    const py = Math.round(crop.y * naturalSize.height);
    const pw = Math.round(crop.w * naturalSize.width);
    const ph = Math.round(crop.h * naturalSize.height);
    onCropChange({ x: px, y: py, width: pw, height: ph }, p);
  }, [naturalSize, onCropChange, preset]);

  // Scale slider change
  const handleScaleSlider = (newScale: number) => {
    setBoxScale(newScale);
    if (preset === 'full') setPreset('free');

    const K = getRatioMultiplier(preset, naturalSize.width, naturalSize.height);
    if (K) {
      // Keep center of current crop
      const centerX = normCrop.x + normCrop.w / 2;
      const centerY = normCrop.y + normCrop.h / 2;

      let maxW = K <= 1.0 ? K : 1.0;
      let maxH = K <= 1.0 ? 1.0 : 1.0 / K;

      const scale = Math.max(0.2, Math.min(1.0, newScale / 100));
      const w = maxW * scale;
      const h = maxH * scale;

      let x = centerX - w / 2;
      let y = centerY - h / 2;
      x = Math.max(0, Math.min(1.0 - w, x));
      y = Math.max(0, Math.min(1.0 - h, y));

      const updated = { x, y, w, h };
      setNormCrop(updated);
      emitCrop(updated);
    }
  };

  // Mouse / Touch Dragging & Resizing
  const handlePointerDown = (mode: 'move' | 'nw' | 'ne' | 'se' | 'sw', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    isDraggingRef.current = true;
    dragModeRef.current = mode;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      crop: { ...normCrop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !imgRef.current) return;
    e.preventDefault();

    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaNormX = (e.clientX - dragStartRef.current.clientX) / rect.width;
    const deltaNormY = (e.clientY - dragStartRef.current.clientY) / rect.height;
    const start = dragStartRef.current.crop;
    const mode = dragModeRef.current;

    if (mode === 'move') {
      let nextX = start.x + deltaNormX;
      let nextY = start.y + deltaNormY;
      nextX = Math.max(0, Math.min(1.0 - start.w, nextX));
      nextY = Math.max(0, Math.min(1.0 - start.h, nextY));

      const updated = { x: nextX, y: nextY, w: start.w, h: start.h };
      setNormCrop(updated);
      emitCrop(updated);
      return;
    }

    // Handle corner resizing
    const K = getRatioMultiplier(preset, naturalSize.width, naturalSize.height);

    if (mode === 'se') {
      let nextW = Math.max(0.15, Math.min(1.0 - start.x, start.w + deltaNormX));
      let nextH = K ? nextW / K : Math.max(0.15, Math.min(1.0 - start.y, start.h + deltaNormY));

      if (K && start.y + nextH > 1.0) {
        nextH = 1.0 - start.y;
        nextW = nextH * K;
      }

      const updated = { x: start.x, y: start.y, w: nextW, h: nextH };
      setNormCrop(updated);
      emitCrop(updated);
    } else if (mode === 'sw') {
      let nextW = Math.max(0.15, Math.min(start.x + start.w, start.w - deltaNormX));
      let nextH = K ? nextW / K : Math.max(0.15, Math.min(1.0 - start.y, start.h + deltaNormY));

      if (K && start.y + nextH > 1.0) {
        nextH = 1.0 - start.y;
        nextW = nextH * K;
      }

      const nextX = start.x + (start.w - nextW);
      const updated = { x: nextX, y: start.y, w: nextW, h: nextH };
      setNormCrop(updated);
      emitCrop(updated);
    } else if (mode === 'ne') {
      let nextW = Math.max(0.15, Math.min(1.0 - start.x, start.w + deltaNormX));
      let nextH = K ? nextW / K : Math.max(0.15, Math.min(start.y + start.h, start.h - deltaNormY));

      if (K && start.y + start.h - nextH < 0) {
        nextH = start.y + start.h;
        nextW = nextH * K;
      }

      const nextY = start.y + (start.h - nextH);
      const updated = { x: start.x, y: nextY, w: nextW, h: nextH };
      setNormCrop(updated);
      emitCrop(updated);
    } else if (mode === 'nw') {
      let nextW = Math.max(0.15, Math.min(start.x + start.w, start.w - deltaNormX));
      let nextH = K ? nextW / K : Math.max(0.15, Math.min(start.y + start.h, start.h - deltaNormY));

      if (K && start.y + start.h - nextH < 0) {
        nextH = start.y + start.h;
        nextW = nextH * K;
      }

      const nextX = start.x + (start.w - nextW);
      const nextY = start.y + (start.h - nextH);
      const updated = { x: nextX, y: nextY, w: nextW, h: nextH };
      setNormCrop(updated);
      emitCrop(updated);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragModeRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const currentCropPixels = {
    w: Math.round(normCrop.w * naturalSize.width),
    h: Math.round(normCrop.h * naturalSize.height),
  };

  const isMetaPreset = preset === '3:2' || preset === '1:1' || preset === '2:3';

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* 1. Ratio Preset Buttons */}
      <div>
        <div className="flex items-center justify-between text-[11px] app-text-dim mb-1.5">
          <span className="font-bold flex items-center space-x-1">
            <Crop className="w-3 h-3 text-emerald-500" />
            <span>ASPECT_RATIO_PRESET (比例规范框选)</span>
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold">支持直接拖拽选框或滑动调尺寸</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => applyPreset('3:2', 100)}
            className={`p-2 rounded border text-left transition-all ${
              preset === '3:2'
                ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                : 'app-surface app-border app-text-muted hover:app-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>横版 3:2</span>
              {preset === '3:2' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] font-normal app-text-dim mt-0.5">Header 推荐</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('1:1', 100)}
            className={`p-2 rounded border text-left transition-all ${
              preset === '1:1'
                ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                : 'app-surface app-border app-text-muted hover:app-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>方形 1:1</span>
              {preset === '1:1' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] font-normal app-text-dim mt-0.5">Header / 头像</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('2:3', 100)}
            className={`p-2 rounded border text-left transition-all ${
              preset === '2:3'
                ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                : 'app-surface app-border app-text-muted hover:app-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>竖版 2:3</span>
              {preset === '2:3' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] font-normal app-text-dim mt-0.5">Header 竖图</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('free')}
            className={`p-2 rounded border text-left transition-all ${
              preset === 'free'
                ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                : 'app-surface app-border app-text-muted hover:app-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>自由选框</span>
              {preset === 'free' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] font-normal app-text-dim mt-0.5">任意裁剪</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('full')}
            className={`p-2 rounded border text-left transition-all ${
              preset === 'full'
                ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                : 'app-surface app-border app-text-muted hover:app-text-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>原图全画幅</span>
              {preset === 'full' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] font-normal app-text-dim mt-0.5">不裁剪</div>
          </button>
        </div>
      </div>

      {/* 2. Interactive Crop Viewport with Live Box */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-[#0d0d0e] border app-border flex items-center justify-center select-none"
        style={{ minHeight: '220px', maxHeight: '340px' }}
      >
        {imageSrc ? (
          <div className="relative inline-block max-w-full max-h-[320px]">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source preview"
              onLoad={handleImageLoaded}
              className="max-h-[320px] max-w-full object-contain block pointer-events-none"
            />

            {/* Dark Mask for Outside Crop Area */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(transparent, transparent)`,
              }}
            >
              {/* Top mask */}
              <div
                className="absolute left-0 right-0 top-0 bg-black/60 backdrop-blur-[1px]"
                style={{ height: `${normCrop.y * 100}%` }}
              />
              {/* Bottom mask */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[1px]"
                style={{ height: `${(1.0 - (normCrop.y + normCrop.h)) * 100}%` }}
              />
              {/* Left mask */}
              <div
                className="absolute left-0 bg-black/60 backdrop-blur-[1px]"
                style={{
                  top: `${normCrop.y * 100}%`,
                  height: `${normCrop.h * 100}%`,
                  width: `${normCrop.x * 100}%`,
                }}
              />
              {/* Right mask */}
              <div
                className="absolute right-0 bg-black/60 backdrop-blur-[1px]"
                style={{
                  top: `${normCrop.y * 100}%`,
                  height: `${normCrop.h * 100}%`,
                  width: `${(1.0 - (normCrop.x + normCrop.w)) * 100}%`,
                }}
              />
            </div>

            {/* Highlighted Interactive Crop Box */}
            <div
              onPointerDown={(e) => handlePointerDown('move', e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute border-2 border-emerald-400 shadow-lg cursor-move transition-shadow hover:border-emerald-300"
              style={{
                left: `${normCrop.x * 100}%`,
                top: `${normCrop.y * 100}%`,
                width: `${normCrop.w * 100}%`,
                height: `${normCrop.h * 100}%`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 0 20px rgba(16,185,129,0.3)',
              }}
            >
              {/* 3x3 Composition Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-emerald-400/25" />
                <div className="border-r border-b border-emerald-400/25" />
                <div className="border-b border-emerald-400/25" />
                <div className="border-r border-b border-emerald-400/25" />
                <div className="border-r border-b border-emerald-400/25 flex items-center justify-center">
                  <Move className="w-3.5 h-3.5 text-emerald-400/40" />
                </div>
                <div className="border-b border-emerald-400/25" />
                <div className="border-r border-emerald-400/25" />
                <div className="border-r border-emerald-400/25" />
                <div />
              </div>

              {/* Corner Handles */}
              <div
                onPointerDown={(e) => handlePointerDown('nw', e)}
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown('ne', e)}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown('se', e)}
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
              />
              <div
                onPointerDown={(e) => handlePointerDown('sw', e)}
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
              />
            </div>
          </div>
        ) : (
          <div className="app-text-dim">LOADING_IMAGE...</div>
        )}
      </div>

      {/* 3. Micro-Adjustment Size Slider & Live Info */}
      <div className="p-3 rounded-lg border app-border app-surface-subtle space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="app-text-dim">CROP_RESOLUTION:</span>
            <span className="font-bold text-emerald-400">
              {currentCropPixels.w} × {currentCropPixels.h} px
            </span>
            <span className="app-text-dim">({preset.toUpperCase()})</span>
            {isMetaPreset && (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>HEADER 合规</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const centerX = (1.0 - normCrop.w) / 2;
                const centerY = (1.0 - normCrop.h) / 2;
                const centered = { ...normCrop, x: centerX, y: centerY };
                setNormCrop(centered);
                emitCrop(centered);
              }}
              className="px-2 py-0.5 rounded border app-border app-surface hover:app-text-main text-slate-400 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>居中框选</span>
            </button>
          </div>
        </div>

        {/* Size Slider for effortless micro-scaling */}
        {preset !== 'full' && (
          <div className="flex items-center space-x-2.5 pt-1 text-[11px]">
            <span className="app-text-dim shrink-0">选框大小缩放:</span>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={boxScale}
              onChange={(e) => handleScaleSlider(parseInt(e.target.value, 10))}
              className="flex-1 accent-emerald-500 h-1 bg-[#27272a] rounded cursor-pointer"
            />
            <span className="text-emerald-400 font-bold shrink-0 w-8 text-right">{boxScale}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
