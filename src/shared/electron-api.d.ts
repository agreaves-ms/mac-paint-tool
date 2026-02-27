export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; data: string } | null>;
  saveFile: (dataUrl: string) => Promise<string | null>;
  onMenuNew: (callback: () => void) => void;
  onMenuOpen: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuSaveAs: (callback: () => void) => void;
  onMenuUndo: (callback: () => void) => void;
  onMenuRedo: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
