import { Adjustments, type HistogramData } from '../canvas/Adjustments';

type Channel = 'rgb' | 'r' | 'g' | 'b';

export class CurvesDialog {
  private overlay!: HTMLElement;
  private dialog!: HTMLElement;
  private curveCanvas!: HTMLCanvasElement;
  private curveCtx!: CanvasRenderingContext2D;
  private histogramData: HistogramData | null = null;
  private channel: Channel = 'rgb';
  private controlPoints: Map<Channel, { x: number; y: number }[]> = new Map();
  private draggingPoint = -1;
  private previewEnabled = true;
  private onApply: ((lutR: number[], lutG: number[], lutB: number[]) => void) | null = null;
  private onCancel: (() => void) | null = null;

  constructor() {
    this.controlPoints.set('rgb', [{ x: 0, y: 0 }, { x: 255, y: 255 }]);
    this.controlPoints.set('r', [{ x: 0, y: 0 }, { x: 255, y: 255 }]);
    this.controlPoints.set('g', [{ x: 0, y: 0 }, { x: 255, y: 255 }]);
    this.controlPoints.set('b', [{ x: 0, y: 0 }, { x: 255, y: 255 }]);
  }

  show(
    imageData: ImageData,
    onApply: (lutR: number[], lutG: number[], lutB: number[]) => void,
    onCancel: () => void
  ): void {
    this.onApply = onApply;
    this.onCancel = onCancel;
    this.histogramData = Adjustments.calculateHistogram(imageData);
    this.render();
  }

  private render(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';

    this.dialog = document.createElement('div');
    this.dialog.className = 'dialog curves-dialog';

    const title = document.createElement('h3');
    title.textContent = 'Curves';
    title.className = 'dialog-title';
    this.dialog.appendChild(title);

    // Channel selector
    const channelRow = document.createElement('div');
    channelRow.className = 'prop-mode-group';
    const channels: { label: string; value: Channel }[] = [
      { label: 'RGB', value: 'rgb' },
      { label: 'R', value: 'r' },
      { label: 'G', value: 'g' },
      { label: 'B', value: 'b' },
    ];
    for (const ch of channels) {
      const btn = document.createElement('button');
      btn.className = 'prop-mode-btn' + (ch.value === this.channel ? ' active' : '');
      btn.textContent = ch.label;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.channel = ch.value;
        channelRow.querySelectorAll('.prop-mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawCurve();
      });
      channelRow.appendChild(btn);
    }
    this.dialog.appendChild(channelRow);

    // Curve canvas
    this.curveCanvas = document.createElement('canvas');
    this.curveCanvas.width = 256;
    this.curveCanvas.height = 256;
    this.curveCanvas.className = 'curve-canvas';
    this.curveCtx = this.curveCanvas.getContext('2d')!;
    this.dialog.appendChild(this.curveCanvas);

    this.curveCanvas.addEventListener('pointerdown', (e) => this.onCurvePointerDown(e));
    this.curveCanvas.addEventListener('pointermove', (e) => this.onCurvePointerMove(e));
    this.curveCanvas.addEventListener('pointerup', () => this.onCurvePointerUp());

    // Preview toggle
    const previewRow = document.createElement('div');
    previewRow.className = 'prop-slider-row';
    const previewCheck = document.createElement('input');
    previewCheck.type = 'checkbox';
    previewCheck.checked = this.previewEnabled;
    previewCheck.addEventListener('change', () => {
      this.previewEnabled = previewCheck.checked;
    });
    const previewLabel = document.createElement('label');
    previewLabel.textContent = 'Preview';
    previewRow.appendChild(previewCheck);
    previewRow.appendChild(previewLabel);
    this.dialog.appendChild(previewRow);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';

    const applyBtn = document.createElement('button');
    applyBtn.className = 'dialog-btn dialog-btn-primary';
    applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
      const rgbPts = this.controlPoints.get('rgb')!;
      const rPts = this.controlPoints.get('r')!;
      const gPts = this.controlPoints.get('g')!;
      const bPts = this.controlPoints.get('b')!;
      const lutRGB = Adjustments.buildLUT(rgbPts);
      const lutR = Adjustments.buildLUT(rPts);
      const lutG = Adjustments.buildLUT(gPts);
      const lutB = Adjustments.buildLUT(bPts);

      // Compose RGB master + per-channel LUTs
      const finalR = new Array<number>(256);
      const finalG = new Array<number>(256);
      const finalB = new Array<number>(256);
      for (let i = 0; i < 256; i++) {
        finalR[i] = lutR[lutRGB[i]];
        finalG[i] = lutG[lutRGB[i]];
        finalB[i] = lutB[lutRGB[i]];
      }

      this.onApply?.(finalR, finalG, finalB);
      this.close();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dialog-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this.onCancel?.();
      this.close();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(applyBtn);
    this.dialog.appendChild(actions);

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    this.drawCurve();
  }

  private drawCurve(): void {
    const ctx = this.curveCtx;
    const w = 256;
    const h = 256;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    if (this.histogramData) {
      this.drawHistogram(ctx, w, h);
    }

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Diagonal reference
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();

    // Curve from LUT
    const points = this.controlPoints.get(this.channel)!;
    const lut = Adjustments.buildLUT(points);

    const channelColors: Record<Channel, string> = {
      rgb: '#ffffff',
      r: '#ff4444',
      g: '#44ff44',
      b: '#4444ff',
    };

    ctx.strokeStyle = channelColors[this.channel];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - lut[0]);
    for (let i = 1; i < 256; i++) {
      ctx.lineTo(i, h - lut[i]);
    }
    ctx.stroke();

    // Control points
    ctx.fillStyle = channelColors[this.channel];
    for (const pt of points) {
      ctx.beginPath();
      ctx.arc(pt.x, h - pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawHistogram(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.histogramData) return;

    const channels: { data: number[]; color: string }[] = [];
    if (this.channel === 'rgb' || this.channel === 'r') {
      channels.push({ data: this.histogramData.r, color: 'rgba(255,0,0,0.3)' });
    }
    if (this.channel === 'rgb' || this.channel === 'g') {
      channels.push({ data: this.histogramData.g, color: 'rgba(0,255,0,0.3)' });
    }
    if (this.channel === 'rgb' || this.channel === 'b') {
      channels.push({ data: this.histogramData.b, color: 'rgba(0,0,255,0.3)' });
    }

    for (const ch of channels) {
      const max = Math.max(...ch.data);
      if (max === 0) continue;
      ctx.fillStyle = ch.color;
      for (let i = 0; i < w; i++) {
        const barH = (ch.data[i] / max) * h;
        ctx.fillRect(i, h - barH, 1, barH);
      }
    }
  }

  private onCurvePointerDown(e: PointerEvent): void {
    const rect = this.curveCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = 256 - (e.clientY - rect.top);
    const points = this.controlPoints.get(this.channel)!;

    // Check if clicking near existing point
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        this.draggingPoint = i;
        this.curveCanvas.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Add new control point
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    points.push({ x: roundedX, y: roundedY });
    points.sort((a, b) => a.x - b.x);
    this.draggingPoint = points.findIndex((p) => p.x === roundedX && p.y === roundedY);
    this.curveCanvas.setPointerCapture(e.pointerId);
    this.drawCurve();
  }

  private onCurvePointerMove(e: PointerEvent): void {
    if (this.draggingPoint < 0) return;

    const rect = this.curveCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(255, Math.round(e.clientX - rect.left)));
    const y = Math.max(0, Math.min(255, 256 - Math.round(e.clientY - rect.top)));
    const points = this.controlPoints.get(this.channel)!;

    if (this.draggingPoint === 0) {
      points[this.draggingPoint] = { x: 0, y };
    } else if (this.draggingPoint === points.length - 1) {
      points[this.draggingPoint] = { x: 255, y };
    } else {
      points[this.draggingPoint] = { x, y };
    }

    this.drawCurve();
  }

  private onCurvePointerUp(): void {
    this.draggingPoint = -1;
  }

  private close(): void {
    this.overlay.remove();
  }
}
