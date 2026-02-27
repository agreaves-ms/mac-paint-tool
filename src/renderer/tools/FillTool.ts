import type { Tool } from './Tool';
import { floodFill, type FillColor } from '../canvas/FloodFill';

export class FillTool implements Tool {
  name = 'fill';
  cursor = 'crosshair';
  lineWidth = 1;
  tolerance = 0;
  fillColor: FillColor = { r: 0, g: 0, b: 0, a: 255 };

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    floodFill(ctx, x, y, this.fillColor, this.tolerance);
  }

  onPointerMove(): void {
    // no-op — fill is a single-click operation
  }

  onPointerUp(): void {
    // no-op
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
