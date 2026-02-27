import './styles/app.css';
import { PaintEngine } from './canvas/PaintEngine';
import { BrushTool } from './tools/BrushTool';
import { EraserTool } from './tools/EraserTool';
import { FillTool } from './tools/FillTool';
import { ShapeTool, type ShapeType } from './tools/ShapeTool';
import { UndoManager } from './canvas/UndoManager';
import { ColorSelection } from './canvas/ColorSelection';
import { ColorPicker } from './ui/ColorPicker';
import { Toolbar } from './ui/Toolbar';
import { PropertyPanel } from './ui/PropertyPanel';
import { NewDocumentDialog } from './ui/NewDocumentDialog';
import type { Tool } from './tools/Tool';

// Canvas & engine
const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
const engine = new PaintEngine(canvas, 1024, 768);
const ctx = engine.getContext();

// Fill with white background
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Initialize tools
const brushTool = new BrushTool();
const eraserTool = new EraserTool();
const fillTool = new FillTool();
const shapeTool = new ShapeTool();
const colorSelection = new ColorSelection(canvas);

// Undo manager
const undoManager = new UndoManager(canvas.width, canvas.height);

// UI Components
const colorPicker = new ColorPicker(document.getElementById('color-panel')!);
const toolbar = new Toolbar(document.getElementById('toolbar')!);
const propertyPanel = new PropertyPanel(document.getElementById('property-panel')!, {
  onLineSizeChange: (size) => {
    brushTool.lineWidth = size;
    eraserTool.lineWidth = size;
    shapeTool.lineWidth = size;
  },
  onToleranceChange: (tolerance) => {
    fillTool.tolerance = tolerance;
  },
  onGradianceChange: () => {
    // Used by selection tool on-demand via propertyPanel.getGradiance()
  },
  onShapeModeChange: (mode) => {
    shapeTool.shapeMode = mode;
  },
  onCursorChange: (cursor) => {
    canvas.style.cursor = cursor;
  },
});

// ColorSelection tool wrapper
const selectionToolWrapper: Tool = {
  name: 'selection',
  cursor: 'crosshair',
  lineWidth: 1,
  onPointerDown(e: PointerEvent, drawCtx: CanvasRenderingContext2D) {
    const rect = drawCtx.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    colorSelection.select(drawCtx, x, y, propertyPanel.getGradiance());
  },
  onPointerMove() {},
  onPointerUp() {},
};

// Tool map
const toolMap: Record<string, Tool> = {
  brush: brushTool,
  eraser: eraserTool,
  fill: fillTool,
  selection: selectionToolWrapper,
  line: shapeTool,
  rectangle: shapeTool,
  ellipse: shapeTool,
};

// Select tool
function selectTool(name: string): void {
  if (name === 'line' || name === 'rectangle' || name === 'ellipse') {
    shapeTool.shapeType = name as ShapeType;
  }
  const tool = toolMap[name];
  if (tool) {
    engine.setActiveTool(tool);
    propertyPanel.updateForTool(name);
  }
}

// Wire color changes
colorPicker.onChange((fg) => {
  brushTool.color = fg;
  shapeTool.color = fg;
  shapeTool.fillColor = fg;
  const r = parseInt(fg.slice(1, 3), 16);
  const g_val = parseInt(fg.slice(3, 5), 16);
  const b = parseInt(fg.slice(5, 7), 16);
  fillTool.fillColor = { r, g: g_val, b, a: 255 };
});

// Wire toolbar
toolbar.onToolChange((name) => selectTool(name));

// Save undo state before drawing starts
canvas.addEventListener('pointerdown', () => {
  undoManager.saveState(ctx);
});

function undo(): void {
  undoManager.undo(ctx);
}

function redo(): void {
  undoManager.redo(ctx);
}

// Wire Electron menu events
window.electronAPI?.onMenuNew(() => {
  const dialog = new NewDocumentDialog((width, height, bgColor) => {
    undoManager.clear();
    engine.newDocument(width, height, bgColor);
  });
  dialog.show();
});
window.electronAPI?.onMenuOpen(() => engine.openFile());
window.electronAPI?.onMenuSave(() => engine.saveFile());
window.electronAPI?.onMenuSaveAs(() => engine.saveFile());
window.electronAPI?.onMenuUndo(() => undo());
window.electronAPI?.onMenuRedo(() => redo());

// Keyboard shortcuts
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

  const isMeta = e.metaKey || e.ctrlKey;

  if (isMeta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (isMeta && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
  if (isMeta && e.key === 'y') { e.preventDefault(); redo(); return; }
  if (isMeta && e.key === 's') { e.preventDefault(); engine.saveFile(); return; }
  if (isMeta && e.key === 'o') { e.preventDefault(); engine.openFile(); return; }
  if (isMeta && e.key === 'n') {
    e.preventDefault();
    const dialog = new NewDocumentDialog((w, h, bg) => {
      undoManager.clear();
      engine.newDocument(w, h, bg);
    });
    dialog.show();
    return;
  }

  // Single-key tool shortcuts
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'b': selectTool('brush'); toolbar.selectTool('brush'); break;
      case 'e': selectTool('eraser'); toolbar.selectTool('eraser'); break;
      case 'g': selectTool('fill'); toolbar.selectTool('fill'); break;
      case 'w': selectTool('selection'); toolbar.selectTool('selection'); break;
      case 'l': selectTool('line'); toolbar.selectTool('line'); break;
      case 'r': selectTool('rectangle'); toolbar.selectTool('rectangle'); break;
      case 'o': selectTool('ellipse'); toolbar.selectTool('ellipse'); break;
      case 'x': colorPicker.swapColors(); break;
      case '[': {
        const newSize = Math.max(1, propertyPanel.getLineSize() - 1);
        propertyPanel.setLineSize(newSize);
        break;
      }
      case ']': {
        const newSize = Math.min(100, propertyPanel.getLineSize() + 1);
        propertyPanel.setLineSize(newSize);
        break;
      }
    }
  }
});

// Status bar updates
const cursorPosEl = document.getElementById('cursor-pos')!;
const zoomLevelEl = document.getElementById('zoom-level')!;
const canvasSizeEl = document.getElementById('canvas-size')!;

canvas.addEventListener('pointermove', (e: PointerEvent) => {
  const coords = engine.mapCoordinates(e);
  cursorPosEl.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)}`;
});

zoomLevelEl.textContent = `${Math.round(engine.getZoomLevel() * 100)}%`;
canvasSizeEl.textContent = `${canvas.width} × ${canvas.height}`;

// Set default tool
selectTool('brush');
