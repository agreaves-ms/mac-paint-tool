import type { Tool } from './Tool';

export class EraserTool implements Tool {
  name = 'eraser';
  cursor = 'crosshair';
  lineWidth = 10;

  private isDrawing = false;
  private isPenStroke = false;
  private prevRawX = 0;
  private prevRawY = 0;
  private currentPathX = 0;
  private currentPathY = 0;
  private stampDistance = 0;

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.isDrawing = true;
    this.isPenStroke = e.pointerType === 'pen';
    this.prevRawX = x;
    this.prevRawY = y;
    this.currentPathX = x;
    this.currentPathY = y;
    this.stampDistance = 0;

    ctx.globalCompositeOperation = 'destination-out';

    if (this.isPenStroke) {
      const width = 1 + e.pressure * (this.lineWidth - 1);
      this.stampAt(ctx, x, y, width);
    } else {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = this.lineWidth;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    if (this.isPenStroke) {
      const width = 1 + e.pressure * (this.lineWidth - 1);
      this.stampLine(ctx, this.prevRawX, this.prevRawY, x, y, width);
    } else {
      const midX = (this.prevRawX + x) / 2;
      const midY = (this.prevRawY + y) / 2;

      ctx.beginPath();
      ctx.moveTo(this.currentPathX, this.currentPathY);
      ctx.quadraticCurveTo(this.prevRawX, this.prevRawY, midX, midY);
      ctx.stroke();

      this.currentPathX = midX;
      this.currentPathY = midY;
    }

    this.prevRawX = x;
    this.prevRawY = y;
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    if (this.isPenStroke) {
      const width = 1 + e.pressure * (this.lineWidth - 1);
      this.stampLine(ctx, this.prevRawX, this.prevRawY, x, y, width);
    } else {
      ctx.beginPath();
      ctx.moveTo(this.currentPathX, this.currentPathY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private stampAt(ctx: CanvasRenderingContext2D, x: number, y: number, width?: number): void {
    const radius = (width ?? this.lineWidth) / 2;
    if (radius <= 0) return;
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private stampLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, width?: number): void {
    const effectiveWidth = width ?? this.lineWidth;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const spacing = Math.max(1, effectiveWidth / 4);

    if (dist < 0.1) {
      this.stampAt(ctx, x1, y1, effectiveWidth);
      return;
    }

    let traveled = this.stampDistance;
    while (traveled < dist) {
      const t = traveled / dist;
      this.stampAt(ctx, x0 + dx * t, y0 + dy * t, effectiveWidth);
      traveled += spacing;
    }
    this.stampDistance = traveled - dist;
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
