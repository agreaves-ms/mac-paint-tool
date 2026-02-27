export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; data: string } | null>;
  saveFile: (dataUrl: string) => Promise<string | null>;
  getSavePath: () => Promise<string | null>;
  writeImageFile: (filePath: string, dataUrl: string) => Promise<string | null>;
  writeClipboardImage: (dataUrl: string) => Promise<void>;
  readClipboardImage: () => Promise<string | null>;
  onMenuNew: (callback: () => void) => () => void;
  onMenuOpen: (callback: () => void) => () => void;
  onMenuSave: (callback: () => void) => () => void;
  onMenuSaveAs: (callback: () => void) => () => void;
  onMenuUndo: (callback: () => void) => () => void;
  onMenuRedo: (callback: () => void) => () => void;
  onMenuCopy: (callback: () => void) => () => void;
  onMenuCut: (callback: () => void) => () => void;
  onMenuPaste: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
