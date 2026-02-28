export interface ToolDef {
  name: string;
  icon: string;
  shortcut: string;
}

const svgAttrs = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

const TOOLS: ToolDef[] = [
  { name: 'brush', icon: `<svg ${svgAttrs}><path d="M10 2l3 3-7 7H3v-3z"/><path d="M8.5 3.5l3 3"/></svg>`, shortcut: 'B' },
  { name: 'eraser', icon: `<svg ${svgAttrs}><path d="M5 14h8"/><path d="M3.5 10.5L10 4l3 3-5 5H5l-1.5-1.5z"/></svg>`, shortcut: 'E' },
  { name: 'fill', icon: `<svg ${svgAttrs}><path d="M3.5 6h8l-1 8h-6z"/><path d="M5.5 6c0-2.5 2.5-3.5 2.5-3.5s2.5 1 2.5 3.5"/><path d="M13 8c0 1-.5 1.8-1 1.8s-1-.8-1-1.8c0-1.2 1-2.3 1-2.3s1 1.1 1 2.3z"/></svg>`, shortcut: 'G' },
  { name: 'gradient', icon: `<svg ${svgAttrs}><rect x="2" y="2" width="12" height="12" rx="1"/><line x1="5" y1="2" x2="5" y2="14"/><line x1="8" y1="2" x2="8" y2="14"/><line x1="11" y1="2" x2="11" y2="14"/></svg>`, shortcut: 'D' },
  { name: 'selection', icon: `<svg ${svgAttrs}><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><line x1="8" y1="1" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="15"/><line x1="1" y1="8" x2="4" y2="8"/><line x1="12" y1="8" x2="15" y2="8"/></svg>`, shortcut: 'W' },
  { name: 'marquee', icon: `<svg ${svgAttrs}><rect x="2" y="2" width="12" height="12" stroke-dasharray="2 2"/></svg>`, shortcut: 'M' },
  { name: 'lasso', icon: `<svg ${svgAttrs}><path d="M5 13C3 11 2 9 3 6s3-4 6-4c3 0 5 2 4 5s-3 4-5 3" stroke-dasharray="2 2"/><circle cx="5" cy="13" r="1" fill="currentColor" stroke="none"/></svg>`, shortcut: 'A' },
  { name: 'eyedropper', icon: `<svg ${svgAttrs}><path d="M13.5 2.5a2 2 0 00-2.8 0L9 4.2 7 6.2l-3.5 3.5-.5 3 3-.5L9.5 9l2-2 1.7-1.7a2 2 0 000-2.8z"/><path d="M3 13l-.5.5"/></svg>`, shortcut: 'I' },
  { name: 'text', icon: `<svg ${svgAttrs}><path d="M4 3h8"/><path d="M8 3v10"/><path d="M6 13h4"/></svg>`, shortcut: 'T' },
  { name: 'line', icon: `<svg ${svgAttrs}><line x1="3" y1="13" x2="13" y2="3"/><circle cx="3" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="3" r="1" fill="currentColor" stroke="none"/></svg>`, shortcut: 'L' },
  { name: 'rectangle', icon: `<svg ${svgAttrs}><rect x="2" y="3" width="12" height="10" rx="0.5"/></svg>`, shortcut: 'R' },
  { name: 'ellipse', icon: `<svg ${svgAttrs}><ellipse cx="8" cy="8" rx="6" ry="4.5"/></svg>`, shortcut: 'O' },
  { name: 'roundedRect', icon: `<svg ${svgAttrs}><rect x="2" y="3" width="12" height="10" rx="4"/><path d="M2 7L2 6.5Q2 3 5.5 3L6 3" fill="none" stroke-width="1"/></svg>`, shortcut: 'U' },
  { name: 'polygon', icon: `<svg ${svgAttrs}><path d="M8 2l5.5 4-2 6.5h-7L2.5 6z"/></svg>`, shortcut: 'P' },
  { name: 'curve', icon: `<svg ${svgAttrs}><path d="M2 12C4 4 12 4 14 12"/><circle cx="3" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="5" r="1" fill="currentColor" stroke="none"/></svg>`, shortcut: 'C' },
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
      const displayName = tool.name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
        .trim();
      btn.title = `${displayName} (${tool.shortcut})`;
      btn.innerHTML = tool.icon;

      const shortcutBadge = document.createElement('span');
      shortcutBadge.className = 'shortcut-indicator';
      shortcutBadge.textContent = tool.shortcut;
      btn.appendChild(shortcutBadge);

      const toolNameLabel = document.createElement('span');
      toolNameLabel.className = 'tool-name-label';
      toolNameLabel.textContent = displayName;
      btn.appendChild(toolNameLabel);

      btn.addEventListener('pointerenter', () => {
        const rect = btn.getBoundingClientRect();
        toolNameLabel.style.left = `${rect.right + 8}px`;
        toolNameLabel.style.top = `${rect.top + rect.height / 2}px`;
        toolNameLabel.style.transform = 'translateY(-50%)';
      });

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
