import type { Tool } from '../tools/Tool';
import type { SelectionTool, SelectionRect } from '../tools/SelectionTool';
import type { EyedropperTool } from '../tools/EyedropperTool';

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

  // Selection and eyedropper references
  private selectionTool: SelectionTool | null = null;
  private eyedropperTool: EyedropperTool | null = null;

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
      this.eyedropperTool.sampleColor(e, this.ctx);
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
    const filePath = await window.electronAPI?.getSavePath();
    if (!filePath) return;

    const ext = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    let quality: number | undefined;

    switch (ext) {
      case 'jpg': case 'jpeg':
        mimeType = 'image/jpeg';
        quality = 0.92;
        break;
      case 'webp':
        mimeType = 'image/webp';
        quality = 0.92;
        break;
    }

    const dataUrl = quality !== undefined
      ? this.canvas.toDataURL(mimeType, quality)
      : this.canvas.toDataURL(mimeType);

    await window.electronAPI?.writeImageFile(filePath, dataUrl);
  }

  exportToBlob(mimeType: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        mimeType,
        quality,
      );
    });
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
        this.ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  // Accessors

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
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
    return this.selectionTool?.getSelectionImageData(this.ctx) ?? null;
  }

  clearSelection(): void {
    this.selectionTool?.clearSelection(this.ctx);
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
    const imageData = this.selectionTool.getSelectionImageData(this.ctx);
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
      this.selectionTool.clearSelection(this.ctx);
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
          this.selectionTool.setFloatingSelection(imageData, 0, 0, this.ctx);
        } else {
          this.ctx.putImageData(imageData, 0, 0);
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
        this.selectionTool.setFloatingSelection(imageData, 0, 0, this.ctx);
      } else {
        this.ctx.putImageData(imageData, 0, 0);
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
