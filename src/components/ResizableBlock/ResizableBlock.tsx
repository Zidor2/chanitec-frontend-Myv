import React, { useRef, useEffect, useState } from 'react';
import './ResizableBlock.css';

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragMode = 'move' | 'width' | 'height' | 'both' | null;

interface ResizableBlockProps {
  children: React.ReactNode;
  className: string;
  blockId: string;
  rect: LayoutRect;
  zIndex?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (rect: LayoutRect) => void;
  onActivate?: () => void;
}

function clampRect(rect: LayoutRect): LayoutRect {
  const width = Math.max(8, Math.min(rect.width, 100));
  const height = Math.max(6, Math.min(rect.height, 100));
  return {
    width,
    height,
    x: Math.max(0, Math.min(rect.x, 100 - width)),
    y: Math.max(0, Math.min(rect.y, 100 - height))
  };
}

export default function ResizableBlock({
  children,
  className,
  blockId,
  rect,
  zIndex = 1,
  containerRef,
  onChange,
  onActivate
}: ResizableBlockProps) {
  const [mode, setMode] = useState<DragMode>(null);
  const startRef = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    containerW: 1,
    containerH: 1
  });

  const beginDrag = (nextMode: Exclude<DragMode, null>) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      containerW: bounds.width || 1,
      containerH: bounds.height || 1
    };
    setMode(nextMode);
    onActivate?.();
  };

  useEffect(() => {
    if (!mode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = startRef.current;
      const dx = ((e.clientX - start.mouseX) / start.containerW) * 100;
      const dy = ((e.clientY - start.mouseY) / start.containerH) * 100;
      const next = { x: start.x, y: start.y, width: start.width, height: start.height };

      if (mode === 'move') {
        next.x = start.x + dx;
        next.y = start.y + dy;
      }
      if (mode === 'width' || mode === 'both') {
        next.width = start.width + dx;
      }
      if (mode === 'height' || mode === 'both') {
        next.height = start.height + dy;
      }

      onChange(clampRect(next));
    };

    const handleMouseUp = () => {
      setMode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, onChange]);

  return (
    <div
      className={`${className} resizable-block${mode ? ` is-${mode === 'move' ? 'dragging' : 'resizing'}` : ''}`}
      data-block-id={blockId}
      style={{
        position: 'absolute',
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        zIndex: mode ? zIndex + 20 : zIndex
      }}
    >
      {children}

      <div
        className="drag-handle"
        onMouseDown={beginDrag('move')}
        title="Drag to move freely"
      >
        <span /><span /><span /><span /><span /><span />
      </div>

      <div
        className="resize-handle resize-handle-width"
        onMouseDown={beginDrag('width')}
        title="Drag to resize width"
      />

      <div
        className="resize-handle resize-handle-height"
        onMouseDown={beginDrag('height')}
        title="Drag to resize height"
      />

      <div
        className="resize-handle resize-handle-corner"
        onMouseDown={beginDrag('both')}
        title="Drag to resize both"
      />
    </div>
  );
}
