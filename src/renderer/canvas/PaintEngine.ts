import type { Tool } from '../tools/Tool';
import type { SelectionTool, SelectionRect } from '../tools/SelectionTool';
import type { EyedropperTool } from '../tools/EyedropperTool';
import type { LayerManager } from './LayerManager';

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

  // Layer management
  private layerManager: LayerManager | null = null;
  private layerStack: HTMLElement | null = null;

  // Grid overlay
  private gridCanvas: HTMLCanvasElement | null = null;
  private gridCtx: CanvasRenderingContext2D | null = null;
  private gridEnabled = false;
  private static readonly GRID_MIN_ZOOM = 8;

  // Symmetry overlay
  private symmetryCanvas: HTMLCanvasElement | null = null;
  private symmetryCtx: CanvasRenderingContext2D | null = null;

  // Zoom change callback
  private onZoomChangeCallback: ((zoom: number) => void) | null = null;

  // Canvas size change callback
  private onCanvasSizeChangeCallback: ((w: number, h: number) => void) | null = null;

  // Selection and eyedropper references
  private selectionTool: SelectionTool | null = null;
  private eyedropperTool: EyedropperTool | null = null;

  // Dirty tracking
  private dirty = false;

  // Export quality for JPEG/WebP (0.1–1.0)
  private _exportQuality = 0.92;

  // Selection state (proxied from SelectionTool for clipboard access)
  selectionRect: SelectionRect | null = null;
  selectionData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.setupEventListeners();
    this.setupDragDrop();
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
    // Alt+click: temporarily sample color with eyedropper
    if (e.altKey && this.eyedropperTool) {
      this.eyedropperTool.sampleColor(e, this.getContext());
      return;
    }
    if (this.activeTool) {
      this.activeTool.onPointerDown(e, this.getContext());
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
      this.activeTool.onPointerMove(e, this.getContext());
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = this.isSpaceDown ? 'grab' : (this.activeTool?.cursor ?? 'default');
      return;
    }
    if (this.activeTool) {
      this.activeTool.onPointerUp(e, this.getContext());
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
    const target = this.layerStack ?? this.canvas;
    target.style.transformOrigin = '0 0';
    target.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
    this.renderGrid();
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
    this.onZoomChangeCallback?.(this.zoomLevel);
  }

  setZoom(level: number): void {
    this.zoomLevel = Math.max(0.25, Math.min(16, level));
    this.applyTransform();
    this.onZoomChangeCallback?.(this.zoomLevel);
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

  onZoomChange(callback: (zoom: number) => void): void {
    this.onZoomChangeCallback = callback;
  }

  onCanvasSizeChange(cb: (w: number, h: number) => void): void {
    this.onCanvasSizeChangeCallback = cb;
  }

  // Grid overlay

  initGrid(container: HTMLElement): void {
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.className = 'grid-overlay';
    this.gridCanvas.style.imageRendering = 'pixelated';
    container.appendChild(this.gridCanvas);
    this.gridCtx = this.gridCanvas.getContext('2d')!;
  }

  toggleGrid(): boolean {
    this.gridEnabled = !this.gridEnabled;
    this.renderGrid();
    return this.gridEnabled;
  }

  isGridEnabled(): boolean {
    return this.gridEnabled;
  }

  private renderGrid(): void {
    if (!this.gridCanvas || !this.gridCtx) return;

    const container = this.gridCanvas.parentElement;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    if (this.gridCanvas.width !== cw || this.gridCanvas.height !== ch) {
      this.gridCanvas.width = cw;
      this.gridCanvas.height = ch;
    }

    this.gridCtx.clearRect(0, 0, cw, ch);

    if (!this.gridEnabled || this.zoomLevel < PaintEngine.GRID_MIN_ZOOM) return;

    const pixelSize = this.zoomLevel;
    const docW = this.canvas.width;
    const docH = this.canvas.height;

    this.gridCtx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    this.gridCtx.lineWidth = 1;
    this.gridCtx.beginPath();

    // Vertical lines at pixel boundaries
    for (let dx = 0; dx <= docW; dx++) {
      const sx = Math.round(this.panX + dx * pixelSize) + 0.5;
      if (sx < -1) continue;
      if (sx > cw + 1) break;
      this.gridCtx.moveTo(sx, Math.max(0, this.panY));
      this.gridCtx.lineTo(sx, Math.min(ch, this.panY + docH * pixelSize));
    }

    // Horizontal lines at pixel boundaries
    for (let dy = 0; dy <= docH; dy++) {
      const sy = Math.round(this.panY + dy * pixelSize) + 0.5;
      if (sy < -1) continue;
      if (sy > ch + 1) break;
      this.gridCtx.moveTo(Math.max(0, this.panX), sy);
      this.gridCtx.lineTo(Math.min(cw, this.panX + docW * pixelSize), sy);
    }

    this.gridCtx.stroke();
  }

  // Symmetry overlay

  drawSymmetryOverlay(enabled: boolean, type: string, axisCount: number): void {
    if (!enabled) {
      if (this.symmetryCtx && this.symmetryCanvas) {
        this.symmetryCtx.clearRect(0, 0, this.symmetryCanvas.width, this.symmetryCanvas.height);
      }
      return;
    }

    // Create symmetry canvas lazily, appending to the same container as grid
    if (!this.symmetryCanvas) {
      const container = this.gridCanvas?.parentElement ?? this.canvas.parentElement;
      if (!container) return;
      this.symmetryCanvas = document.createElement('canvas');
      this.symmetryCanvas.className = 'symmetry-overlay';
      this.symmetryCanvas.style.imageRendering = 'pixelated';
      container.appendChild(this.symmetryCanvas);
      this.symmetryCtx = this.symmetryCanvas.getContext('2d')!;
    }

    const container = this.symmetryCanvas.parentElement;
    if (!container || !this.symmetryCtx) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    if (this.symmetryCanvas.width !== cw || this.symmetryCanvas.height !== ch) {
      this.symmetryCanvas.width = cw;
      this.symmetryCanvas.height = ch;
    }

    this.symmetryCtx.clearRect(0, 0, cw, ch);

    // Canvas center in screen coordinates
    const cx = this.panX + (this.canvas.width * this.zoomLevel) / 2;
    const cy = this.panY + (this.canvas.height * this.zoomLevel) / 2;
    const halfW = (this.canvas.width * this.zoomLevel) / 2;
    const halfH = (this.canvas.height * this.zoomLevel) / 2;
    const maxRadius = Math.sqrt(halfW * halfW + halfH * halfH);

    this.symmetryCtx.strokeStyle = 'rgba(0, 120, 255, 0.6)';
    this.symmetryCtx.lineWidth = 1;
    this.symmetryCtx.setLineDash([6, 4]);
    this.symmetryCtx.beginPath();

    if (type === 'mirror-h') {
      this.symmetryCtx.moveTo(cx, this.panY);
      this.symmetryCtx.lineTo(cx, this.panY + this.canvas.height * this.zoomLevel);
    } else if (type === 'mirror-v') {
      this.symmetryCtx.moveTo(this.panX, cy);
      this.symmetryCtx.lineTo(this.panX + this.canvas.width * this.zoomLevel, cy);
    } else if (type === 'rotational') {
      for (let k = 0; k < axisCount; k++) {
        const angle = (2 * Math.PI * k) / axisCount;
        this.symmetryCtx.moveTo(cx, cy);
        this.symmetryCtx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
      }
    }

    this.symmetryCtx.stroke();
    this.symmetryCtx.setLineDash([]);
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
    const filePath = await window.electronAPI?.getSavePath();
    if (!filePath) return;

    const ext = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    let quality: number | undefined;

    switch (ext) {
      case 'jpg': case 'jpeg':
        mimeType = 'image/jpeg';
        quality = this._exportQuality;
        break;
      case 'webp':
        mimeType = 'image/webp';
        quality = this._exportQuality;
        break;
    }

    const exportCanvas = this.getExportCanvas();
    const dataUrl = quality !== undefined
      ? exportCanvas.toDataURL(mimeType, quality)
      : exportCanvas.toDataURL(mimeType);

    await window.electronAPI?.writeImageFile(filePath, dataUrl);
    this.dirty = false;
  }

  exportToBlob(mimeType: string, quality?: number): Promise<Blob> {
    const exportCanvas = this.getExportCanvas();
    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        mimeType,
        quality,
      );
    });
  }

  async openFile(): Promise<void> {
    const result = await window.electronAPI?.openFile();
    if (!result) return;

    const drawCtx = this.getContext();
    const backup = drawCtx.getImageData(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    const img = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        const binary = atob(result.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes]);
        img.src = URL.createObjectURL(blob);
      });
      drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
      drawCtx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      this.dirty = false;
    } catch {
      drawCtx.putImageData(backup, 0, 0);
    }
  }

  // Document management

  newDocument(width: number, height: number, bgColor = '#ffffff'): void {
    this.canvas.width = width;
    this.canvas.height = height;

    if (this.layerManager) {
      this.layerManager.reset(width, height, bgColor === 'transparent' ? undefined : bgColor);
      if (this.layerStack) {
        this.layerStack.style.width = `${width}px`;
        this.layerStack.style.height = `${height}px`;
      }
    } else {
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      if (bgColor !== 'transparent') {
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, width, height);
      }
    }
    this.resetZoom();
    this.dirty = false;
  }

  markDirty(): void {
    this.dirty = true;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  clearDirty(): void {
    this.dirty = false;
  }

  get exportQuality(): number {
    return this._exportQuality;
  }

  set exportQuality(q: number) {
    this._exportQuality = Math.max(0.1, Math.min(1.0, q));
  }

  // Canvas resize and crop

  resizeCanvas(width: number, height: number, anchor: string, bgColor: string): void {
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = oldWidth;
    tempCanvas.height = oldHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(this.canvas, 0, 0);

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);

    const anchorOffsets: Record<string, [number, number]> = {
      'top-left': [0, 0],
      'top-center': [0.5, 0],
      'top-right': [1, 0],
      'middle-left': [0, 0.5],
      'center': [0.5, 0.5],
      'middle-right': [1, 0.5],
      'bottom-left': [0, 1],
      'bottom-center': [0.5, 1],
      'bottom-right': [1, 1],
    };

    const [ax, ay] = anchorOffsets[anchor] || [0.5, 0.5];
    const offsetX = Math.round((width - oldWidth) * ax);
    const offsetY = Math.round((height - oldHeight) * ay);

    this.ctx.drawImage(tempCanvas, offsetX, offsetY);
  }

  cropToSelection(): void {
    if (!this.selectionTool?.hasSelection()) return;
    const rect = this.selectionRect;
    if (!rect) return;

    const imageData = this.ctx.getImageData(rect.x, rect.y, rect.width, rect.height);

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.putImageData(imageData, 0, 0);

    this.onCanvasSizeChangeCallback?.(rect.width, rect.height);
    this.clearSelection();
  }

  // Drag and drop

  private setupDragDrop(): void {
    this.canvas.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.canvas.classList.add('drag-over');
    });

    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('dragleave', () => {
      this.canvas.classList.remove('drag-over');
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.canvas.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (!file?.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        this.getContext().drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        this.onCanvasSizeChangeCallback?.(this.canvas.width, this.canvas.height);
      };
      img.src = url;
    });
  }

  // Accessors

  getContext(): CanvasRenderingContext2D {
    if (this.layerManager) {
      const layerCtx = this.layerManager.getActiveContext();
      if (layerCtx) return layerCtx;
    }
    return this.ctx;
  }

  setLayerManager(lm: LayerManager): void {
    this.layerManager = lm;
    this.layerStack = lm.getLayerStack();
  }

  getLayerManager(): LayerManager | null {
    return this.layerManager;
  }

  resolveLayerContext(layerId: string): CanvasRenderingContext2D {
    if (this.layerManager) {
      const layers = this.layerManager.getLayers();
      const layer = layers.find((l) => l.id === layerId);
      if (layer) return layer.ctx;
    }
    return this.getContext();
  }

  private getExportCanvas(): HTMLCanvasElement {
    if (this.layerManager) {
      return this.layerManager.getExportCanvas();
    }
    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Selection tool reference

  setSelectionTool(tool: SelectionTool): void {
    this.selectionTool = tool;
  }

  setEyedropperTool(tool: EyedropperTool): void {
    this.eyedropperTool = tool;
  }

  // Selection state accessors

  hasSelection(): boolean {
    return this.selectionTool?.hasSelection() ?? false;
  }

  getSelectionImageData(): ImageData | null {
    return this.selectionTool?.getSelectionImageData(this.getContext()) ?? null;
  }

  clearSelection(): void {
    this.selectionTool?.clearSelection(this.getContext());
  }

  setSelectionRect(rect: SelectionRect | null): void {
    this.selectionRect = rect;
  }

  setSelectionData(data: ImageData | null): void {
    this.selectionData = data;
  }

  // Clipboard methods

  async copySelection(): Promise<void> {
    if (!this.selectionTool?.hasSelection()) return;
    const drawCtx = this.getContext();
    const imageData = this.selectionTool.getSelectionImageData(drawCtx);
    if (!imageData) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        tempCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      // Fallback: use Electron IPC
      const dataUrl = tempCanvas.toDataURL('image/png');
      await window.electronAPI?.writeClipboardImage(dataUrl);
    }
  }

  async cutSelection(): Promise<void> {
    await this.copySelection();
    if (this.selectionTool?.hasSelection()) {
      this.selectionTool.clearSelection(this.getContext());
    }
  }

  async pasteFromClipboard(): Promise<void> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const bitmap = await createImageBitmap(blob);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = bitmap.width;
        tempCanvas.height = bitmap.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(bitmap, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, bitmap.width, bitmap.height);

        if (this.selectionTool) {
          this.selectionTool.setFloatingSelection(imageData, 0, 0, this.getContext());
        } else {
          this.getContext().putImageData(imageData, 0, 0);
        }
        return;
      }
    } catch {
      // Fallback: use Electron IPC
      const dataUrl = await window.electronAPI?.readClipboardImage();
      if (!dataUrl) return;
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);

      if (this.selectionTool) {
        this.selectionTool.setFloatingSelection(imageData, 0, 0, this.getContext());
      } else {
        this.getContext().putImageData(imageData, 0, 0);
      }
    }
  }

  async pasteAsNew(): Promise<void> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const bitmap = await createImageBitmap(blob);
        this.newDocument(bitmap.width, bitmap.height, '#ffffff');
        this.ctx.drawImage(bitmap, 0, 0);
        return;
      }
    } catch {
      const dataUrl = await window.electronAPI?.readClipboardImage();
      if (!dataUrl) return;
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });
      this.newDocument(img.width, img.height, '#ffffff');
      this.ctx.drawImage(img, 0, 0);
    }
  }
}
