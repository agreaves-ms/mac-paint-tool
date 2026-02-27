import type { Tool } from './Tool';

export interface BrushPreset {
  name: string;
  size: number;
  opacity: number;
  hardness: number;
}

export const BRUSH_PRESETS: BrushPreset[] = [
  { name: 'Pencil', size: 1, opacity: 100, hardness: 100 },
  { name: 'Marker', size: 8, opacity: 80, hardness: 80 },
  { name: 'Airbrush', size: 20, opacity: 40, hardness: 30 },
  { name: 'Watercolor', size: 15, opacity: 30, hardness: 20 },
];

export class BrushTool implements Tool {
  name = 'brush';
  cursor = 'crosshair';
  lineWidth = 2;
  color = '#000000';
  opacity = 100;
  hardness = 100;

  // Symmetry
  symmetryEnabled = false;
  symmetryAxisCount = 2;
  symmetryAxisType: 'mirror-h' | 'mirror-v' | 'rotational' = 'rotational';

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

    const savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha = this.opacity / 100;

    const useStamps = this.isPenStroke || this.hardness < 100 || this.symmetryEnabled;

    if (useStamps) {
      const width = this.isPenStroke ? 1 + e.pressure * (this.lineWidth - 1) : this.lineWidth;
      this.stampAt(ctx, x, y, width);
      if (this.symmetryEnabled) {
        for (const sp of this.getSymmetryPoints(x, y, ctx.canvas.width, ctx.canvas.height)) {
          this.stampAt(ctx, sp.x, sp.y, width);
        }
      }
    } else {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = this.lineWidth;
      ctx.strokeStyle = this.color;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.globalAlpha = savedAlpha;
  }

  onPointerMove(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    const savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha = this.opacity / 100;

    const useStamps = this.isPenStroke || this.hardness < 100 || this.symmetryEnabled;

    if (useStamps) {
      const width = this.isPenStroke ? 1 + e.pressure * (this.lineWidth - 1) : this.lineWidth;
      const preDist = this.stampDistance;
      this.stampLine(ctx, this.prevRawX, this.prevRawY, x, y, width);
      const postDist = this.stampDistance;
      if (this.symmetryEnabled) {
        const symFrom = this.getSymmetryPoints(this.prevRawX, this.prevRawY, ctx.canvas.width, ctx.canvas.height);
        const symTo = this.getSymmetryPoints(x, y, ctx.canvas.width, ctx.canvas.height);
        for (let i = 0; i < symFrom.length; i++) {
          this.stampDistance = preDist;
          this.stampLine(ctx, symFrom[i].x, symFrom[i].y, symTo[i].x, symTo[i].y, width);
        }
        this.stampDistance = postDist;
      }
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

    ctx.globalAlpha = savedAlpha;
    this.prevRawX = x;
    this.prevRawY = y;
  }

  onPointerUp(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);

    const savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha = this.opacity / 100;

    const useStamps = this.isPenStroke || this.hardness < 100 || this.symmetryEnabled;

    if (useStamps) {
      const width = this.isPenStroke ? 1 + e.pressure * (this.lineWidth - 1) : this.lineWidth;
      const preDist = this.stampDistance;
      this.stampLine(ctx, this.prevRawX, this.prevRawY, x, y, width);
      const postDist = this.stampDistance;
      if (this.symmetryEnabled) {
        const symFrom = this.getSymmetryPoints(this.prevRawX, this.prevRawY, ctx.canvas.width, ctx.canvas.height);
        const symTo = this.getSymmetryPoints(x, y, ctx.canvas.width, ctx.canvas.height);
        for (let i = 0; i < symFrom.length; i++) {
          this.stampDistance = preDist;
          this.stampLine(ctx, symFrom[i].x, symFrom[i].y, symTo[i].x, symTo[i].y, width);
        }
        this.stampDistance = postDist;
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(this.currentPathX, this.currentPathY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.globalAlpha = savedAlpha;
  }

  applyPreset(preset: BrushPreset): void {
    this.lineWidth = preset.size;
    this.opacity = preset.opacity;
    this.hardness = preset.hardness;
  }

  private stampAt(ctx: CanvasRenderingContext2D, x: number, y: number, width?: number): void {
    const radius = (width ?? this.lineWidth) / 2;
    if (radius <= 0) return;

    if (this.hardness < 100) {
      const hardnessRatio = this.hardness / 100;
      const r = parseInt(this.color.slice(1, 3), 16);
      const g = parseInt(this.color.slice(3, 5), 16);
      const b = parseInt(this.color.slice(5, 7), 16);

      const gradient = ctx.createRadialGradient(x, y, radius * hardnessRatio, x, y, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = this.color;
    }

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

  private getSymmetryPoints(x: number, y: number, w: number, h: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    if (this.symmetryAxisType === 'mirror-h') {
      points.push({ x: w - x, y });
    } else if (this.symmetryAxisType === 'mirror-v') {
      points.push({ x, y: h - y });
    } else {
      const cx = w / 2;
      const cy = h / 2;
      for (let k = 1; k < this.symmetryAxisCount; k++) {
        const angle = (2 * Math.PI * k) / this.symmetryAxisCount;
        const dx = x - cx;
        const dy = y - cy;
        points.push({
          x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
          y: cy + dx * Math.sin(angle) + dy * Math.cos(angle),
        });
      }
    }

    return points;
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
