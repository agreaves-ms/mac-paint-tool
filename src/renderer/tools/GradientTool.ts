import type { Tool } from './Tool';

export type GradientMode = 'linear' | 'radial';

export class GradientTool implements Tool {
  name = 'gradient';
  cursor = 'crosshair';
  lineWidth = 1;
  foregroundColor = '#000000';
  backgroundColor = '#ffffff';
  gradientMode: GradientMode = 'linear';

  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;

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
    this.drawPreview(x, y);
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.applyGradient(ctx, x, y);

    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  onDeactivate(): void {
    this.removeOverlay();
  }

  private drawPreview(endX: number, endY: number): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;
    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;

    this.overlayCtx.clearRect(0, 0, w, h);

    const gradient = this.createGradient(this.overlayCtx, endX, endY);
    this.overlayCtx.fillStyle = gradient;
    this.overlayCtx.globalAlpha = 0.6;
    this.overlayCtx.fillRect(0, 0, w, h);
    this.overlayCtx.globalAlpha = 1;

    // Draw direction indicator line
    this.overlayCtx.strokeStyle = '#888';
    this.overlayCtx.lineWidth = 1;
    this.overlayCtx.setLineDash([4, 4]);
    this.overlayCtx.beginPath();
    this.overlayCtx.moveTo(this.startX, this.startY);
    this.overlayCtx.lineTo(endX, endY);
    this.overlayCtx.stroke();
    this.overlayCtx.setLineDash([]);
  }

  private applyGradient(ctx: CanvasRenderingContext2D, endX: number, endY: number): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const gradient = this.createGradient(ctx, endX, endY);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private createGradient(
    ctx: CanvasRenderingContext2D,
    endX: number,
    endY: number,
  ): CanvasGradient {
    let gradient: CanvasGradient;

    if (this.gradientMode === 'radial') {
      const radius = Math.hypot(endX - this.startX, endY - this.startY);
      gradient = ctx.createRadialGradient(
        this.startX, this.startY, 0,
        this.startX, this.startY, radius,
      );
    } else {
      gradient = ctx.createLinearGradient(this.startX, this.startY, endX, endY);
    }

    gradient.addColorStop(0, this.foregroundColor);
    gradient.addColorStop(1, this.backgroundColor);
    return gradient;
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
