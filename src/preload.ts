import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:save', dataUrl),
  getSavePath: () => ipcRenderer.invoke('dialog:getSavePath'),
  writeImageFile: (filePath: string, dataUrl: string) => ipcRenderer.invoke('file:writeImage', filePath, dataUrl),
  writeClipboardImage: (dataUrl: string) => ipcRenderer.invoke('clipboard:write-image', dataUrl),
  readClipboardImage: () => ipcRenderer.invoke('clipboard:read-image'),
  onMenuNew: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-new', handler);
    return () => { ipcRenderer.removeListener('menu-new', handler); };
  },
  onMenuOpen: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-open', handler);
    return () => { ipcRenderer.removeListener('menu-open', handler); };
  },
  onMenuSave: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-save', handler);
    return () => { ipcRenderer.removeListener('menu-save', handler); };
  },
  onMenuSaveAs: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-save-as', handler);
    return () => { ipcRenderer.removeListener('menu-save-as', handler); };
  },
  onMenuUndo: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-undo', handler);
    return () => { ipcRenderer.removeListener('menu-undo', handler); };
  },
  onMenuRedo: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-redo', handler);
    return () => { ipcRenderer.removeListener('menu-redo', handler); };
  },
  onMenuCopy: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-copy', handler);
    return () => { ipcRenderer.removeListener('menu-copy', handler); };
  },
  onMenuCut: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-cut', handler);
    return () => { ipcRenderer.removeListener('menu-cut', handler); };
  },
  onMenuPaste: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-paste', handler);
    return () => { ipcRenderer.removeListener('menu-paste', handler); };
  },
});
