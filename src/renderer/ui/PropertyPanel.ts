import type { ShapeMode } from '../tools/ShapeTool';

type ToolName = string;

const STROKE_TOOLS = ['brush', 'eraser', 'line', 'rectangle', 'ellipse', 'roundedRect', 'polygon', 'curve'];
const SHAPE_TOOLS = ['line', 'rectangle', 'ellipse', 'roundedRect', 'polygon'];
const TEXT_TOOLS = ['text'];
const CORNER_RADIUS_TOOLS = ['roundedRect'];
const CURVE_TOOLS = ['curve'];

export interface PropertyCallbacks {
  onLineSizeChange?: (size: number) => void;
  onToleranceChange?: (tolerance: number) => void;
  onGradianceChange?: (gradiance: number) => void;
  onShapeModeChange?: (mode: ShapeMode) => void;
  onCursorChange?: (cursorCSS: string) => void;
  onFontFamilyChange?: (family: string) => void;
  onFontSizeChange?: (size: number) => void;
  onBoldChange?: (bold: boolean) => void;
  onItalicChange?: (italic: boolean) => void;
  onCornerRadiusChange?: (radius: number) => void;
  onCurveTypeChange?: (type: 'quadratic' | 'cubic') => void;
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

  // Text controls
  private textSection!: HTMLElement;
  private fontFamilySelect!: HTMLSelectElement;
  private fontSizeInput!: HTMLInputElement;
  private boldBtn!: HTMLButtonElement;
  private italicBtn!: HTMLButtonElement;

  // Corner radius controls
  private cornerRadiusSection!: HTMLElement;
  private cornerRadiusSlider!: HTMLInputElement;
  private cornerRadiusValue!: HTMLSpanElement;

  // Curve type controls
  private curveTypeSection!: HTMLElement;

  // Current values
  private lineSize = 2;
  private tolerance = 0;
  private gradiance = 32;
  private shapeMode: ShapeMode = 'stroke';
  private fontFamily = 'Arial';
  private fontSize = 16;
  private bold = false;
  private italic = false;
  private cornerRadius = 10;
  private curveType: 'quadratic' | 'cubic' = 'quadratic';

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

    // Text section
    this.textSection = this.createSection('Text');

    // Font family dropdown
    const fontFamilyRow = document.createElement('div');
    fontFamilyRow.className = 'prop-slider-row';
    this.fontFamilySelect = document.createElement('select');
    this.fontFamilySelect.className = 'prop-select';
    const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];
    for (const f of fonts) {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      if (f === this.fontFamily) opt.selected = true;
      this.fontFamilySelect.appendChild(opt);
    }
    this.fontFamilySelect.addEventListener('change', () => {
      this.fontFamily = this.fontFamilySelect.value;
      this.callbacks.onFontFamilyChange?.(this.fontFamily);
    });
    fontFamilyRow.appendChild(this.fontFamilySelect);
    this.textSection.appendChild(fontFamilyRow);

    // Font size input
    const fontSizeRow = document.createElement('div');
    fontSizeRow.className = 'prop-slider-row';
    const fontSizeLabel = document.createElement('span');
    fontSizeLabel.className = 'prop-value';
    fontSizeLabel.textContent = 'Size';
    this.fontSizeInput = document.createElement('input');
    this.fontSizeInput.type = 'number';
    this.fontSizeInput.className = 'prop-number';
    this.fontSizeInput.min = '8';
    this.fontSizeInput.max = '200';
    this.fontSizeInput.value = String(this.fontSize);
    this.fontSizeInput.addEventListener('input', () => {
      this.fontSize = parseInt(this.fontSizeInput.value, 10) || 16;
      this.callbacks.onFontSizeChange?.(this.fontSize);
    });
    fontSizeRow.appendChild(fontSizeLabel);
    fontSizeRow.appendChild(this.fontSizeInput);
    this.textSection.appendChild(fontSizeRow);

    // Bold / Italic toggles
    const styleRow = document.createElement('div');
    styleRow.className = 'prop-mode-group';
    this.boldBtn = document.createElement('button');
    this.boldBtn.className = 'prop-mode-btn';
    this.boldBtn.textContent = 'B';
    this.boldBtn.style.fontWeight = 'bold';
    this.boldBtn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      this.bold = !this.bold;
      this.boldBtn.classList.toggle('active', this.bold);
      this.callbacks.onBoldChange?.(this.bold);
    });
    this.italicBtn = document.createElement('button');
    this.italicBtn.className = 'prop-mode-btn';
    this.italicBtn.textContent = 'I';
    this.italicBtn.style.fontStyle = 'italic';
    this.italicBtn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      this.italic = !this.italic;
      this.italicBtn.classList.toggle('active', this.italic);
      this.callbacks.onItalicChange?.(this.italic);
    });
    styleRow.appendChild(this.boldBtn);
    styleRow.appendChild(this.italicBtn);
    this.textSection.appendChild(styleRow);

    this.container.appendChild(this.textSection);

    // Corner radius section
    this.cornerRadiusSection = this.createSection('Corner Radius');
    this.cornerRadiusSlider = this.createSlider('corner-radius', 0, 50, this.cornerRadius);
    this.cornerRadiusValue = this.createValueDisplay(this.cornerRadius);
    const cornerRadiusRow = this.createSliderRow(this.cornerRadiusSlider, this.cornerRadiusValue);
    this.cornerRadiusSection.appendChild(cornerRadiusRow);
    this.cornerRadiusSlider.addEventListener('input', () => {
      this.cornerRadius = parseInt(this.cornerRadiusSlider.value, 10);
      this.cornerRadiusValue.textContent = String(this.cornerRadius);
      this.callbacks.onCornerRadiusChange?.(this.cornerRadius);
    });
    this.container.appendChild(this.cornerRadiusSection);

    // Curve type section
    this.curveTypeSection = this.createSection('Curve Type');
    const curveGroup = document.createElement('div');
    curveGroup.className = 'prop-mode-group';
    const curveTypes: { label: string; value: 'quadratic' | 'cubic' }[] = [
      { label: 'Quadratic', value: 'quadratic' },
      { label: 'Cubic', value: 'cubic' },
    ];
    for (const ct of curveTypes) {
      const btn = document.createElement('button');
      btn.className = 'prop-mode-btn';
      btn.textContent = ct.label;
      btn.dataset.curveType = ct.value;
      if (ct.value === this.curveType) btn.classList.add('active');
      btn.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        this.curveType = ct.value;
        curveGroup.querySelectorAll('.prop-mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onCurveTypeChange?.(this.curveType);
      });
      curveGroup.appendChild(btn);
    }
    this.curveTypeSection.appendChild(curveGroup);
    this.container.appendChild(this.curveTypeSection);

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
    this.textSection.style.display = TEXT_TOOLS.includes(this.activeTool) ? '' : 'none';
    this.cornerRadiusSection.style.display = CORNER_RADIUS_TOOLS.includes(this.activeTool) ? '' : 'none';
    this.curveTypeSection.style.display = CURVE_TOOLS.includes(this.activeTool) ? '' : 'none';
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
