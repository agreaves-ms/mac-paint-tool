export class ResizeDialog {
  private overlay: HTMLDivElement;
  private onConfirm: (width: number, height: number, anchor: string, bgColor: string) => void;

  constructor(
    currentWidth: number,
    currentHeight: number,
    onConfirm: (width: number, height: number, anchor: string, bgColor: string) => void,
  ) {
    this.onConfirm = onConfirm;
    this.overlay = this.createDialog(currentWidth, currentHeight);
  }

  private createDialog(currentWidth: number, currentHeight: number): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'resize-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'resize-dialog';
    dialog.style.cssText = `
      background: var(--panel-bg, #2d2d2d); color: var(--text-color, #e0e0e0);
      border-radius: 8px; padding: 24px; min-width: 320px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    `;

    const anchorPositions = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right',
    ];
    const anchorGridHTML = anchorPositions.map((pos) => {
      const checked = pos === 'center' ? 'checked' : '';
      return `<label style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;cursor:pointer;">
        <input type="radio" name="resize-anchor" value="${pos}" ${checked}>
      </label>`;
    }).join('');

    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px; font-size: 16px;">Resize Canvas</h3>
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px;">Width</label>
          <input type="number" class="resize-width" value="${currentWidth}" min="1" max="8192"
            style="width: 100%; padding: 4px 8px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px;">Height</label>
          <input type="number" class="resize-height" value="${currentHeight}" min="1" max="8192"
            style="width: 100%; padding: 4px 8px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; box-sizing: border-box;">
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px;">Anchor</label>
        <div style="display: grid; grid-template-columns: repeat(3, 28px); gap: 4px;">
          ${anchorGridHTML}
        </div>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px;">Background Color</label>
        <input type="color" class="resize-bg-color" value="#ffffff"
          style="width: 48px; height: 28px; border: 1px solid #555; border-radius: 4px; cursor: pointer;">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button class="resize-cancel" style="padding: 6px 16px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button class="resize-ok" style="padding: 6px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.bindEvents(overlay);
    return overlay;
  }

  private bindEvents(overlay: HTMLDivElement): void {
    const widthInput = overlay.querySelector('.resize-width') as HTMLInputElement;
    const heightInput = overlay.querySelector('.resize-height') as HTMLInputElement;
    const bgColorInput = overlay.querySelector('.resize-bg-color') as HTMLInputElement;
    const cancelBtn = overlay.querySelector('.resize-cancel') as HTMLButtonElement;
    const okBtn = overlay.querySelector('.resize-ok') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    okBtn.addEventListener('click', () => {
      const width = Math.max(1, Math.min(8192, parseInt(widthInput.value) || 1024));
      const height = Math.max(1, Math.min(8192, parseInt(heightInput.value) || 768));
      const anchorRadio = overlay.querySelector('input[name="resize-anchor"]:checked') as HTMLInputElement;
      const anchor = anchorRadio?.value || 'center';
      const bgColor = bgColorInput.value || '#ffffff';
      this.onConfirm(width, height, anchor, bgColor);
      this.close();
    });
  }

  show(): void {
    document.body.appendChild(this.overlay);
  }

  private close(): void {
    this.overlay.remove();
  }
}
