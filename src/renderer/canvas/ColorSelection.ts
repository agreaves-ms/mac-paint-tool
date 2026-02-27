function colorDistance(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2 + (a1 - a2) ** 2);
}

export class ColorSelection {
  private width: number;
  private height: number;
  private canvas: HTMLCanvasElement;
  private selectionMask: Uint8Array | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private boundaryPath: Path2D | null = null;
  private dashOffset = 0;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  select(ctx: CanvasRenderingContext2D, x: number, y: number, gradiance: number): void {
    this.clearSelection();

    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;

    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    const startIdx = (py * this.width + px) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    this.selectionMask = new Uint8Array(this.width * this.height);

    for (let i = 0; i < this.width * this.height; i++) {
      const pi = i * 4;
      if (colorDistance(data[pi], data[pi + 1], data[pi + 2], data[pi + 3],
                        targetR, targetG, targetB, targetA) <= gradiance) {
        this.selectionMask[i] = 1;
      }
    }

    this.computeBoundary();
    this.ensureOverlay();
    this.startAnimation();
  }

  clearSelection(): void {
    this.selectionMask = null;
    this.boundaryPath = null;
    this.stopAnimation();
    this.removeOverlay();
  }

  getSelectionMask(): Uint8Array | null {
    return this.selectionMask;
  }

  private computeBoundary(): void {
    if (!this.selectionMask) return;

    const mask = this.selectionMask;
    const w = this.width;
    const h = this.height;
    this.boundaryPath = new Path2D();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;

        if (y === 0 || !mask[(y - 1) * w + x]) {
          this.boundaryPath.moveTo(x, y);
          this.boundaryPath.lineTo(x + 1, y);
        }
        if (y === h - 1 || !mask[(y + 1) * w + x]) {
          this.boundaryPath.moveTo(x, y + 1);
          this.boundaryPath.lineTo(x + 1, y + 1);
        }
        if (x === 0 || !mask[y * w + x - 1]) {
          this.boundaryPath.moveTo(x, y);
          this.boundaryPath.lineTo(x, y + 1);
        }
        if (x === w - 1 || !mask[y * w + x + 1]) {
          this.boundaryPath.moveTo(x + 1, y);
          this.boundaryPath.lineTo(x + 1, y + 1);
        }
      }
    }
  }

  private ensureOverlay(): void {
    if (this.overlayCanvas) return;

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = this.width;
    this.overlayCanvas.height = this.height;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.left = `${this.canvas.offsetLeft}px`;
    this.overlayCanvas.style.top = `${this.canvas.offsetTop}px`;

    const container = this.canvas.parentElement;
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

  private startAnimation(): void {
    const animate = (): void => {
      this.dashOffset = (this.dashOffset + 0.5) % 8;
      this.drawMarchingAnts();
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private drawMarchingAnts(): void {
    if (!this.overlayCtx || !this.boundaryPath) return;

    this.overlayCtx.clearRect(0, 0, this.width, this.height);
    this.overlayCtx.strokeStyle = 'black';
    this.overlayCtx.lineWidth = 1;
    this.overlayCtx.setLineDash([4, 4]);
    this.overlayCtx.lineDashOffset = -this.dashOffset;
    this.overlayCtx.stroke(this.boundaryPath);

    this.overlayCtx.strokeStyle = 'white';
    this.overlayCtx.lineDashOffset = -(this.dashOffset + 4);
    this.overlayCtx.stroke(this.boundaryPath);
  }
}
