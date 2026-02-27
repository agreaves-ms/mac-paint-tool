export interface BrushEnginePreset {
  name: string;
  spacing: number;
  scatter: number;
  rotation: number;
  size: number;
}

export class BrushEngine {
  private tip: HTMLCanvasElement;
  private tipSize: number;
  private spacing = 0.25;
  private scatter = 0;
  private rotation = 0;
  private size = 10;
  private accumulated = 0;

  constructor() {
    const { canvas, size } = this.createDefaultTip();
    this.tip = canvas;
    this.tipSize = size;
  }

  private createDefaultTip(): { canvas: HTMLCanvasElement; size: number } {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return { canvas, size };
  }

  loadTip(image: HTMLImageElement): void {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    this.tip = canvas;
    this.tipSize = image.width;
  }

  applyPreset(preset: BrushEnginePreset): void {
    this.spacing = preset.spacing;
    this.scatter = preset.scatter;
    this.rotation = preset.rotation;
    this.size = preset.size;
  }

  resetAccumulator(): void {
    this.accumulated = 0;
  }

  stamp(ctx: CanvasRenderingContext2D, x: number, y: number, _color: string): void {
    const scale = this.size / this.tipSize;

    const scatterX = this.scatter > 0 ? (Math.random() - 0.5) * 2 * this.scatter : 0;
    const scatterY = this.scatter > 0 ? (Math.random() - 0.5) * 2 * this.scatter : 0;

    ctx.save();
    ctx.translate(x + scatterX, y + scatterY);

    if (this.rotation > 0) {
      const angle = Math.random() * this.rotation * (Math.PI / 180);
      ctx.rotate(angle);
    }

    ctx.scale(scale, scale);
    ctx.drawImage(this.tip, -this.tipSize / 2, -this.tipSize / 2);
    ctx.restore();
  }

  strokeTo(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stepSize = Math.max(1, this.size * this.spacing);

    if (dist < 0.1) {
      this.stamp(ctx, x1, y1, color);
      return;
    }

    let traveled = this.accumulated;
    while (traveled < dist) {
      const t = traveled / dist;
      this.stamp(ctx, x0 + dx * t, y0 + dy * t, color);
      traveled += stepSize;
    }
    this.accumulated = traveled - dist;
  }

  setSpacing(value: number): void {
    this.spacing = Math.max(0.01, value);
  }

  setScatter(value: number): void {
    this.scatter = Math.max(0, value);
  }

  setRotation(value: number): void {
    this.rotation = value;
  }

  setSize(value: number): void {
    this.size = Math.max(1, value);
  }

  getPreset(name: string): BrushEnginePreset {
    return {
      name,
      spacing: this.spacing,
      scatter: this.scatter,
      rotation: this.rotation,
      size: this.size,
    };
  }
}
