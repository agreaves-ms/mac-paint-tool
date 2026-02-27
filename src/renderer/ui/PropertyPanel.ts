import type { ShapeMode } from '../tools/ShapeTool';

type ToolName = string;

const STROKE_TOOLS = ['brush', 'eraser', 'line', 'rectangle', 'ellipse'];
const SHAPE_TOOLS = ['line', 'rectangle', 'ellipse'];

export interface PropertyCallbacks {
  onLineSizeChange?: (size: number) => void;
  onToleranceChange?: (tolerance: number) => void;
  onGradianceChange?: (gradiance: number) => void;
  onShapeModeChange?: (mode: ShapeMode) => void;
  onCursorChange?: (cursorCSS: string) => void;
}

export class PropertyPanel {
  private container: HTMLElement;
  private callbacks: PropertyCallbacks = {};
  private activeTool: ToolName = 'brush';

  // Controls
  private lineSizeSection!: HTMLElement;
  private lineSizeSlider!: HTMLInputElement;
  private lineSizeValue!: HTMLSpanElement;

  private toleranceSection!: HTMLElement;
  private toleranceSlider!: HTMLInputElement;
  private toleranceValue!: HTMLSpanElement;

  private gradianceSection!: HTMLElement;
  private gradianceSlider!: HTMLInputElement;
  private gradianceValue!: HTMLSpanElement;

  private shapeModeSection!: HTMLElement;

  // Current values
  private lineSize = 2;
  private tolerance = 0;
  private gradiance = 32;
  private shapeMode: ShapeMode = 'stroke';

  constructor(container: HTMLElement, callbacks?: PropertyCallbacks) {
    this.container = container;
    if (callbacks) this.callbacks = callbacks;
    this.render();
  }

  private render(): void {
    // Line size section
    this.lineSizeSection = this.createSection('Size');
    this.lineSizeSlider = this.createSlider('line-size', 1, 100, this.lineSize);
    this.lineSizeValue = this.createValueDisplay(this.lineSize);
    const lineSizeRow = this.createSliderRow(this.lineSizeSlider, this.lineSizeValue);
    this.lineSizeSection.appendChild(lineSizeRow);
    this.lineSizeSlider.addEventListener('input', () => {
      this.lineSize = parseInt(this.lineSizeSlider.value, 10);
      this.lineSizeValue.textContent = String(this.lineSize);
      this.callbacks.onLineSizeChange?.(this.lineSize);
      this.updateCursorPreview();
    });
    this.container.appendChild(this.lineSizeSection);

    // Tolerance section
    this.toleranceSection = this.createSection('Tolerance');
    this.toleranceSlider = this.createSlider('tolerance', 0, 255, this.tolerance);
    this.toleranceValue = this.createValueDisplay(this.tolerance);
    const toleranceRow = this.createSliderRow(this.toleranceSlider, this.toleranceValue);
    this.toleranceSection.appendChild(toleranceRow);
    this.toleranceSlider.addEventListener('input', () => {
      this.tolerance = parseInt(this.toleranceSlider.value, 10);
      this.toleranceValue.textContent = String(this.tolerance);
      this.callbacks.onToleranceChange?.(this.tolerance);
    });
    this.container.appendChild(this.toleranceSection);

    // Gradiance section
    this.gradianceSection = this.createSection('Gradiance');
    this.gradianceSlider = this.createSlider('gradiance', 0, 255, this.gradiance);
    this.gradianceValue = this.createValueDisplay(this.gradiance);
    const gradianceRow = this.createSliderRow(this.gradianceSlider, this.gradianceValue);
    this.gradianceSection.appendChild(gradianceRow);
    this.gradianceSlider.addEventListener('input', () => {
      this.gradiance = parseInt(this.gradianceSlider.value, 10);
      this.gradianceValue.textContent = String(this.gradiance);
      this.callbacks.onGradianceChange?.(this.gradiance);
    });
    this.container.appendChild(this.gradianceSection);

    // Shape mode section
    this.shapeModeSection = this.createSection('Shape Mode');
    const modeGroup = document.createElement('div');
    modeGroup.className = 'prop-mode-group';
    const modes: { label: string; value: ShapeMode }[] = [
      { label: 'Stroke', value: 'stroke' },
      { label: 'Fill', value: 'fill' },
      { label: 'Both', value: 'strokeAndFill' },
    ];
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.className = 'prop-mode-btn';
      btn.textContent = mode.label;
      btn.dataset.mode = mode.value;
      if (mode.value === this.shapeMode) btn.classList.add('active');
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.shapeMode = mode.value;
        modeGroup.querySelectorAll('.prop-mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onShapeModeChange?.(this.shapeMode);
      });
      modeGroup.appendChild(btn);
    }
    this.shapeModeSection.appendChild(modeGroup);
    this.container.appendChild(this.shapeModeSection);

    this.updateVisibility();
  }

  private createSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'prop-section';
    const label = document.createElement('label');
    label.className = 'prop-label';
    label.textContent = title;
    section.appendChild(label);
    return section;
  }

  private createSlider(id: string, min: number, max: number, value: number): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.className = 'prop-slider';
    return slider;
  }

  private createValueDisplay(value: number): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'prop-value';
    span.textContent = String(value);
    return span;
  }

  private createSliderRow(slider: HTMLInputElement, valueDisplay: HTMLSpanElement): HTMLElement {
    const row = document.createElement('div');
    row.className = 'prop-slider-row';
    row.appendChild(slider);
    row.appendChild(valueDisplay);
    return row;
  }

  updateForTool(toolName: ToolName): void {
    this.activeTool = toolName;
    this.updateVisibility();
    this.updateCursorPreview();
  }

  private updateVisibility(): void {
    this.lineSizeSection.style.display = STROKE_TOOLS.includes(this.activeTool) ? '' : 'none';
    this.toleranceSection.style.display = this.activeTool === 'fill' ? '' : 'none';
    this.gradianceSection.style.display = this.activeTool === 'selection' ? '' : 'none';
    this.shapeModeSection.style.display = SHAPE_TOOLS.includes(this.activeTool) ? '' : 'none';
  }

  private updateCursorPreview(): void {
    if (this.activeTool !== 'brush' && this.activeTool !== 'eraser') return;

    const diameter = this.lineSize;
    const size = diameter + 2;
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = size;
    cursorCanvas.height = size;
    const cctx = cursorCanvas.getContext('2d')!;
    cctx.strokeStyle = '#888';
    cctx.lineWidth = 1;
    cctx.beginPath();
    cctx.arc(size / 2, size / 2, diameter / 2, 0, Math.PI * 2);
    cctx.stroke();

    const hotspot = Math.floor(size / 2);
    const cursor = `url(${cursorCanvas.toDataURL()}) ${hotspot} ${hotspot}, crosshair`;
    this.callbacks.onCursorChange?.(cursor);
  }

  getLineSize(): number {
    return this.lineSize;
  }

  getTolerance(): number {
    return this.tolerance;
  }

  getGradiance(): number {
    return this.gradiance;
  }

  getShapeMode(): ShapeMode {
    return this.shapeMode;
  }

  setLineSize(value: number): void {
    this.lineSize = value;
    this.lineSizeSlider.value = String(value);
    this.lineSizeValue.textContent = String(value);
    this.callbacks.onLineSizeChange?.(value);
    this.updateCursorPreview();
  }
}
