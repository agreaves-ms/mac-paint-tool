import { type BrushEngine, type BrushEnginePreset } from '../tools/BrushEngine';

const STORAGE_KEY = 'mac-paint-brush-presets';

export class BrushPresetPanel {
  private container: HTMLElement;
  private engine: BrushEngine;
  private presets: BrushEnginePreset[] = [];
  private listEl!: HTMLElement;
  private previewCanvas!: HTMLCanvasElement;

  constructor(container: HTMLElement, engine: BrushEngine) {
    this.container = container;
    this.engine = engine;
    this.loadPresets();
    this.render();
  }

  private render(): void {
    const panel = document.createElement('div');
    panel.className = 'brush-preset-panel';

    const header = document.createElement('label');
    header.className = 'prop-label';
    header.textContent = 'Custom Brushes';
    panel.appendChild(header);

    // Preview
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 160;
    this.previewCanvas.height = 40;
    this.previewCanvas.className = 'brush-preview';
    panel.appendChild(this.previewCanvas);

    // Buttons
    const actions = document.createElement('div');
    actions.className = 'layer-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'layer-action-btn';
    saveBtn.textContent = '+';
    saveBtn.title = 'Save current as preset';
    saveBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.saveCurrentPreset();
    });
    actions.appendChild(saveBtn);
    panel.appendChild(actions);

    // Preset list
    this.listEl = document.createElement('div');
    this.listEl.className = 'layer-list';
    panel.appendChild(this.listEl);

    this.container.appendChild(panel);
    this.updateList();
    this.updatePreview();
  }

  private saveCurrentPreset(): void {
    const name = `Brush ${this.presets.length + 1}`;
    const preset = this.engine.getPreset(name);
    this.presets.push(preset);
    this.persistPresets();
    this.updateList();
  }

  deletePreset(index: number): void {
    this.presets.splice(index, 1);
    this.persistPresets();
    this.updateList();
  }

  private updateList(): void {
    this.listEl.innerHTML = '';
    this.presets.forEach((preset, index) => {
      const item = document.createElement('div');
      item.className = 'layer-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'layer-name';
      nameEl.textContent = preset.name;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'layer-action-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete preset';
      deleteBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deletePreset(index);
      });

      item.addEventListener('pointerdown', () => {
        this.engine.applyPreset(preset);
        this.updatePreview();
      });

      item.appendChild(nameEl);
      item.appendChild(deleteBtn);
      this.listEl.appendChild(item);
    });
  }

  private updatePreview(): void {
    const ctx = this.previewCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    this.engine.resetAccumulator();
    const y = this.previewCanvas.height / 2;
    for (let x = 20; x < this.previewCanvas.width - 20; x += 3) {
      this.engine.stamp(ctx, x, y, '#ffffff');
    }
  }

  private loadPresets(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.presets = JSON.parse(stored);
      } catch {
        this.presets = [];
      }
    }
  }

  private persistPresets(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
  }
}
