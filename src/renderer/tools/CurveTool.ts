import type { Tool } from './Tool';

type CurveState = 'idle' | 'settingEnd' | 'settingCP1' | 'settingCP2' | 'adjusting';

export class CurveTool implements Tool {
  name = 'curve';
  cursor = 'crosshair';
  lineWidth = 2;
  color = '#000000';
  curveType: 'quadratic' | 'cubic' = 'quadratic';

  private state: CurveState = 'idle';
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private cp1X = 0;
  private cp1Y = 0;
  private cp2X = 0;
  private cp2Y = 0;
  private currentX = 0;
  private currentY = 0;

  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private mainCtx: CanvasRenderingContext2D | null = null;
  private canvasRef: HTMLCanvasElement | null = null;
  private draggingCP: 'cp1' | 'cp2' | null = null;

  private onKeyHandler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.cancel();
    } else if (e.key === 'Enter') {
      this.commit();
    }
  };

  private onDblClickHandler = (): void => {
    this.commit();
  };

  onActivate(): void {
    document.addEventListener('keydown', this.onKeyHandler);
  }

  onDeactivate(): void {
    document.removeEventListener('keydown', this.onKeyHandler);
    this.canvasRef?.removeEventListener('dblclick', this.onDblClickHandler);
    this.canvasRef = null;
    this.reset();
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    this.mainCtx = ctx;
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    if (!this.canvasRef) {
      this.canvasRef = ctx.canvas;
      this.canvasRef.addEventListener('dblclick', this.onDblClickHandler);
    }

    switch (this.state) {
      case 'idle':
        this.startX = x;
        this.startY = y;
        this.state = 'settingEnd';
        this.ensureOverlay(ctx.canvas);
        break;

      case 'settingEnd':
        this.endX = x;
        this.endY = y;
        this.cp1X = (this.startX + this.endX) / 2;
        this.cp1Y = (this.startY + this.endY) / 2 - 50;
        this.state = 'settingCP1';
        break;

      case 'settingCP1':
        this.cp1X = x;
        this.cp1Y = y;
        if (this.curveType === 'quadratic') {
          this.state = 'adjusting';
        } else {
          this.cp2X = (this.startX + this.endX) / 2;
          this.cp2Y = (this.startY + this.endY) / 2 + 50;
          this.state = 'settingCP2';
        }
        break;

      case 'settingCP2':
        this.cp2X = x;
        this.cp2Y = y;
        this.state = 'adjusting';
        break;

      case 'adjusting': {
        const cp1Dist = Math.hypot(x - this.cp1X, y - this.cp1Y);
        const cp2Dist = this.curveType === 'cubic' ? Math.hypot(x - this.cp2X, y - this.cp2Y) : Infinity;

        if (cp1Dist < 10) {
          this.draggingCP = 'cp1';
        } else if (cp2Dist < 10) {
          this.draggingCP = 'cp2';
        }
        break;
      }
    }

    this.drawPreview();
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.currentX = x;
    this.currentY = y;

    if (this.state === 'adjusting' && this.draggingCP) {
      if (this.draggingCP === 'cp1') {
        this.cp1X = x;
        this.cp1Y = y;
      } else {
        this.cp2X = x;
        this.cp2Y = y;
      }
    }

    if (this.state !== 'idle') {
      this.drawPreview();
    }
  }

  onPointerUp(_e: PointerEvent, _ctx: CanvasRenderingContext2D): void {
    this.draggingCP = null;
  }

  private drawPreview(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;
    ctx.lineCap = 'round';

    switch (this.state) {
      case 'settingEnd':
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.currentX, this.currentY);
        ctx.stroke();
        ctx.setLineDash([]);
        this.drawHandle(ctx, this.startX, this.startY);
        break;

      case 'settingCP1':
        this.drawCurvePreview(ctx, this.currentX, this.currentY, this.cp2X, this.cp2Y);
        break;

      case 'settingCP2':
        this.drawCurvePreview(ctx, this.cp1X, this.cp1Y, this.currentX, this.currentY);
        break;

      case 'adjusting':
        this.drawCurvePreview(ctx, this.cp1X, this.cp1Y, this.cp2X, this.cp2Y);
        break;
    }
  }

  private drawCurvePreview(
    ctx: CanvasRenderingContext2D,
    cpx1: number, cpy1: number,
    cpx2: number, cpy2: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    if (this.curveType === 'quadratic') {
      ctx.quadraticCurveTo(cpx1, cpy1, this.endX, this.endY);
    } else {
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, this.endX, this.endY);
    }
    ctx.stroke();

    // Draw control lines
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#888';
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(cpx1, cpy1);
    ctx.stroke();

    if (this.curveType === 'quadratic') {
      ctx.beginPath();
      ctx.moveTo(cpx1, cpy1);
      ctx.lineTo(this.endX, this.endY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cpx1, cpy1);
      ctx.lineTo(cpx2, cpy2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cpx2, cpy2);
      ctx.lineTo(this.endX, this.endY);
      ctx.stroke();
    }

    ctx.restore();

    // Draw handles
    this.drawHandle(ctx, this.startX, this.startY);
    this.drawHandle(ctx, this.endX, this.endY);
    this.drawHandle(ctx, cpx1, cpy1, true);
    if (this.curveType === 'cubic') {
      this.drawHandle(ctx, cpx2, cpy2, true);
    }
  }

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, isCP = false): void {
    ctx.save();
    ctx.fillStyle = isCP ? '#ff6600' : '#0078d4';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, isCP ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private commit(): void {
    if (this.state === 'idle' || this.state === 'settingEnd') return;
    if (!this.mainCtx) return;

    const ctx = this.mainCtx;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.color;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    if (this.curveType === 'quadratic') {
      ctx.quadraticCurveTo(this.cp1X, this.cp1Y, this.endX, this.endY);
    } else {
      ctx.bezierCurveTo(this.cp1X, this.cp1Y, this.cp2X, this.cp2Y, this.endX, this.endY);
    }
    ctx.stroke();

    this.resetState();
  }

  private cancel(): void {
    this.resetState();
  }

  private reset(): void {
    this.resetState();
  }

  private resetState(): void {
    this.state = 'idle';
    this.draggingCP = null;
    if (this.overlayCtx && this.overlayCanvas) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
    this.removeOverlay();
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

    this.overlayCtx = this.overlayCanvas.getContext('2d');
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
