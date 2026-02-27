import type { Tool } from './Tool';

export class EyedropperTool implements Tool {
  name = 'eyedropper';
  cursor = 'crosshair';
  lineWidth = 1;

  onColorSampled: ((color: string) => void) | null = null;
  onColorPreview: ((color: string, x: number, y: number) => void) | null = null;

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    this.sampleColor(e, ctx);
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    const px = Math.max(0, Math.min(Math.round(x), ctx.canvas.width - 1));
    const py = Math.max(0, Math.min(Math.round(y), ctx.canvas.height - 1));
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = '#' +
      pixel[0].toString(16).padStart(2, '0') +
      pixel[1].toString(16).padStart(2, '0') +
      pixel[2].toString(16).padStart(2, '0');
    this.onColorPreview?.(hex, e.clientX, e.clientY);
  }

  onPointerUp(): void {
    // No action on up
  }

  onDeactivate(): void {
    this.onColorPreview?.('', -1, -1);
  }

  sampleColor(e: PointerEvent, ctx: CanvasRenderingContext2D): string {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    const px = Math.max(0, Math.min(Math.round(x), ctx.canvas.width - 1));
    const py = Math.max(0, Math.min(Math.round(y), ctx.canvas.height - 1));
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = '#' +
      pixel[0].toString(16).padStart(2, '0') +
      pixel[1].toString(16).padStart(2, '0') +
      pixel[2].toString(16).padStart(2, '0');
    this.onColorSampled?.(hex);
    return hex;
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
