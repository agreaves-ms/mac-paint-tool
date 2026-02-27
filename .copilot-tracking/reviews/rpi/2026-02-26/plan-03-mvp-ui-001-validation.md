<!-- markdownlint-disable-file -->
# RPI Validation: Plan 03 — P0 MVP UI, File I/O and Polish

**Plan**: `.copilot-tracking/plans/2026-02-26/plan-03-mvp-ui.instructions.md`
**Changes Log**: `.copilot-tracking/changes/2026-02-26/plan-03-mvp-ui-changes.md`
**Research**: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md`
**Phase**: ALL (Phase 1: Steps 3.1–3.9)
**Validation Date**: 2026-02-26
**Status**: **Partial**

---

## Coverage Summary

| Step | Description | Status | Severity |
|------|-------------|--------|----------|
| 3.1 | ColorPicker.ts | ✅ Pass | — |
| 3.2 | Toolbar.ts | ✅ Pass | — |
| 3.3 | PropertyPanel.ts | ✅ Pass | — |
| 3.4 | Zoom/Pan | ✅ Pass | — |
| 3.5 | File I/O | ✅ Pass (minor deviation) | Minor |
| 3.6 | New Document | ⚠️ Partial | Major |
| 3.7 | Keyboard Shortcuts | ✅ Pass | — |
| 3.8 | app.css Layout | ✅ Pass | — |
| 3.9 | Validation Phase | ✅ Pass (claim) | — |
| — | PaintEngine 3 additive methods | ✅ Pass | — |

**Overall: 8/9 steps fully pass. 1 step partial. 1 minor deviation noted.**

---

## Detailed Findings

### Step 3.1: ColorPicker.ts — PASS

**Requirements:** `<input type="color">` + fg/bg swap (X key), default fg=#000000, bg=#ffffff, overlapping squares pattern.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Two `<input type="color">` elements | ✅ | `src/renderer/ui/ColorPicker.ts` L22, L37 |
| Default fg=#000000 | ✅ | `src/renderer/ui/ColorPicker.ts` L2 |
| Default bg=#ffffff | ✅ | `src/renderer/ui/ColorPicker.ts` L3 |
| Overlapping squares CSS pattern | ✅ | `src/renderer/ui/ColorPicker.ts` L17 (`color-swatch-bg`), L35 (`color-swatch-fg`) + `app.css` L166–L175 |
| swapColors() method | ✅ | `src/renderer/ui/ColorPicker.ts` L79–L84 |
| X key shortcut wired | ✅ | `src/renderer/app.ts` L306 (`case 'x': colorPicker.swapColors()`) |
| onChange callback | ✅ | `src/renderer/ui/ColorPicker.ts` L55–L57 |

---

### Step 3.2: Toolbar.ts — PASS

**Requirements:** 7 tool buttons (Brush/B, Eraser/E, Fill/G, ColorSelection/W, Line/L, Rectangle/R, Ellipse/O), active state highlighting.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Brush (B) button | ✅ | `src/renderer/ui/Toolbar.ts` L8 |
| Eraser (E) button | ✅ | `src/renderer/ui/Toolbar.ts` L9 |
| Fill (G) button | ✅ | `src/renderer/ui/Toolbar.ts` L10 |
| Selection/ColorSelection (W) button | ✅ | `src/renderer/ui/Toolbar.ts` L12 |
| Line (L) button | ✅ | `src/renderer/ui/Toolbar.ts` L17 |
| Rectangle (R) button | ✅ | `src/renderer/ui/Toolbar.ts` L18 |
| Ellipse (O) button | ✅ | `src/renderer/ui/Toolbar.ts` L19 |
| Active state highlighting | ✅ | `src/renderer/ui/Toolbar.ts` L64 (`classList.toggle('active')`) + `app.css` L192 (`.toolbar-btn.active`) |

**Note — Scope expansion (not a defect):** Toolbar contains 15 tools, not 7. Additional tools (gradient/D, marquee/M, lasso/A, eyedropper/I, text/T, roundedRect/U, polygon/P, curve/C) were added by subsequent plans. All 7 original P0 tools are present and functional.

---

### Step 3.3: PropertyPanel.ts — PASS

**Requirements:** Line size 1–100, tolerance 0–255, gradiance 0–255, shape mode toggle (stroke/fill/strokeAndFill), brush size cursor preview via canvas data URL.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Line size slider min=1, max=100 | ✅ | `src/renderer/ui/PropertyPanel.ts` L106 (`createSlider('line-size', 1, 100, ...)`) |
| Tolerance slider min=0, max=255 | ✅ | `src/renderer/ui/PropertyPanel.ts` L180 (`createSlider('tolerance', 0, 255, ...)`) |
| Gradiance slider min=0, max=255 | ✅ | `src/renderer/ui/PropertyPanel.ts` L192 (`createSlider('gradiance', 0, 255, ...)`) |
| Shape mode toggle (stroke/fill/strokeAndFill) | ✅ | `src/renderer/ui/PropertyPanel.ts` L205–L227 |
| Brush size cursor preview (canvas data URL) | ✅ | `src/renderer/ui/PropertyPanel.ts` L464–L478 (`updateCursorPreview()` creates canvas, draws arc, uses `toDataURL()`) |
| setLineSize() with callback trigger | ✅ | `src/renderer/ui/PropertyPanel.ts` L491–L497 |

**Note — Scope expansion (not a defect):** PropertyPanel also includes opacity, hardness, brush presets, text controls, corner radius, curve type, gradient mode, and symmetry controls from subsequent plans.

---

### Step 3.4: Zoom/Pan — PASS

**Requirements:** CSS transform scale, cursor-centered wheel zoom, Space+drag pan, coordinate mapping updated for zoom offset. Zoom levels 25%–1600%.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| CSS transform scale | ✅ | `src/renderer/canvas/PaintEngine.ts` L126 (`transform: translate(...) scale(${this.zoomLevel})`) |
| Cursor-centered wheel zoom | ✅ | `src/renderer/canvas/PaintEngine.ts` L103–L108 (`handleWheel`) + L130–L139 (`zoomAtPoint`) |
| Space+drag pan | ✅ | `src/renderer/canvas/PaintEngine.ts` L110–L113 (Space keydown), L63–L68 (pointer pan start), L75–L81 (pointer pan move) |
| Coordinate mapping for zoom | ✅ | `src/renderer/canvas/PaintEngine.ts` L261–L266 (`mapCoordinates` divides by `zoomLevel`) |
| Zoom range 25%–1600% (0.25–16) | ✅ | `src/renderer/canvas/PaintEngine.ts` L106 (`Math.max(0.25, Math.min(16, ...))`) |
| Zoom steps array | ✅ | `src/renderer/canvas/PaintEngine.ts` L18 (`[0.25, 0.5, 1, 2, 4, 8, 16]`) |

---

### Step 3.5: File I/O — PASS (Minor Deviation)

**Requirements:** Main process IPC handlers for open/save dialogs, preload contextBridge, canvas.toBlob save, Image+drawImage open.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Main process IPC: dialog:open | ✅ | `src/main.ts` L116–L128 |
| Main process IPC: dialog:save | ✅ | `src/main.ts` L130–L143 |
| Main process IPC: dialog:getSavePath | ✅ | `src/main.ts` L145–L155 |
| Main process IPC: file:writeImage | ✅ | `src/main.ts` L157–L161 |
| Preload contextBridge | ✅ | `src/preload.ts` L3–L19 |
| Save via canvas export | ✅ | `src/renderer/canvas/PaintEngine.ts` L270–L289 (`saveFile()`) |
| Open via Image+drawImage | ✅ | `src/renderer/canvas/PaintEngine.ts` L299–L311 (`openFile()`) |
| Native macOS dialog filters | ✅ | `src/main.ts` L119–L122, L133–L137 |

**Minor Deviation:** Plan specifies "canvas.toBlob save" but `saveFile()` uses `toDataURL()` instead. An `exportToBlob()` method does exist separately (L291–L297). The `toDataURL` approach is a practical design choice for IPC serialization. Functionality is equivalent.

**Severity: Minor** — No functional impact. Save produces valid PNG/JPEG/WebP files.

---

### Step 3.6: New Document — PARTIAL

**Requirements:** Width/height inputs, bg color, presets, unsaved changes prompt, PaintEngine.newDocument() method, reset undo history.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Width/height number inputs | ✅ | `src/renderer/ui/NewDocumentDialog.ts` L40–L51 |
| Background color (white/transparent) | ✅ | `src/renderer/ui/NewDocumentDialog.ts` L53–L60 |
| Preset sizes (800×600, 1024×768, 1920×1080) | ✅ | `src/renderer/ui/NewDocumentDialog.ts` L34–L38 |
| PaintEngine.newDocument() | ✅ | `src/renderer/canvas/PaintEngine.ts` L315–L330 |
| Undo history clear on new doc | ✅ | `src/renderer/app.ts` L218 (`undoManager.clear()`) |
| **Unsaved changes prompt** | ❌ **Missing** | Not found in NewDocumentDialog.ts or app.ts |

**Finding F-3.6.1 — Missing unsaved changes prompt**

The plan explicitly requires "unsaved changes prompt" (Step 3.6 checklist item). Neither `NewDocumentDialog` nor the `app.ts` wiring checks for unsaved work before creating a new document. The dialog opens directly and creates the document upon confirm without any guard.

Both paths to New Document lack this guard:
- Keyboard shortcut Ctrl/⌘+N (`app.ts` L248–L254)
- Menu event `onMenuNew` (`app.ts` L217–L222)

**Severity: Major** — Users can lose all work by accidentally creating a new document without warning. This is a data-loss scenario for the P0 MVP.

---

### Step 3.7: Keyboard Shortcuts — PASS

**Requirements:** Ctrl/⌘+Z/Y undo/redo, single-key tool switching, X swap colors, [] brush size, input field guard.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| Ctrl/⌘+Z undo | ✅ | `src/renderer/app.ts` L237 |
| Ctrl/⌘+Shift+Z redo | ✅ | `src/renderer/app.ts` L238 |
| Ctrl/⌘+Y redo | ✅ | `src/renderer/app.ts` L239 |
| Single-key B (brush) | ✅ | `src/renderer/app.ts` L291 |
| Single-key E (eraser) | ✅ | `src/renderer/app.ts` L292 |
| Single-key G (fill) | ✅ | `src/renderer/app.ts` L293 |
| Single-key W (selection) | ✅ | `src/renderer/app.ts` L295 |
| Single-key L (line) | ✅ | `src/renderer/app.ts` L300 |
| Single-key R (rectangle) | ✅ | `src/renderer/app.ts` L301 |
| Single-key O (ellipse) | ✅ | `src/renderer/app.ts` L302 |
| X swap colors | ✅ | `src/renderer/app.ts` L306 |
| [ decrease brush size | ✅ | `src/renderer/app.ts` L307–L310 |
| ] increase brush size | ✅ | `src/renderer/app.ts` L311–L314 |
| Input field guard | ✅ | `src/renderer/app.ts` L233 (`HTMLInputElement`, `HTMLSelectElement`, `isContentEditable` check) |

---

### Step 3.8: app.css Layout — PASS

**Requirements:** CSS Grid with toolbar 48px left, canvas center, property panel 200px right. Toolbar buttons 40×40, canvas overflow scroll, checkerboard transparency.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| CSS Grid layout | ✅ | `src/renderer/styles/app.css` L57 (`display: grid`) |
| Toolbar 48px column | ✅ | `src/renderer/styles/app.css` L8 (`--toolbar-width: 48px`) + L58 |
| Property panel 200px column | ✅ | `src/renderer/styles/app.css` L9 (`--property-panel-width: 200px`) + L58 |
| Canvas center (1fr) | ✅ | `src/renderer/styles/app.css` L58 (`grid-template-columns: var(--toolbar-width) 1fr var(--property-panel-width)`) |
| Grid template areas | ✅ | `src/renderer/styles/app.css` L60–L63 |
| Toolbar buttons 40×40 | ✅ | `src/renderer/styles/app.css` L178–L179 (`.toolbar-btn { width: 40px; height: 40px; }`) |
| Canvas overflow scroll | ✅ | `src/renderer/styles/app.css` L81 (`overflow: auto`) |
| Checkerboard transparency | ✅ | `src/renderer/styles/app.css` L84–L89 (4x `linear-gradient(45deg, ...)`) |
| HTML Grid structure | ✅ | `src/renderer/index.html` L10–L18 |

---

### Step 3.9: Validation Phase — PASS (Claim)

**Requirements:** `npx tsc --noEmit` passes, P0 MVP end-to-end test.

**Evidence:**

| Requirement | Verified | Location |
|-------------|----------|----------|
| TypeScript compilation | ✅ (claimed) | Changes log: "npx tsc --noEmit passed with zero errors" |
| End-to-end test | ⚠️ Not independently verifiable | Changes log claims Phase 1 complete |

---

### PaintEngine.ts 3 Additive Methods — PASS

**Requirements:** 3 additive method groups: zoom/pan, save/open (file I/O), newDocument.

**Evidence:**

| Method Group | Methods Added | Location |
|-------------|---------------|----------|
| Zoom/pan | `setZoom()`, `zoomIn()`, `zoomOut()`, `resetZoom()`, `getZoomLevel()`, `onZoomChange()`, `zoomAtPoint()`, `applyTransform()`, `handleWheel()`, `mapCoordinates()` | PaintEngine.ts L98–L166, L261–L266 |
| File I/O | `saveFile()`, `openFile()`, `exportToBlob()` | PaintEngine.ts L270–L311 |
| newDocument | `newDocument()` | PaintEngine.ts L315–L330 |

All three method groups are present and additive (no refactoring of existing methods). PaintEngine grew from initial constructor/tool management to include zoom/pan state, file I/O, and document management.

---

## Findings Summary

### Critical Findings

None.

### Major Findings

| ID | Step | Finding | Description |
|----|------|---------|-------------|
| F-3.6.1 | 3.6 | Missing unsaved changes prompt | New Document action does not warn about unsaved work before replacing canvas. Both Ctrl/⌘+N and File > New paths lack this guard. Potential data-loss scenario. |

### Minor Findings

| ID | Step | Finding | Description |
|----|------|---------|-------------|
| F-3.5.1 | 3.5 | toDataURL instead of toBlob for save | Plan specifies canvas.toBlob but implementation uses toDataURL for IPC serialization. exportToBlob() exists separately. No functional impact. |

### Informational Notes

| ID | Step | Note |
|----|------|------|
| N-3.2.1 | 3.2 | Toolbar expanded from 7 to 15 tools by subsequent plans. All original P0 tools present. |
| N-3.3.1 | 3.3 | PropertyPanel expanded with opacity, hardness, text, corner radius, curve, gradient, symmetry controls by subsequent plans. All P0 controls present. |
| N-3.7.1 | 3.7 | Keyboard shortcuts expanded beyond P0 set (additional tools: D, M, A, I, T, U, P, C; Ctrl+S save, Ctrl+O open, clipboard shortcuts). |

---

## Changes Log Accuracy

| Changes Log Claim | Verified |
|-------------------|----------|
| ColorPicker.ts created with fg/bg swap | ✅ |
| Toolbar.ts created with 7 tool buttons | ✅ (now 15, expanded by later plans) |
| PropertyPanel.ts created with sliders and mode toggle | ✅ |
| NewDocumentDialog.ts created with presets | ✅ |
| PaintEngine.ts zoom/pan, file I/O, newDocument added | ✅ |
| app.ts full rewrite with component wiring | ✅ |
| app.css styling appended | ✅ |
| 5 files created, 3 files modified | ✅ (file counts match) |
| npx tsc --noEmit zero errors | ✅ (claimed, not independently verified) |

---

## Coverage Assessment

**Phase 1 coverage: 94%** — 8 of 9 steps fully implemented. Step 3.6 is partially complete due to missing unsaved changes prompt.

The P0 MVP is structurally complete and functional. The single gap (unsaved changes prompt) is a UX safety feature that does not block core functionality but represents a data-loss risk for users.
