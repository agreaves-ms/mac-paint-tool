export class NewDocumentDialog {
  private overlay: HTMLDivElement;
  private onConfirm: (width: number, height: number, bgColor: string) => void;

  constructor(onConfirm: (width: number, height: number, bgColor: string) => void) {
    this.onConfirm = onConfirm;
    this.overlay = this.createDialog();
  }

  private createDialog(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'new-doc-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'new-doc-dialog';
    dialog.style.cssText = `
      background: var(--panel-bg, #2d2d2d); color: var(--text-color, #e0e0e0);
      border-radius: 8px; padding: 24px; min-width: 320px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px; font-size: 16px;">New Document</h3>
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px;">Preset Size</label>
        <select class="new-doc-preset" style="width: 100%; padding: 4px 8px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px;">
          <option value="">Custom</option>
          <option value="800,600">800 × 600</option>
          <option value="1024,768" selected>1024 × 768</option>
          <option value="1920,1080">1920 × 1080</option>
        </select>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px;">Width</label>
          <input type="number" class="new-doc-width" value="1024" min="1" max="8192"
            style="width: 100%; padding: 4px 8px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 4px; font-size: 13px;">Height</label>
          <input type="number" class="new-doc-height" value="768" min="1" max="8192"
            style="width: 100%; padding: 4px 8px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; box-sizing: border-box;">
        </div>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-size: 13px;">Background</label>
        <div style="display: flex; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer;">
            <input type="radio" name="new-doc-bg" value="#ffffff" checked> White
          </label>
          <label style="display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer;">
            <input type="radio" name="new-doc-bg" value="transparent"> Transparent
          </label>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button class="new-doc-cancel" style="padding: 6px 16px; background: #3c3c3c; color: #e0e0e0; border: 1px solid #555; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button class="new-doc-create" style="padding: 6px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Create</button>
      </div>
    `;

    overlay.appendChild(dialog);
    this.bindEvents(overlay);
    return overlay;
  }

  private bindEvents(overlay: HTMLDivElement): void {
    const preset = overlay.querySelector('.new-doc-preset') as HTMLSelectElement;
    const widthInput = overlay.querySelector('.new-doc-width') as HTMLInputElement;
    const heightInput = overlay.querySelector('.new-doc-height') as HTMLInputElement;
    const cancelBtn = overlay.querySelector('.new-doc-cancel') as HTMLButtonElement;
    const createBtn = overlay.querySelector('.new-doc-create') as HTMLButtonElement;

    preset.addEventListener('change', () => {
      if (preset.value) {
        const [w, h] = preset.value.split(',').map(Number);
        widthInput.value = String(w);
        heightInput.value = String(h);
      }
    });

    cancelBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    createBtn.addEventListener('click', () => {
      const width = Math.max(1, Math.min(8192, parseInt(widthInput.value) || 1024));
      const height = Math.max(1, Math.min(8192, parseInt(heightInput.value) || 768));
      const bgRadio = overlay.querySelector('input[name="new-doc-bg"]:checked') as HTMLInputElement;
      const bgColor = bgRadio?.value || '#ffffff';
      this.onConfirm(width, height, bgColor);
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
