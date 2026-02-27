import type { Tool } from './Tool';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SelectionTool implements Tool {
  name = 'marquee';
  cursor = 'crosshair';
  lineWidth = 1;

  private isDrawing = false;
  private isMoving = false;
  private startX = 0;
  private startY = 0;
  private moveOffsetX = 0;
  private moveOffsetY = 0;

  private selectionRect: SelectionRect | null = null;
  private selectionData: ImageData | null = null;

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
    this.selectionRect = null;
    this.selectionData = null;
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    // Clicking inside existing selection: begin move
    if (this.selectionRect && this.isPointInSelection(x, y)) {
      this.isMoving = true;
      this.moveOffsetX = x - this.selectionRect.x;
      this.moveOffsetY = y - this.selectionRect.y;

      // Lift the selection content if not already floating
      if (!this.selectionData) {
        this.selectionData = ctx.getImageData(
          this.selectionRect.x, this.selectionRect.y,
          this.selectionRect.width, this.selectionRect.height,
        );
        // Fill the original area with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          this.selectionRect.x, this.selectionRect.y,
          this.selectionRect.width, this.selectionRect.height,
        );
      }
      return;
    }

    // Stamp any floating selection before starting a new one
    this.stampSelection(ctx);

    // Start new selection drag
    this.isDrawing = true;
    this.startX = x;
    this.startY = y;
    this.selectionRect = null;
    this.selectionData = null;

    this.ensureOverlay(ctx.canvas);
    this.stopAnimation();
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing) {
      const { x, y } = this.getCanvasCoords(e, ctx.canvas);
      this.ensureOverlay(ctx.canvas);
      if (!this.overlayCtx || !this.overlayCanvas) return;

      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

      const rx = Math.min(this.startX, x);
      const ry = Math.min(this.startY, y);
      const rw = Math.abs(x - this.startX);
      const rh = Math.abs(y - this.startY);

      this.overlayCtx.strokeStyle = '#000000';
      this.overlayCtx.lineWidth = 1;
      this.overlayCtx.setLineDash([4, 4]);
      this.overlayCtx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
      return;
    }

    if (this.isMoving && this.selectionRect && this.selectionData) {
      const { x, y } = this.getCanvasCoords(e, ctx.canvas);
      this.selectionRect.x = Math.round(x - this.moveOffsetX);
      this.selectionRect.y = Math.round(y - this.moveOffsetY);
      this.drawFloatingSelection();
      return;
    }
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      const { x, y } = this.getCanvasCoords(e, ctx.canvas);

      const rx = Math.round(Math.min(this.startX, x));
      const ry = Math.round(Math.min(this.startY, y));
      const rw = Math.round(Math.abs(x - this.startX));
      const rh = Math.round(Math.abs(y - this.startY));

      if (rw > 1 && rh > 1) {
        this.selectionRect = { x: rx, y: ry, width: rw, height: rh };
        this.startMarchingAnts();
      } else {
        this.selectionRect = null;
        if (this.overlayCtx && this.overlayCanvas) {
          this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
      }
      return;
    }

    if (this.isMoving) {
      this.isMoving = false;
      this.startMarchingAnts();
    }
  }

  hasSelection(): boolean {
    return this.selectionRect !== null;
  }

  getSelectionRect(): SelectionRect | null {
    return this.selectionRect;
  }

  getSelectionImageData(ctx: CanvasRenderingContext2D): ImageData | null {
    if (!this.selectionRect) return null;
    if (this.selectionData) return this.selectionData;
    return ctx.getImageData(
      this.selectionRect.x, this.selectionRect.y,
      this.selectionRect.width, this.selectionRect.height,
    );
  }

  clearSelection(ctx?: CanvasRenderingContext2D): void {
    if (ctx && this.selectionRect && !this.selectionData) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        this.selectionRect.x, this.selectionRect.y,
        this.selectionRect.width, this.selectionRect.height,
      );
    }
    this.selectionRect = null;
    this.selectionData = null;
    this.stopAnimation();
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  stampSelection(ctx: CanvasRenderingContext2D): void {
    if (this.selectionData && this.selectionRect) {
      ctx.putImageData(this.selectionData, this.selectionRect.x, this.selectionRect.y);
      this.selectionData = null;
    }
    this.selectionRect = null;
    this.stopAnimation();
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  setFloatingSelection(data: ImageData, x: number, y: number, ctx: CanvasRenderingContext2D): void {
    this.stampSelection(ctx);
    this.selectionRect = { x, y, width: data.width, height: data.height };
    this.selectionData = data;
    this.ensureOverlay(ctx.canvas);
    this.drawFloatingSelection();
    this.startMarchingAnts();
  }

  private drawFloatingSelection(): void {
    if (!this.selectionData || !this.selectionRect) return;
    if (!this.overlayCtx || !this.overlayCanvas) return;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.putImageData(this.selectionData, this.selectionRect.x, this.selectionRect.y);
  }

  private isPointInSelection(x: number, y: number): boolean {
    if (!this.selectionRect) return false;
    const r = this.selectionRect;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }

  private startMarchingAnts(): void {
    this.stopAnimation();
    this.animateMarchingAnts();
  }

  private animateMarchingAnts(): void {
    if (!this.overlayCtx || !this.overlayCanvas || !this.selectionRect) return;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Redraw floating selection content if present
    if (this.selectionData) {
      this.overlayCtx.putImageData(this.selectionData, this.selectionRect.x, this.selectionRect.y);
    }

    // Draw marching ants border
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = '#000000';
    this.overlayCtx.lineWidth = 1;
    this.overlayCtx.setLineDash([4, 4]);
    this.overlayCtx.lineDashOffset = this.dashOffset;
    this.overlayCtx.strokeRect(
      this.selectionRect.x + 0.5,
      this.selectionRect.y + 0.5,
      this.selectionRect.width,
      this.selectionRect.height,
    );
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
    container.style.position = 'relative';
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
