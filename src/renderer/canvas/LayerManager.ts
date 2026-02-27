export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  opacity: number;
}

export class LayerManager {
  private layers: Layer[] = [];
  private activeLayerId = '';
  private layerStack: HTMLElement;
  private nextId = 0;
  private width: number;
  private height: number;
  private eventCanvas: HTMLCanvasElement;
  private onChangeCallback: (() => void) | null = null;

  constructor(container: HTMLElement, eventCanvas: HTMLCanvasElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.eventCanvas = eventCanvas;

    // Create layer stack wrapper
    this.layerStack = document.createElement('div');
    this.layerStack.className = 'layer-stack';
    this.layerStack.style.position = 'relative';
    this.layerStack.style.width = `${width}px`;
    this.layerStack.style.height = `${height}px`;

    // Insert wrapper into container and move event canvas into it
    container.appendChild(this.layerStack);
    eventCanvas.style.position = 'absolute';
    eventCanvas.style.left = '0';
    eventCanvas.style.top = '0';
    eventCanvas.style.zIndex = '9999';
    this.layerStack.appendChild(eventCanvas);

    // Create background layer with content from the event canvas
    const bgLayer = this.addLayer('Background');
    bgLayer.ctx.drawImage(eventCanvas, 0, 0);

    // Clear the event canvas — it becomes a transparent event-capture surface
    const eventCtx = eventCanvas.getContext('2d', { willReadFrequently: true })!;
    eventCtx.clearRect(0, 0, width, height);
    eventCanvas.style.background = 'transparent';
  }

  addLayer(name?: string): Layer {
    const id = `layer-${this.nextId++}`;
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.className = 'layer-canvas';
    canvas.dataset.layerId = id;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.imageRendering = 'pixelated';

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const layer: Layer = {
      id,
      name: name ?? `Layer ${this.layers.length + 1}`,
      canvas,
      ctx,
      visible: true,
      opacity: 1.0,
    };

    this.layers.push(layer);
    this.updateZIndices();

    // Insert before the event canvas so the event canvas stays on top
    this.layerStack.insertBefore(canvas, this.eventCanvas);

    if (!this.activeLayerId) {
      this.activeLayerId = id;
    }

    this.onChangeCallback?.();
    return layer;
  }

  removeLayer(id: string): void {
    if (this.layers.length <= 1) return;
    const index = this.layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const layer = this.layers[index];
    layer.canvas.remove();
    this.layers.splice(index, 1);

    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[Math.min(index, this.layers.length - 1)].id;
    }

    this.updateZIndices();
    this.onChangeCallback?.();
  }

  moveLayer(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.layers.length) return;
    if (toIndex < 0 || toIndex >= this.layers.length) return;
    if (fromIndex === toIndex) return;

    const [layer] = this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, layer);
    this.updateZIndices();

    // Re-order DOM to match
    for (const l of this.layers) {
      this.layerStack.insertBefore(l.canvas, this.eventCanvas);
    }

    this.onChangeCallback?.();
  }

  setActiveLayer(id: string): void {
    if (this.layers.some((l) => l.id === id)) {
      this.activeLayerId = id;
      this.onChangeCallback?.();
    }
  }

  getActiveLayer(): Layer | null {
    return this.layers.find((l) => l.id === this.activeLayerId) ?? null;
  }

  getActiveContext(): CanvasRenderingContext2D | null {
    return this.getActiveLayer()?.ctx ?? null;
  }

  getActiveLayerId(): string {
    return this.activeLayerId;
  }

  getLayers(): readonly Layer[] {
    return this.layers;
  }

  getLayerStack(): HTMLElement {
    return this.layerStack;
  }

  toggleVisibility(id: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      layer.canvas.style.display = layer.visible ? '' : 'none';
      this.onChangeCallback?.();
    }
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      layer.canvas.style.opacity = String(layer.opacity);
      this.onChangeCallback?.();
    }
  }

  renameLayer(id: string, name: string): void {
    const layer = this.layers.find((l) => l.id === id);
    if (layer) {
      layer.name = name;
      this.onChangeCallback?.();
    }
  }

  flattenAll(): void {
    if (this.layers.length <= 1) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    for (const layer of this.layers) {
      if (!layer.visible) continue;
      tempCtx.globalAlpha = layer.opacity;
      tempCtx.drawImage(layer.canvas, 0, 0);
    }
    tempCtx.globalAlpha = 1;

    // Remove all layers except the first
    while (this.layers.length > 1) {
      const last = this.layers[this.layers.length - 1];
      last.canvas.remove();
      this.layers.pop();
    }

    // Put flattened content on the remaining layer
    const base = this.layers[0];
    base.ctx.clearRect(0, 0, this.width, this.height);
    base.ctx.drawImage(tempCanvas, 0, 0);
    base.name = 'Background';
    base.visible = true;
    base.opacity = 1;
    base.canvas.style.display = '';
    base.canvas.style.opacity = '1';
    this.activeLayerId = base.id;
    this.onChangeCallback?.();
  }

  mergeDown(): void {
    const activeIndex = this.layers.findIndex((l) => l.id === this.activeLayerId);
    if (activeIndex <= 0) return;

    const activeLayer = this.layers[activeIndex];
    const belowLayer = this.layers[activeIndex - 1];

    belowLayer.ctx.globalAlpha = activeLayer.opacity;
    belowLayer.ctx.drawImage(activeLayer.canvas, 0, 0);
    belowLayer.ctx.globalAlpha = 1;

    activeLayer.canvas.remove();
    this.layers.splice(activeIndex, 1);
    this.activeLayerId = belowLayer.id;
    this.updateZIndices();
    this.onChangeCallback?.();
  }

  getExportCanvas(): HTMLCanvasElement {
    const temp = document.createElement('canvas');
    temp.width = this.width;
    temp.height = this.height;
    const ctx = temp.getContext('2d')!;

    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    return temp;
  }

  reset(width: number, height: number, bgColor?: string): void {
    for (const layer of this.layers) {
      layer.canvas.remove();
    }
    this.layers = [];
    this.nextId = 0;
    this.width = width;
    this.height = height;
    this.layerStack.style.width = `${width}px`;
    this.layerStack.style.height = `${height}px`;

    this.eventCanvas.width = width;
    this.eventCanvas.height = height;

    const bg = this.addLayer('Background');
    if (bgColor) {
      bg.ctx.fillStyle = bgColor;
      bg.ctx.fillRect(0, 0, width, height);
    }
  }

  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  private updateZIndices(): void {
    this.layers.forEach((layer, index) => {
      layer.canvas.style.zIndex = String(index);
    });
  }
}
