import type { LayerManager, Layer } from '../canvas/LayerManager';

export class LayerPanel {
  private container: HTMLElement;
  private layerManager: LayerManager;
  private listEl!: HTMLElement;
  private panelEl!: HTMLElement;

  constructor(container: HTMLElement, layerManager: LayerManager) {
    this.container = container;
    this.layerManager = layerManager;
    this.render();

    layerManager.onChange(() => this.updateList());
  }

  private render(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'layer-panel';

    // Header
    const header = document.createElement('label');
    header.className = 'prop-label';
    header.textContent = 'Layers';
    this.panelEl.appendChild(header);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'layer-actions';

    const addBtn = this.createActionBtn('+', 'Add layer', () => {
      this.layerManager.addLayer();
    });
    const removeBtn = this.createActionBtn('−', 'Remove layer', () => {
      this.layerManager.removeLayer(this.layerManager.getActiveLayerId());
    });
    const flattenBtn = this.createActionBtn('⊟', 'Flatten all', () => {
      this.layerManager.flattenAll();
    });
    const mergeBtn = this.createActionBtn('↓', 'Merge down', () => {
      this.layerManager.mergeDown();
    });

    actions.appendChild(addBtn);
    actions.appendChild(removeBtn);
    actions.appendChild(flattenBtn);
    actions.appendChild(mergeBtn);
    this.panelEl.appendChild(actions);

    // Layer list
    this.listEl = document.createElement('div');
    this.listEl.className = 'layer-list';
    this.panelEl.appendChild(this.listEl);

    this.container.appendChild(this.panelEl);
    this.updateList();
  }

  private createActionBtn(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'layer-action-btn';
    btn.textContent = icon;
    btn.title = title;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onClick();
    });
    return btn;
  }

  updateList(): void {
    this.listEl.innerHTML = '';
    const layers = this.layerManager.getLayers();
    const activeId = this.layerManager.getActiveLayerId();

    // Display top-to-bottom (last layer = topmost)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const item = this.createLayerItem(layer, layer.id === activeId, i);
      this.listEl.appendChild(item);
    }
  }

  private createLayerItem(layer: Layer, isActive: boolean, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'layer-item' + (isActive ? ' active' : '');
    item.draggable = true;
    item.dataset.index = String(index);

    // Visibility toggle
    const eyeBtn = document.createElement('button');
    eyeBtn.className = 'layer-eye-btn';
    eyeBtn.textContent = layer.visible ? '👁' : '⊘';
    eyeBtn.title = layer.visible ? 'Hide layer' : 'Show layer';
    eyeBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.layerManager.toggleVisibility(layer.id);
    });

    // Thumbnail
    const thumb = document.createElement('canvas');
    thumb.className = 'layer-thumb';
    thumb.width = 30;
    thumb.height = 22;
    const thumbCtx = thumb.getContext('2d')!;
    thumbCtx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, 30, 22);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = layer.name;

    item.appendChild(eyeBtn);
    item.appendChild(thumb);
    item.appendChild(nameEl);

    // Click to select
    item.addEventListener('pointerdown', () => {
      this.layerManager.setActiveLayer(layer.id);
    });

    // Drag events for reorder
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', String(index));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') ?? '', 10);
      if (!isNaN(fromIndex) && fromIndex !== index) {
        this.layerManager.moveLayer(fromIndex, index);
      }
    });

    return item;
  }
}
