import type { Tool } from './Tool';

export class LassoTool implements Tool {
  name = 'lasso';
  cursor = 'crosshair';
  lineWidth = 1;

  private isDrawing = false;
  private points: { x: number; y: number }[] = [];
  private selectionPath: Path2D | null = null;

  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private animationFrame = 0;
  private dashOffset = 0;

  onActivate(): void {
    // No setup needed
  }

  onDeactivate(): void {
    this.stopAnimation();
    this.removeOverlay();
    this.selectionPath = null;
    this.points = [];
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    // Clear any existing selection
    this.stopAnimation();
    this.selectionPath = null;

    this.isDrawing = true;
    this.points = [{ x, y }];

    this.ensureOverlay(ctx.canvas);
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.points.push({ x, y });
    this.drawPath();
  }

  onPointerUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.points.length < 3) {
      this.points = [];
      if (this.overlayCtx && this.overlayCanvas) {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      }
      return;
    }

    // Build a closed Path2D for hit-testing via isPointInPath
    this.selectionPath = new Path2D();
    this.selectionPath.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.selectionPath.lineTo(this.points[i].x, this.points[i].y);
    }
    this.selectionPath.closePath();

    this.startMarchingAnts();
  }

  hasSelection(): boolean {
    return this.selectionPath !== null;
  }

  getSelectionPath(): Path2D | null {
    return this.selectionPath;
  }

  getBoundingRect(): { x: number; y: number; width: number; height: number } | null {
    if (this.points.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
    };
  }

  isPointInSelection(x: number, y: number, ctx: CanvasRenderingContext2D): boolean {
    if (!this.selectionPath) return false;
    return ctx.isPointInPath(this.selectionPath, x, y);
  }

  clearSelection(): void {
    this.selectionPath = null;
    this.points = [];
    this.stopAnimation();
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  private drawPath(): void {
    if (!this.overlayCtx || !this.overlayCanvas || this.points.length < 2) return;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.strokeStyle = '#000000';
    this.overlayCtx.lineWidth = 1;
    this.overlayCtx.setLineDash([4, 4]);

    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.overlayCtx.lineTo(this.points[i].x, this.points[i].y);
    }
    this.overlayCtx.stroke();
  }

  private startMarchingAnts(): void {
    this.stopAnimation();
    this.animateMarchingAnts();
  }

  private animateMarchingAnts(): void {
    if (!this.overlayCtx || !this.overlayCanvas || this.points.length < 3) return;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = '#000000';
    this.overlayCtx.lineWidth = 1;
    this.overlayCtx.setLineDash([4, 4]);
    this.overlayCtx.lineDashOffset = this.dashOffset;

    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.overlayCtx.lineTo(this.points[i].x, this.points[i].y);
    }
    this.overlayCtx.closePath();
    this.overlayCtx.stroke();
    this.overlayCtx.restore();

    this.dashOffset = (this.dashOffset + 0.5) % 8;
    this.animationFrame = requestAnimationFrame(() => this.animateMarchingAnts());
  }

  private stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
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
    container.appendChild(this.overlayCanvas);

    this.overlayCtx = this.overlayCanvas.getContext('2d')!;
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
