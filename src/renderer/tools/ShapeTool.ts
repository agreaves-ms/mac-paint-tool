import type { Tool } from './Tool';

export type ShapeType = 'line' | 'rectangle' | 'ellipse' | 'roundedRect' | 'polygon';
export type ShapeMode = 'stroke' | 'fill' | 'strokeAndFill';

export class ShapeTool implements Tool {
  name = 'shape';
  cursor = 'crosshair';
  lineWidth = 2;
  color = '#000000';
  fillColor = '#000000';
  shapeType: ShapeType = 'rectangle';
  shapeMode: ShapeMode = 'stroke';
  cornerRadius = 10;

  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private shiftHeld = false;

  // Polygon state
  private polygonVertices: { x: number; y: number }[] = [];
  private polygonCurrentX = 0;
  private polygonCurrentY = 0;
  private mainCtxRef: CanvasRenderingContext2D | null = null;

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') this.shiftHeld = true;
    if (e.key === 'Escape' && this.shapeType === 'polygon') {
      this.cancelPolygon();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') this.shiftHeld = false;
  };

  private onDblClick = (): void => {
    if (this.shapeType === 'polygon' && this.polygonVertices.length >= 3 && this.mainCtxRef) {
      // Remove the vertex added by the second click of the double-click
      this.polygonVertices.pop();
      this.finalizePolygon(this.mainCtxRef);
    }
  };

  private canvasRef: HTMLCanvasElement | null = null;

  onActivate(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  onDeactivate(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.canvasRef?.removeEventListener('dblclick', this.onDblClick);
    this.canvasRef = null;
    this.cancelPolygon();
    this.removeOverlay();
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.shapeType === 'polygon') {
      this.handlePolygonClick(e, ctx);
      return;
    }

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
    this.ensureOverlay(ctx.canvas);
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.shapeType === 'polygon') {
      this.handlePolygonMove(e, ctx);
      return;
    }

    if (!this.isDrawing || !this.overlayCtx || !this.overlayCanvas) return;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.drawShape(this.overlayCtx, this.startX, this.startY, x, y, e.shiftKey || this.shiftHeld);
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.shapeType === 'polygon') return;

    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.drawShape(ctx, this.startX, this.startY, x, y, e.shiftKey || this.shiftHeld);

    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  // Polygon interaction handlers

  private handlePolygonClick(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    this.mainCtxRef = ctx;
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    if (!this.canvasRef) {
      this.canvasRef = ctx.canvas;
      this.canvasRef.addEventListener('dblclick', this.onDblClick);
    }

    if (this.polygonVertices.length >= 3) {
      const dx = x - this.polygonVertices[0].x;
      const dy = y - this.polygonVertices[0].y;
      if (Math.hypot(dx, dy) < 10) {
        this.finalizePolygon(ctx);
        return;
      }
    }

    this.polygonVertices.push({ x, y });
    this.ensureOverlay(ctx.canvas);
    this.drawPolygonPreview();
  }

  private handlePolygonMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.polygonVertices.length === 0) return;
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.polygonCurrentX = x;
    this.polygonCurrentY = y;
    this.drawPolygonPreview();
  }

  private drawPolygonPreview(): void {
    if (!this.overlayCtx || !this.overlayCanvas || this.polygonVertices.length === 0) return;

    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.fillColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw placed edges
    ctx.beginPath();
    ctx.moveTo(this.polygonVertices[0].x, this.polygonVertices[0].y);
    for (let i = 1; i < this.polygonVertices.length; i++) {
      ctx.lineTo(this.polygonVertices[i].x, this.polygonVertices[i].y);
    }
    ctx.stroke();

    // Draw dashed line from last vertex to cursor
    const last = this.polygonVertices[this.polygonVertices.length - 1];
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(this.polygonCurrentX, this.polygonCurrentY);
    ctx.stroke();

    // Dashed line from cursor back to first vertex
    if (this.polygonVertices.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(this.polygonCurrentX, this.polygonCurrentY);
      ctx.lineTo(this.polygonVertices[0].x, this.polygonVertices[0].y);
      ctx.stroke();
    }
    ctx.restore();

    // Highlight first vertex
    ctx.save();
    ctx.fillStyle = '#0078d4';
    ctx.beginPath();
    ctx.arc(this.polygonVertices[0].x, this.polygonVertices[0].y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private finalizePolygon(ctx: CanvasRenderingContext2D): void {
    if (this.polygonVertices.length < 3) {
      this.cancelPolygon();
      return;
    }

    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.fillColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.polygonVertices[0].x, this.polygonVertices[0].y);
    for (let i = 1; i < this.polygonVertices.length; i++) {
      ctx.lineTo(this.polygonVertices[i].x, this.polygonVertices[i].y);
    }
    ctx.closePath();

    if (this.shapeMode === 'fill' || this.shapeMode === 'strokeAndFill') {
      ctx.fill();
    }
    if (this.shapeMode === 'stroke' || this.shapeMode === 'strokeAndFill') {
      ctx.stroke();
    }

    this.cancelPolygon();
  }

  private cancelPolygon(): void {
    this.polygonVertices = [];
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
      case 'roundedRect':
        this.drawRoundedRect(ctx, x1, y1, x2, y2);
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

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    const radius = Math.min(this.cornerRadius, w / 2, h / 2);

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);

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
