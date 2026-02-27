import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:save', dataUrl),
  getSavePath: () => ipcRenderer.invoke('dialog:getSavePath'),
  writeImageFile: (filePath: string, dataUrl: string) => ipcRenderer.invoke('file:writeImage', filePath, dataUrl),
  writeClipboardImage: (dataUrl: string) => ipcRenderer.invoke('clipboard:write-image', dataUrl),
  readClipboardImage: () => ipcRenderer.invoke('clipboard:read-image'),
  onMenuNew: (callback: () => void) => ipcRenderer.on('menu-new', callback),
  onMenuOpen: (callback: () => void) => ipcRenderer.on('menu-open', callback),
  onMenuSave: (callback: () => void) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback: () => void) => ipcRenderer.on('menu-save-as', callback),
  onMenuUndo: (callback: () => void) => ipcRenderer.on('menu-undo', callback),
  onMenuRedo: (callback: () => void) => ipcRenderer.on('menu-redo', callback),
  onMenuCopy: (callback: () => void) => ipcRenderer.on('menu-copy', callback),
  onMenuCut: (callback: () => void) => ipcRenderer.on('menu-cut', callback),
  onMenuPaste: (callback: () => void) => ipcRenderer.on('menu-paste', callback),
});
