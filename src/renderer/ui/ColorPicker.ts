// --- HSL/Hex conversion utilities ---

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

const PALETTE_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0099ff', '#6633ff', '#cc33cc', '#ff3399',
];

export class ColorPicker {
  private fgColor = '#000000';
  private bgColor = '#ffffff';
  private hue = 0;
  private sat = 0;
  private lit = 0;
  private editingFg = true; // true = editing foreground, false = background
  private onChangeCallback: ((fg: string, bg: string) => void) | null = null;

  // DOM elements
  private fgSwatch!: HTMLDivElement;
  private bgSwatch!: HTMLDivElement;
  private hexInput!: HTMLInputElement;
  private hueCanvas!: HTMLCanvasElement;
  private slCanvas!: HTMLCanvasElement;
  private hueMarker!: HTMLDivElement;
  private slMarker!: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.render(container);
    this.syncFromHex(this.fgColor);
    this.drawHueStrip();
    this.drawSLArea();
    this.updateMarkers();
  }

  private render(container: HTMLElement): void {
    const section = document.createElement('div');
    section.className = 'cp-section';

    const header = document.createElement('div');
    header.className = 'prop-section-header';
    header.textContent = 'Colors';
    section.appendChild(header);

    // Swatches row
    const swatchRow = document.createElement('div');
    swatchRow.className = 'cp-swatch-row';

    this.fgSwatch = document.createElement('div');
    this.fgSwatch.className = 'cp-swatch cp-swatch-fg cp-swatch-active';
    this.fgSwatch.title = 'Foreground color (click to edit)';
    this.fgSwatch.style.background = this.fgColor;
    this.fgSwatch.addEventListener('click', () => this.selectSwatch(true));

    this.bgSwatch = document.createElement('div');
    this.bgSwatch.className = 'cp-swatch cp-swatch-bg';
    this.bgSwatch.title = 'Background color (click to edit)';
    this.bgSwatch.style.background = this.bgColor;
    this.bgSwatch.addEventListener('click', () => this.selectSwatch(false));

    const swapBtn = document.createElement('button');
    swapBtn.className = 'cp-swap-btn';
    swapBtn.title = 'Swap colors (X)';
    swapBtn.textContent = '⇄';
    swapBtn.addEventListener('click', () => this.swapColors());

    swatchRow.appendChild(this.fgSwatch);
    swatchRow.appendChild(this.bgSwatch);
    swatchRow.appendChild(swapBtn);
    section.appendChild(swatchRow);

    // Hex input
    const hexRow = document.createElement('div');
    hexRow.className = 'cp-hex-row';
    const hexLabel = document.createElement('span');
    hexLabel.className = 'cp-hex-label';
    hexLabel.textContent = '#';
    this.hexInput = document.createElement('input');
    this.hexInput.type = 'text';
    this.hexInput.className = 'cp-hex-input';
    this.hexInput.maxLength = 6;
    this.hexInput.value = this.fgColor.slice(1);
    this.hexInput.spellcheck = false;
    this.hexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.applyHexInput();
        this.hexInput.blur();
      }
    });
    this.hexInput.addEventListener('blur', () => this.applyHexInput());
    hexRow.appendChild(hexLabel);
    hexRow.appendChild(this.hexInput);
    section.appendChild(hexRow);

    // SL area (saturation-lightness 2D picker)
    const slContainer = document.createElement('div');
    slContainer.className = 'cp-sl-container';
    this.slCanvas = document.createElement('canvas');
    this.slCanvas.className = 'cp-sl-canvas';
    this.slCanvas.width = 170;
    this.slCanvas.height = 100;
    this.slMarker = document.createElement('div');
    this.slMarker.className = 'cp-sl-marker';
    slContainer.appendChild(this.slCanvas);
    slContainer.appendChild(this.slMarker);
    this.setupSLInteraction(slContainer);
    section.appendChild(slContainer);

    // Hue strip
    const hueContainer = document.createElement('div');
    hueContainer.className = 'cp-hue-container';
    this.hueCanvas = document.createElement('canvas');
    this.hueCanvas.className = 'cp-hue-canvas';
    this.hueCanvas.width = 170;
    this.hueCanvas.height = 12;
    this.hueMarker = document.createElement('div');
    this.hueMarker.className = 'cp-hue-marker';
    hueContainer.appendChild(this.hueCanvas);
    hueContainer.appendChild(this.hueMarker);
    this.setupHueInteraction(hueContainer);
    section.appendChild(hueContainer);

    // Color palette
    const palette = document.createElement('div');
    palette.className = 'cp-palette';
    for (const color of PALETTE_COLORS) {
      const cell = document.createElement('div');
      cell.className = 'cp-palette-cell';
      cell.style.background = color;
      cell.title = color;
      cell.addEventListener('click', () => {
        this.setActiveColor(color);
        this.fireChange();
      });
      palette.appendChild(cell);
    }
    section.appendChild(palette);

    container.insertBefore(section, container.firstChild);
  }

  private selectSwatch(fg: boolean): void {
    this.editingFg = fg;
    this.fgSwatch.classList.toggle('cp-swatch-active', fg);
    this.bgSwatch.classList.toggle('cp-swatch-active', !fg);
    const current = fg ? this.fgColor : this.bgColor;
    this.syncFromHex(current);
    this.hexInput.value = current.slice(1);
    this.drawSLArea();
    this.updateMarkers();
  }

  private applyHexInput(): void {
    const raw = this.hexInput.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (raw.length === 6) {
      const hex = '#' + raw.toLowerCase();
      this.setActiveColor(hex);
      this.fireChange();
    } else {
      // Reset to current color
      const current = this.editingFg ? this.fgColor : this.bgColor;
      this.hexInput.value = current.slice(1);
    }
  }

  private setActiveColor(hex: string): void {
    if (this.editingFg) {
      this.fgColor = hex;
      this.fgSwatch.style.background = hex;
    } else {
      this.bgColor = hex;
      this.bgSwatch.style.background = hex;
    }
    this.syncFromHex(hex);
    this.hexInput.value = hex.slice(1);
    this.drawSLArea();
    this.updateMarkers();
  }

  private syncFromHex(hex: string): void {
    const [r, g, b] = hexToRgb(hex);
    [this.hue, this.sat, this.lit] = rgbToHsl(r, g, b);
  }

  private fireChange(): void {
    this.onChangeCallback?.(this.fgColor, this.bgColor);
  }

  // --- Hue strip ---

  private drawHueStrip(): void {
    const ctx = this.hueCanvas.getContext('2d')!;
    const w = this.hueCanvas.width;
    const h = this.hueCanvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 6; i++) {
      const [r, g, b] = hslToRgb(i * 60, 100, 50);
      grad.addColorStop(i / 6, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private setupHueInteraction(container: HTMLElement): void {
    const pick = (e: PointerEvent) => {
      const rect = this.hueCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      this.hue = Math.round((x / rect.width) * 360);
      this.drawSLArea();
      this.updateColorFromHSL();
      this.updateMarkers();
    };
    container.addEventListener('pointerdown', (e) => {
      pick(e);
      const move = (ev: PointerEvent) => pick(ev);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  // --- Saturation/Lightness area ---

  private drawSLArea(): void {
    const ctx = this.slCanvas.getContext('2d', { willReadFrequently: true })!;
    const w = this.slCanvas.width;
    const h = this.slCanvas.height;
    const imageData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / (w - 1)) * 100;
        const l = 100 - (y / (h - 1)) * 100;
        const [r, g, b] = hslToRgb(this.hue, s, l);
        const idx = (y * w + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private setupSLInteraction(container: HTMLElement): void {
    const pick = (e: PointerEvent) => {
      const rect = this.slCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      this.sat = Math.round((x / rect.width) * 100);
      this.lit = Math.round(100 - (y / rect.height) * 100);
      this.updateColorFromHSL();
      this.updateMarkers();
    };
    container.addEventListener('pointerdown', (e) => {
      pick(e);
      const move = (ev: PointerEvent) => pick(ev);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  private updateColorFromHSL(): void {
    const [r, g, b] = hslToRgb(this.hue, this.sat, this.lit);
    const hex = rgbToHex(r, g, b);
    if (this.editingFg) {
      this.fgColor = hex;
      this.fgSwatch.style.background = hex;
    } else {
      this.bgColor = hex;
      this.bgSwatch.style.background = hex;
    }
    this.hexInput.value = hex.slice(1);
    this.fireChange();
  }

  private updateMarkers(): void {
    // Hue marker
    const huePct = this.hue / 360;
    this.hueMarker.style.left = `${huePct * 100}%`;

    // SL marker
    const sPct = this.sat / 100;
    const lPct = 1 - this.lit / 100;
    this.slMarker.style.left = `${sPct * 100}%`;
    this.slMarker.style.top = `${lPct * 100}%`;
  }

  // --- Public API (unchanged) ---

  onChange(callback: (fg: string, bg: string) => void): void {
    this.onChangeCallback = callback;
  }

  getForegroundColor(): string {
    return this.fgColor;
  }

  getBackgroundColor(): string {
    return this.bgColor;
  }

  setForegroundColor(color: string): void {
    this.fgColor = color;
    this.fgSwatch.style.background = color;
    if (this.editingFg) {
      this.syncFromHex(color);
      this.hexInput.value = color.slice(1);
      this.drawSLArea();
      this.updateMarkers();
    }
  }

  setBackgroundColor(color: string): void {
    this.bgColor = color;
    this.bgSwatch.style.background = color;
    if (!this.editingFg) {
      this.syncFromHex(color);
      this.hexInput.value = color.slice(1);
      this.drawSLArea();
      this.updateMarkers();
    }
  }

  swapColors(): void {
    const temp = this.fgColor;
    this.setForegroundColor(this.bgColor);
    this.setBackgroundColor(temp);
    this.onChangeCallback?.(this.fgColor, this.bgColor);
  }
}
