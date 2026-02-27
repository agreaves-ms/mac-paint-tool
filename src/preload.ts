import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:save', dataUrl),
  onMenuNew: (callback: () => void) => ipcRenderer.on('menu-new', callback),
  onMenuOpen: (callback: () => void) => ipcRenderer.on('menu-open', callback),
  onMenuSave: (callback: () => void) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback: () => void) => ipcRenderer.on('menu-save-as', callback),
  onMenuUndo: (callback: () => void) => ipcRenderer.on('menu-undo', callback),
  onMenuRedo: (callback: () => void) => ipcRenderer.on('menu-redo', callback),
});
