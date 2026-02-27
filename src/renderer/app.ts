import './styles/app.css';
import { PaintEngine } from './canvas/PaintEngine';
import { BrushTool } from './tools/BrushTool';
import { EraserTool } from './tools/EraserTool';
import { FillTool } from './tools/FillTool';
import { ShapeTool, type ShapeType } from './tools/ShapeTool';
import { SelectionTool } from './tools/SelectionTool';
import { EyedropperTool } from './tools/EyedropperTool';
import { TextTool } from './tools/TextTool';
import { CurveTool } from './tools/CurveTool';
import { LassoTool } from './tools/LassoTool';
import { GradientTool } from './tools/GradientTool';
import { UndoManager } from './canvas/UndoManager';
import { LayerManager } from './canvas/LayerManager';
import { ColorSelection } from './canvas/ColorSelection';
import { Filters } from './canvas/Filters';
import { Transform } from './canvas/Transform';
import { ColorPicker } from './ui/ColorPicker';
import { Toolbar } from './ui/Toolbar';
import { PropertyPanel } from './ui/PropertyPanel';
import { LayerPanel } from './ui/LayerPanel';
import { NewDocumentDialog } from './ui/NewDocumentDialog';
import { ResizeDialog } from './ui/ResizeDialog';
import { BrushEngine } from './tools/BrushEngine';
import { BrushPresetPanel } from './ui/BrushPresetPanel';
import { CurvesDialog } from './ui/CurvesDialog';
import { Adjustments } from './canvas/Adjustments';
import type { Tool } from './tools/Tool';

// Canvas & engine
const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
const canvasContainer = document.getElementById('canvas-container')!;
const engine = new PaintEngine(canvas, 1024, 768);

// Fill with white background (before layer init transfers content)
const initCtx = engine.getContext();
initCtx.fillStyle = 'white';
initCtx.fillRect(0, 0, canvas.width, canvas.height);

// Initialize layer system
const layerManager = new LayerManager(canvasContainer, canvas, canvas.width, canvas.height);
engine.setLayerManager(layerManager);

// Initialize tools
const brushTool = new BrushTool();
const eraserTool = new EraserTool();
const fillTool = new FillTool();
const shapeTool = new ShapeTool();
const selectionTool = new SelectionTool();
const eyedropperTool = new EyedropperTool();
const textTool = new TextTool();
const curveTool = new CurveTool();
const lassoTool = new LassoTool();
const gradientTool = new GradientTool();
const colorSelection = new ColorSelection(canvas);
const brushEngine = new BrushEngine();
const curvesDialog = new CurvesDialog();

// Wire eyedropper and selection tool into PaintEngine
engine.setSelectionTool(selectionTool);
engine.setEyedropperTool(eyedropperTool);

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
    curveTool.lineWidth = size;
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
  onGradientModeChange: (mode) => {
    gradientTool.gradientMode = mode;
  },
  onFontFamilyChange: (family) => {
    textTool.fontFamily = family;
  },
  onFontSizeChange: (size) => {
    textTool.fontSize = size;
  },
  onBoldChange: (bold) => {
    textTool.bold = bold;
  },
  onItalicChange: (italic) => {
    textTool.italic = italic;
  },
  onCornerRadiusChange: (radius) => {
    shapeTool.cornerRadius = radius;
  },
  onCurveTypeChange: (type) => {
    curveTool.curveType = type;
  },
  onOpacityChange: (opacity) => {
    brushTool.opacity = opacity;
  },
  onHardnessChange: (hardness) => {
    brushTool.hardness = hardness;
  },
  onSymmetryEnabledChange: (enabled) => {
    brushTool.symmetryEnabled = enabled;
  },
  onSymmetryAxisCountChange: (count) => {
    brushTool.symmetryAxisCount = count;
  },
  onSymmetryAxisTypeChange: (type) => {
    brushTool.symmetryAxisType = type as 'mirror-h' | 'mirror-v' | 'rotational';
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
  onPointerMove() { /* no-op */ },
  onPointerUp() { /* no-op */ },
};

// Tool map
const toolMap: Record<string, Tool> = {
  brush: brushTool,
  eraser: eraserTool,
  fill: fillTool,
  gradient: gradientTool,
  selection: selectionToolWrapper,
  marquee: selectionTool,
  lasso: lassoTool,
  eyedropper: eyedropperTool,
  text: textTool,
  line: shapeTool,
  rectangle: shapeTool,
  ellipse: shapeTool,
  roundedRect: shapeTool,
  polygon: shapeTool,
  curve: curveTool,
};

// Select tool
function selectTool(name: string): void {
  if (name === 'line' || name === 'rectangle' || name === 'ellipse' || name === 'roundedRect' || name === 'polygon') {
    shapeTool.shapeType = name as ShapeType;
  }
  const tool = toolMap[name];
  if (tool) {
    engine.setActiveTool(tool);
    propertyPanel.updateForTool(name);
  }
}

// Wire color changes
colorPicker.onChange((fg, bg) => {
  brushTool.color = fg;
  shapeTool.color = fg;
  shapeTool.fillColor = fg;
  textTool.color = fg;
  curveTool.color = fg;
  gradientTool.foregroundColor = fg;
  gradientTool.backgroundColor = bg;
  const r = parseInt(fg.slice(1, 3), 16);
  const g_val = parseInt(fg.slice(3, 5), 16);
  const b = parseInt(fg.slice(5, 7), 16);
  fillTool.fillColor = { r, g: g_val, b, a: 255 };
});

// Wire eyedropper callback
eyedropperTool.onColorSampled = (color: string) => {
  colorPicker.setForegroundColor(color);
  brushTool.color = color;
  shapeTool.color = color;
  shapeTool.fillColor = color;
  textTool.color = color;
  curveTool.color = color;
  gradientTool.foregroundColor = color;
  const r = parseInt(color.slice(1, 3), 16);
  const g_val = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  fillTool.fillColor = { r, g: g_val, b, a: 255 };
};

// Wire toolbar
toolbar.onToolChange((name) => selectTool(name));

// Save undo state before drawing starts
const layerResolver = (id: string) => engine.resolveLayerContext(id);

canvas.addEventListener('pointerdown', () => {
  const lm = engine.getLayerManager();
  undoManager.saveState(engine.getContext(), lm?.getActiveLayerId());
  engine.markDirty();
});

function undo(): void {
  undoManager.undo(engine.getContext(), layerResolver);
}

function redo(): void {
  undoManager.redo(engine.getContext(), layerResolver);
}

// Unsaved changes guard
function confirmUnsavedChanges(): boolean {
  if (!engine.isDirty()) return true;
  return confirm('You have unsaved changes. Continue?');
}

// Wire Electron menu events
window.electronAPI?.onMenuNew(() => {
  if (!confirmUnsavedChanges()) return;
  const dialog = new NewDocumentDialog((width, height, bgColor) => {
    undoManager.clear();
    engine.newDocument(width, height, bgColor);
  });
  dialog.show();
});
window.electronAPI?.onMenuOpen(() => {
  if (!confirmUnsavedChanges()) return;
  engine.openFile();
});
window.electronAPI?.onMenuSave(() => engine.saveFile());
window.electronAPI?.onMenuSaveAs(() => engine.saveFile());
window.electronAPI?.onMenuUndo(() => undo());
window.electronAPI?.onMenuRedo(() => redo());
window.electronAPI?.onMenuCopy(() => engine.copySelection());
window.electronAPI?.onMenuCut(() => engine.cutSelection());
window.electronAPI?.onMenuPaste(() => engine.pasteFromClipboard());

// Keyboard shortcuts
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target as HTMLElement)?.isContentEditable) return;

  const isMeta = e.metaKey || e.ctrlKey;

  if (isMeta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (isMeta && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
  if (isMeta && e.key === 'y') { e.preventDefault(); redo(); return; }
  if (isMeta && e.key === 's') { e.preventDefault(); engine.saveFile(); return; }
  if (isMeta && e.key === 'o') { e.preventDefault(); if (confirmUnsavedChanges()) engine.openFile(); return; }
  if (isMeta && e.key === 'c' && !e.shiftKey) { e.preventDefault(); engine.copySelection(); return; }
  if (isMeta && e.key === 'x') { e.preventDefault(); engine.cutSelection(); return; }
  if (isMeta && e.key === 'v' && e.shiftKey) { e.preventDefault(); engine.pasteAsNew(); return; }
  if (isMeta && e.key === 'v') { e.preventDefault(); engine.pasteFromClipboard(); return; }
  if (isMeta && e.key === 'n') {
    e.preventDefault();
    if (!confirmUnsavedChanges()) return;
    const dialog = new NewDocumentDialog((w, h, bg) => {
      undoManager.clear();
      engine.newDocument(w, h, bg);
    });
    dialog.show();
    return;
  }
  if (isMeta && e.shiftKey && e.key === 'r') {
    e.preventDefault();
    const c = engine.getCanvas();
    const dialog = new ResizeDialog(c.width, c.height, (w, h, anchor, bg) => {
      undoManager.saveState(engine.getContext(), engine.getLayerManager()?.getActiveLayerId());
      engine.resizeCanvas(w, h, anchor, bg);
      canvasSizeEl.textContent = `${w} × ${h}`;
    });
    dialog.show();
    return;
  }

  // Filter shortcuts
  if (isMeta && e.key === '\'' && !e.shiftKey) {
    e.preventDefault();
    engine.toggleGrid();
    return;
  }
  if (isMeta && e.key === 'i' && !e.shiftKey) {
    e.preventDefault();
    const ctx = engine.getContext();
    undoManager.saveState(ctx, engine.getLayerManager()?.getActiveLayerId());
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.putImageData(Filters.invert(imageData), 0, 0);
    return;
  }
  if (isMeta && e.key === 'm' && !e.shiftKey) {
    e.preventDefault();
    const ctx = engine.getContext();
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    undoManager.saveState(ctx, engine.getLayerManager()?.getActiveLayerId());
    const backup = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    curvesDialog.show(
      imageData,
      (lutR, lutG, lutB) => {
        const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        Adjustments.applyCurvesPerChannel(current, lutR, lutG, lutB);
        ctx.putImageData(current, 0, 0);
        engine.markDirty();
      },
      () => {
        ctx.putImageData(backup, 0, 0);
      }
    );
    return;
  }

  // Transform shortcuts
  if (isMeta && e.shiftKey && e.key === 'h') {
    e.preventDefault();
    const ctx = engine.getContext();
    undoManager.saveState(ctx, engine.getLayerManager()?.getActiveLayerId());
    Transform.flipHorizontal(ctx);
    return;
  }
  if (isMeta && e.shiftKey && e.key === 'j') {
    e.preventDefault();
    const ctx = engine.getContext();
    undoManager.saveState(ctx, engine.getLayerManager()?.getActiveLayerId());
    Transform.flipVertical(ctx);
    return;
  }

  // Single-key tool shortcuts
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'b': selectTool('brush'); toolbar.selectTool('brush'); break;
      case 'e': selectTool('eraser'); toolbar.selectTool('eraser'); break;
      case 'g': selectTool('fill'); toolbar.selectTool('fill'); break;
      case 'd': selectTool('gradient'); toolbar.selectTool('gradient'); break;
      case 'w': selectTool('selection'); toolbar.selectTool('selection'); break;
      case 'm': selectTool('marquee'); toolbar.selectTool('marquee'); break;
      case 'a': selectTool('lasso'); toolbar.selectTool('lasso'); break;
      case 'i': selectTool('eyedropper'); toolbar.selectTool('eyedropper'); break;
      case 't': selectTool('text'); toolbar.selectTool('text'); break;
      case 'l': selectTool('line'); toolbar.selectTool('line'); break;
      case 'r': selectTool('rectangle'); toolbar.selectTool('rectangle'); break;
      case 'o': selectTool('ellipse'); toolbar.selectTool('ellipse'); break;
      case 'u': selectTool('roundedRect'); toolbar.selectTool('roundedRect'); break;
      case 'p': selectTool('polygon'); toolbar.selectTool('polygon'); break;
      case 'c': selectTool('curve'); toolbar.selectTool('curve'); break;
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

// Dynamic zoom level display
engine.onZoomChange((zoom) => {
  zoomLevelEl.textContent = `${Math.round(zoom * 100)}%`;
});

zoomLevelEl.textContent = `${Math.round(engine.getZoomLevel() * 100)}%`;
canvasSizeEl.textContent = `${canvas.width} × ${canvas.height}`;

// Dark mode toggle
const statusBar = document.getElementById('status-bar')!;
const spacer = document.createElement('span');
spacer.className = 'status-bar-spacer';
statusBar.appendChild(spacer);

const themeToggle = document.createElement('button');
themeToggle.className = 'theme-toggle-btn';
themeToggle.title = 'Toggle dark/light theme';

function applyTheme(theme: string | null): void {
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeLabel();
}

function updateThemeLabel(): void {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark') {
    themeToggle.textContent = '☀️ Light';
  } else if (current === 'light') {
    themeToggle.textContent = '🌙 Dark';
  } else {
    themeToggle.textContent = '🔄 Auto';
  }
}

function cycleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme');
  let next: string | null;
  if (!current) {
    next = 'dark';
  } else if (current === 'dark') {
    next = 'light';
  } else {
    next = null;
  }
  if (next) {
    localStorage.setItem('mac-paint-theme', next);
  } else {
    localStorage.removeItem('mac-paint-theme');
  }
  applyTheme(next);
}

themeToggle.addEventListener('click', cycleTheme);
statusBar.appendChild(themeToggle);
applyTheme(localStorage.getItem('mac-paint-theme'));

// Grid overlay
engine.initGrid(canvasContainer);

// Layer panel
new LayerPanel(document.getElementById('property-panel')!, layerManager);

// Brush preset panel
new BrushPresetPanel(document.getElementById('property-panel')!, brushEngine);

// Set default tool
selectTool('brush');
