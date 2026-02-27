import type { Tool } from '../tools/Tool';

export class PaintEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeTool: Tool | null = null;

  // Zoom/pan state
  private zoomLevel = 1.0;
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private isSpaceDown = false;
  private lastPanPointer = { x: 0, y: 0 };

  private static readonly ZOOM_STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  // Pointer event handlers with pan support

  private handlePointerDown(e: PointerEvent): void {
    if (this.isSpaceDown) {
      this.isPanning = true;
      this.lastPanPointer = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    if (this.activeTool) {
      this.activeTool.onPointerDown(e, this.ctx);
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.isPanning) {
      this.panX += e.clientX - this.lastPanPointer.x;
      this.panY += e.clientY - this.lastPanPointer.y;
      this.lastPanPointer = { x: e.clientX, y: e.clientY };
      this.applyTransform();
      return;
    }
    if (this.activeTool) {
      this.activeTool.onPointerMove(e, this.ctx);
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = this.isSpaceDown ? 'grab' : (this.activeTool?.cursor ?? 'default');
      return;
    }
    if (this.activeTool) {
      this.activeTool.onPointerUp(e, this.ctx);
    }
  }

  // Zoom via wheel / trackpad pinch

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const sensitivity = e.ctrlKey ? 0.01 : 0.003;
    const factor = Math.pow(2, -e.deltaY * sensitivity);
    const newZoom = Math.max(0.25, Math.min(16, this.zoomLevel * factor));
    this.zoomAtPoint(newZoom, e.clientX, e.clientY);
  }

  // Space+drag pan

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      this.isSpaceDown = true;
      this.canvas.style.cursor = 'grab';
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      this.isSpaceDown = false;
      this.isPanning = false;
      this.canvas.style.cursor = this.activeTool?.cursor ?? 'default';
    }
  }

  // Zoom/pan methods

  private applyTransform(): void {
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  }

  private zoomAtPoint(newZoom: number, clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (clientX - rect.left) / this.zoomLevel;
    const cy = (clientY - rect.top) / this.zoomLevel;
    const oldZoom = this.zoomLevel;
    this.zoomLevel = newZoom;
    this.panX += cx * (oldZoom - this.zoomLevel);
    this.panY += cy * (oldZoom - this.zoomLevel);
    this.applyTransform();
  }

  setZoom(level: number): void {
    this.zoomLevel = Math.max(0.25, Math.min(16, level));
    this.applyTransform();
  }

  zoomIn(): void {
    const next = PaintEngine.ZOOM_STEPS.find((s) => s > this.zoomLevel);
    this.setZoom(next ?? PaintEngine.ZOOM_STEPS[PaintEngine.ZOOM_STEPS.length - 1]);
  }

  zoomOut(): void {
    const prev = [...PaintEngine.ZOOM_STEPS].reverse().find((s) => s < this.zoomLevel);
    this.setZoom(prev ?? PaintEngine.ZOOM_STEPS[0]);
  }

  resetZoom(): void {
    this.panX = 0;
    this.panY = 0;
    this.setZoom(1);
  }

  getZoomLevel(): number {
    return this.zoomLevel;
  }

  // Active tool

  setActiveTool(tool: Tool): void {
    if (this.activeTool) {
      this.activeTool.onDeactivate?.();
    }
    this.activeTool = tool;
    this.canvas.style.cursor = tool.cursor;
    tool.onActivate?.();
  }

  mapCoordinates(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.zoomLevel,
      y: (e.clientY - rect.top) / this.zoomLevel,
    };
  }

  // File I/O

  async saveFile(): Promise<void> {
    const dataUrl = this.canvas.toDataURL('image/png');
    await window.electronAPI?.saveFile(dataUrl);
  }

  async openFile(): Promise<void> {
    const result = await window.electronAPI?.openFile();
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
    };
    const binary = atob(result.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes]);
    img.src = URL.createObjectURL(blob);
  }

  // Document management

  newDocument(width: number, height: number, bgColor: string = '#ffffff'): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);
    this.resetZoom();
  }

  // Accessors

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
