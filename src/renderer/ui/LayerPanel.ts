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

    // Main row: eye, thumbnail, name
    const mainRow = document.createElement('div');
    mainRow.className = 'layer-item-row';

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
    thumbCtx.globalAlpha = layer.opacity;
    thumbCtx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, 30, 22);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'layer-name';
    nameEl.textContent = layer.name;

    mainRow.appendChild(eyeBtn);
    mainRow.appendChild(thumb);
    mainRow.appendChild(nameEl);
    item.appendChild(mainRow);

    // Controls row: blend mode + opacity
    const controlsRow = document.createElement('div');
    controlsRow.className = 'layer-controls-row';

    // Blend mode dropdown
    const blendSelect = document.createElement('select');
    blendSelect.className = 'layer-blend-select';
    const blendModes: { label: string; value: GlobalCompositeOperation }[] = [
      { label: 'Normal', value: 'source-over' },
      { label: 'Multiply', value: 'multiply' },
      { label: 'Screen', value: 'screen' },
      { label: 'Overlay', value: 'overlay' },
      { label: 'Darken', value: 'darken' },
      { label: 'Lighten', value: 'lighten' },
    ];
    for (const bm of blendModes) {
      const opt = document.createElement('option');
      opt.value = bm.value;
      opt.textContent = bm.label;
      if (bm.value === layer.blendMode) opt.selected = true;
      blendSelect.appendChild(opt);
    }
    blendSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      this.layerManager.setBlendMode(layer.id, blendSelect.value as GlobalCompositeOperation);
    });
    blendSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
    controlsRow.appendChild(blendSelect);

    // Opacity slider
    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.className = 'layer-opacity-slider';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = String(Math.round(layer.opacity * 100));
    opacitySlider.title = `Opacity: ${Math.round(layer.opacity * 100)}%`;
    opacitySlider.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = parseInt(opacitySlider.value, 10);
      opacitySlider.title = `Opacity: ${val}%`;
      this.layerManager.setLayerOpacity(layer.id, val / 100);
    });
    opacitySlider.addEventListener('pointerdown', (e) => e.stopPropagation());
    controlsRow.appendChild(opacitySlider);

    item.appendChild(controlsRow);

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
