export interface ToolDef {
  name: string;
  icon: string;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { name: 'brush', icon: '✏', shortcut: 'B' },
  { name: 'eraser', icon: '◻', shortcut: 'E' },
  { name: 'fill', icon: '🪣', shortcut: 'G' },
  { name: 'selection', icon: '🎯', shortcut: 'W' },
  { name: 'marquee', icon: '⬚', shortcut: 'M' },
  { name: 'eyedropper', icon: '💉', shortcut: 'I' },
  { name: 'text', icon: 'T', shortcut: 'T' },
  { name: 'line', icon: '╱', shortcut: 'L' },
  { name: 'rectangle', icon: '□', shortcut: 'R' },
  { name: 'ellipse', icon: '○', shortcut: 'O' },
  { name: 'roundedRect', icon: '▢', shortcut: 'U' },
  { name: 'polygon', icon: '⬡', shortcut: 'P' },
  { name: 'curve', icon: '〰', shortcut: 'C' },
];

export class Toolbar {
  private buttons = new Map<string, HTMLButtonElement>();
  private activeTool = 'brush';
  private onToolChangeCallback: ((toolName: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.render(container);
  }

  private render(container: HTMLElement): void {
    for (const tool of TOOLS) {
      const btn = document.createElement('button');
      btn.className = 'toolbar-btn';
      btn.dataset.tool = tool.name;
      btn.title = `${tool.name.charAt(0).toUpperCase() + tool.name.slice(1)} (${tool.shortcut})`;
      btn.textContent = tool.icon;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.selectTool(tool.name);
      });

      this.buttons.set(tool.name, btn);
      container.appendChild(btn);
    }

    this.updateActiveState();
  }

  onToolChange(callback: (toolName: string) => void): void {
    this.onToolChangeCallback = callback;
  }

  selectTool(name: string): void {
    if (!this.buttons.has(name)) return;
    this.activeTool = name;
    this.updateActiveState();
    this.onToolChangeCallback?.(name);
  }

  getActiveTool(): string {
    return this.activeTool;
  }

  private updateActiveState(): void {
    for (const [name, btn] of this.buttons) {
      btn.classList.toggle('active', name === this.activeTool);
    }
  }
}
