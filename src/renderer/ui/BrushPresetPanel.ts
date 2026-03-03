import { type BrushTool, type BrushPreset } from '../tools/BrushTool';

const STORAGE_KEY = 'mac-paint-brush-presets';

export class BrushPresetPanel {
  private container: HTMLElement;
  private brushTool: BrushTool;
  private presets: BrushPreset[] = [];
  private listEl!: HTMLElement;
  private previewCanvas!: HTMLCanvasElement;
  private panelEl!: HTMLElement;
  private onPresetApplied: ((preset: BrushPreset) => void) | null = null;

  constructor(container: HTMLElement, brushTool: BrushTool) {
    this.container = container;
    this.brushTool = brushTool;
    this.loadPresets();
    this.render();
  }

  onPresetApply(callback: (preset: BrushPreset) => void): void {
    this.onPresetApplied = callback;
  }

  private render(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'brush-preset-panel';

    const header = document.createElement('label');
    header.className = 'prop-label';
    header.textContent = 'Custom Brushes';
    this.panelEl.appendChild(header);

    // Preview
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 160;
    this.previewCanvas.height = 40;
    this.previewCanvas.className = 'brush-preview';
    this.panelEl.appendChild(this.previewCanvas);

    // Buttons
    const actions = document.createElement('div');
    actions.className = 'brush-preset-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'layer-action-btn';
    saveBtn.textContent = '+';
    saveBtn.title = 'Save current as preset';
    saveBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.saveCurrentPreset();
    });
    actions.appendChild(saveBtn);
    this.panelEl.appendChild(actions);

    // Preset list
    this.listEl = document.createElement('div');
    this.listEl.className = 'brush-preset-list';
    this.panelEl.appendChild(this.listEl);

    this.container.appendChild(this.panelEl);
    this.updateList();
    this.updatePreview();
  }

  private saveCurrentPreset(): void {
    const name = `Brush ${this.presets.length + 1}`;
    const preset = this.brushTool.getPreset(name);
    this.presets.push(preset);
    this.persistPresets();
    this.updateList();
    this.updatePreview();
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
      item.className = 'brush-preset-item';

      const nameEl = document.createElement('span');
      nameEl.className = 'brush-preset-name';
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
        this.brushTool.applyPreset(preset);
        this.onPresetApplied?.(preset);
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

    // Draw preview stripe using brush tool parameters
    const y = this.previewCanvas.height / 2;
    const radius = Math.min(this.brushTool.lineWidth, 16) / 2;
    const spacing = Math.max(1, radius * 2 * this.brushTool.spacing);
    const hardness = this.brushTool.hardness;
    ctx.globalAlpha = this.brushTool.opacity / 100;

    for (let x = 20; x < this.previewCanvas.width - 20; x += spacing) {
      if (hardness < 100) {
        const hardnessRatio = hardness / 100;
        const gradient = ctx.createRadialGradient(x, y, radius * hardnessRatio, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

  show(): void {
    this.panelEl.style.display = '';
    this.updatePreview();
  }

  hide(): void {
    this.panelEl.style.display = 'none';
  }
}
