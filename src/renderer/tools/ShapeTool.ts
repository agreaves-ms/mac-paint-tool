import type { Tool } from './Tool';

export type ShapeType = 'line' | 'rectangle' | 'ellipse';
export type ShapeMode = 'stroke' | 'fill' | 'strokeAndFill';

export class ShapeTool implements Tool {
  name = 'shape';
  cursor = 'crosshair';
  lineWidth = 2;
  color = '#000000';
  fillColor = '#000000';
  shapeType: ShapeType = 'rectangle';
  shapeMode: ShapeMode = 'stroke';

  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private shiftHeld = false;

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') this.shiftHeld = true;
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') this.shiftHeld = false;
  };

  onActivate(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  onDeactivate(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.removeOverlay();
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
    this.ensureOverlay(ctx.canvas);
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.overlayCtx || !this.overlayCanvas) return;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.drawShape(this.overlayCtx, this.startX, this.startY, x, y, e.shiftKey || this.shiftHeld);
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.drawShape(ctx, this.startX, this.startY, x, y, e.shiftKey || this.shiftHeld);

    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    constrain: boolean
  ): void {
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.fillColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (constrain) {
      ({ x2, y2 } = this.applyConstraint(x1, y1, x2, y2));
    }

    switch (this.shapeType) {
      case 'line':
        this.drawLine(ctx, x1, y1, x2, y2);
        break;
      case 'rectangle':
        this.drawRectangle(ctx, x1, y1, x2, y2);
        break;
      case 'ellipse':
        this.drawEllipse(ctx, x1, y1, x2, y2);
        break;
    }
  }

  private drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  private drawRectangle(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    if (this.shapeMode === 'fill' || this.shapeMode === 'strokeAndFill') {
      ctx.fillRect(x, y, w, h);
    }
    if (this.shapeMode === 'stroke' || this.shapeMode === 'strokeAndFill') {
      ctx.strokeRect(x, y, w, h);
    }
  }

  private drawEllipse(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;

    if (rx === 0 || ry === 0) return;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (this.shapeMode === 'fill' || this.shapeMode === 'strokeAndFill') {
      ctx.fill();
    }
    if (this.shapeMode === 'stroke' || this.shapeMode === 'strokeAndFill') {
      ctx.stroke();
    }
  }

  private applyConstraint(x1: number, y1: number, x2: number, y2: number): { x2: number; y2: number } {
    if (this.shapeType === 'line') {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        x2: x1 + Math.cos(snapped) * dist,
        y2: y1 + Math.sin(snapped) * dist,
      };
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    return {
      x2: x1 + size * Math.sign(dx || 1),
      y2: y1 + size * Math.sign(dy || 1),
    };
  }

  private ensureOverlay(canvas: HTMLCanvasElement): void {
    if (this.overlayCanvas) return;

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = canvas.width;
    this.overlayCanvas.height = canvas.height;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.left = `${canvas.offsetLeft}px`;
    this.overlayCanvas.style.top = `${canvas.offsetTop}px`;

    const container = canvas.parentElement;
    if (!container) return;
    container.style.position = 'relative';
    container.appendChild(this.overlayCanvas);

    const ctx = this.overlayCanvas.getContext('2d');
    if (!ctx) return;
    this.overlayCtx = ctx;
  }

  private removeOverlay(): void {
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
      this.overlayCtx = null;
    }
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
