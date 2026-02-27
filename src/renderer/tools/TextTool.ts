import type { Tool } from './Tool';

export class TextTool implements Tool {
  name = 'text';
  cursor = 'text';
  lineWidth = 1;

  fontFamily = 'Arial';
  fontSize = 16;
  bold = false;
  italic = false;
  color = '#000000';

  private textOverlay: HTMLDivElement | null = null;
  private insertX = 0;
  private insertY = 0;
  private activeCtx: CanvasRenderingContext2D | null = null;

  onActivate(): void {
    // No setup needed
  }

  onDeactivate(): void {
    this.commitText();
    this.removeOverlay();
  }

  onPointerDown(e: PointerEvent, ctx: CanvasRenderingContext2D): void {
    // Commit existing text before starting a new one
    if (this.textOverlay) {
      this.commitText();
      this.removeOverlay();
    }

    const { x, y } = this.getCanvasCoords(e, ctx.canvas);
    this.insertX = x;
    this.insertY = y;
    this.activeCtx = ctx;
    this.createTextOverlay(ctx.canvas, x, y);
  }

  onPointerMove(): void {
    // No action on move
  }

  onPointerUp(): void {
    // No action on up
  }

  private createTextOverlay(canvas: HTMLCanvasElement, x: number, y: number): void {
    const container = canvas.parentElement;
    if (!container) return;

    const overlay = document.createElement('div');
    overlay.className = 'text-tool-overlay';
    overlay.contentEditable = 'true';
    overlay.style.position = 'absolute';
    overlay.style.left = `${canvas.offsetLeft + x}px`;
    overlay.style.top = `${canvas.offsetTop + y}px`;
    overlay.style.minWidth = '20px';
    overlay.style.minHeight = `${this.fontSize + 4}px`;
    overlay.style.font = this.getFontString();
    overlay.style.color = this.color;
    overlay.style.outline = '1px dashed #0078d4';
    overlay.style.padding = '2px';
    overlay.style.background = 'transparent';
    overlay.style.whiteSpace = 'pre';
    overlay.style.zIndex = '10';
    overlay.style.cursor = 'text';

    overlay.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.commitText();
        this.removeOverlay();
      }
      if (e.key === 'Escape') {
        this.removeOverlay();
      }
      e.stopPropagation();
    });

    container.style.position = 'relative';
    container.appendChild(overlay);
    this.textOverlay = overlay;

    requestAnimationFrame(() => overlay.focus());
  }

  private commitText(): void {
    if (!this.textOverlay || !this.activeCtx) return;

    const text = this.textOverlay.textContent?.trim();
    if (!text) return;

    const ctx = this.activeCtx;
    ctx.font = this.getFontString();
    ctx.fillStyle = this.color;
    ctx.textBaseline = 'top';

    const lines = text.split('\n');
    const lineHeight = this.fontSize * 1.2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], this.insertX, this.insertY + i * lineHeight);
    }
  }

  private removeOverlay(): void {
    if (this.textOverlay) {
      this.textOverlay.remove();
      this.textOverlay = null;
    }
  }

  getFontString(): string {
    return `${this.italic ? 'italic ' : ''}${this.bold ? 'bold ' : ''}${this.fontSize}px ${this.fontFamily}`;
  }

  private getCanvasCoords(e: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
