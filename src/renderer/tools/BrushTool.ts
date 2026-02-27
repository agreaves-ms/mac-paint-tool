import type { Tool } from './Tool';

export class BrushTool implements Tool {
  name = 'brush';
  cursor = 'crosshair';
  lineWidth = 2;
  color = '#000000';

  private isDrawing = false;
  private prevRawX = 0;
  private prevRawY = 0;
  private currentPathX = 0;
  private currentPathY = 0;

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.isDrawing = true;
    this.prevRawX = x;
    this.prevRawY = y;
    this.currentPathX = x;
    this.currentPathY = y;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    const midX = (this.prevRawX + x) / 2;
    const midY = (this.prevRawY + y) / 2;

    ctx.beginPath();
    ctx.moveTo(this.currentPathX, this.currentPathY);
    ctx.quadraticCurveTo(this.prevRawX, this.prevRawY, midX, midY);
    ctx.stroke();

    this.currentPathX = midX;
    this.currentPathY = midY;
    this.prevRawX = x;
    this.prevRawY = y;
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    ctx.beginPath();
    ctx.moveTo(this.currentPathX, this.currentPathY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
