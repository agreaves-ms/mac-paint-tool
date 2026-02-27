export class ColorPicker {
  private fgColor = '#000000';
  private bgColor = '#ffffff';
  private fgInput!: HTMLInputElement;
  private bgInput!: HTMLInputElement;
  private onChangeCallback: ((fg: string, bg: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.render(container);
  }

  private render(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-picker';

    // Background color square (behind)
    const bgSwatch = document.createElement('div');
    bgSwatch.className = 'color-swatch color-swatch-bg';

    this.bgInput = document.createElement('input');
    this.bgInput.type = 'color';
    this.bgInput.id = 'bg-color';
    this.bgInput.value = this.bgColor;
    this.bgInput.title = 'Background color';
    this.bgInput.addEventListener('input', () => {
      this.bgColor = this.bgInput.value;
      this.onChangeCallback?.(this.fgColor, this.bgColor);
    });
    bgSwatch.appendChild(this.bgInput);

    // Foreground color square (on top)
    const fgSwatch = document.createElement('div');
    fgSwatch.className = 'color-swatch color-swatch-fg';

    this.fgInput = document.createElement('input');
    this.fgInput.type = 'color';
    this.fgInput.id = 'fg-color';
    this.fgInput.value = this.fgColor;
    this.fgInput.title = 'Foreground color';
    this.fgInput.addEventListener('input', () => {
      this.fgColor = this.fgInput.value;
      this.onChangeCallback?.(this.fgColor, this.bgColor);
    });
    fgSwatch.appendChild(this.fgInput);

    wrapper.appendChild(bgSwatch);
    wrapper.appendChild(fgSwatch);
    container.appendChild(wrapper);
  }

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
    this.fgInput.value = color;
  }

  setBackgroundColor(color: string): void {
    this.bgColor = color;
    this.bgInput.value = color;
  }

  swapColors(): void {
    const temp = this.fgColor;
    this.setForegroundColor(this.bgColor);
    this.setBackgroundColor(temp);
    this.onChangeCallback?.(this.fgColor, this.bgColor);
  }
}
