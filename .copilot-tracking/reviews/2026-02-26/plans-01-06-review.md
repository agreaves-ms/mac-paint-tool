<!-- markdownlint-disable-file -->
# Review Log: Plans 01–06 (Foundation through Advanced)

**Review Date**: 2026-02-26
**Related Plans**:
- `.copilot-tracking/plans/2026-02-26/plan-01-foundation.instructions.md`
- `.copilot-tracking/plans/2026-02-26/plan-02-drawing-tools.instructions.md`
- `.copilot-tracking/plans/2026-02-26/plan-03-mvp-ui.instructions.md`
- `.copilot-tracking/plans/2026-02-26/plan-04-p1-features.instructions.md`
- `.copilot-tracking/plans/2026-02-26/plan-05-layers-power.instructions.md`
- `.copilot-tracking/plans/2026-02-26/plan-06-advanced.instructions.md`

**Changes Logs**:
- `.copilot-tracking/changes/2026-02-26/plan-01-foundation-changes.md`
- `.copilot-tracking/changes/2026-02-26/plan-02-drawing-tools-changes.md`
- `.copilot-tracking/changes/2026-02-26/plan-03-mvp-ui-changes.md`
- `.copilot-tracking/changes/2026-02-26/plan-04-p1-features-changes.md`
- `.copilot-tracking/changes/2026-02-26/plan-05-layers-power-changes.md`
- `.copilot-tracking/changes/2026-02-26/plan-06-advanced-changes.md`

**Research Document**: `.copilot-tracking/research/2026-02-26/mac-paint-app-features-research.md`

## Review Status

- [x] Phase 1: Artifact Discovery
- [x] Phase 2: RPI Validation
- [x] Phase 3: Quality Validation
- [x] Phase 4: Review Completion

## Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| Major    | 5     |
| Minor    | 7     |

---

## RPI Validation Results

### Plan 01 — Foundation (Phases 1–2)
**Status: ✅ Passed**
- All 6 steps verified with 100% coverage
- 0 critical, 0 major, 4 minor findings
- Minor: visual validation deferred, TS version upgrade, Eyedropper enum addition, PaintEngine scope growth
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-01-foundation-001-validation.md`

### Plan 02 — Drawing Tools (Phase 1)
**Status: ✅ Passed**
- All 7 steps verified with 100% coverage
- 0 critical, 0 major, 6 minor findings
- Minor: FloodFill uses DFS pop() (functionally correct), BrushTool has forward-compat features (presets/symmetry/pressure), ShapeTool has extra shapes (roundedRect/polygon), UndoManager has layer-aware undo, shift() eviction O(n) at 50 entries (negligible)
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-02-drawing-tools-001-validation.md`

### Plan 03 — MVP UI (Phase 1)
**Status: ⚠️ Partial** — 8/9 steps pass, 1 step partial
- **Major: Missing unsaved changes prompt** — Step 3.6 specifies "unsaved changes prompt" before New Document. Neither Ctrl+N nor menu path checks for unsaved work. Data loss scenario.
- Minor: saveFile uses toDataURL instead of toBlob (practical IPC choice; exportToBlob exists separately)
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-03-mvp-ui-001-validation.md`

### Plan 04 — P1 Features (Phases 1–2)
**Status: ✅ Passed**
- All 11 steps verified with 100% coverage
- 0 critical, 0 major, 5 minor findings
- Minor: eyedropper color preview tooltip not implemented, cropToSelection has no shortcut, status bar not updated after crop/drag-drop, selection rect sync depends on external calls, JPEG/WebP quality hardcoded at 0.92
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-04-p1-features-001-validation.md`

### Plan 05 — Layers/Power (Phase 1)
**Status: ✅ Passed**
- All 10 steps verified with 100% coverage
- 0 critical, 0 major, 1 minor finding
- Minor: StatusBar inlined in app.ts rather than separate component (functionally equivalent)
- Bonus: delivered blend modes, layer opacity, symmetry, pressure sensitivity beyond P2 scope
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-05-layers-power-001-validation.md`

### Plan 06 — Advanced (Phases 7–8)
**Status: ⚠️ Partial** — 9/11 steps pass, 2 steps have integration gaps
- **Major: BrushEngine + BrushPresetPanel created but NOT wired into app.ts** — custom brush presets/spacing/scatter exist as standalone modules but are unreachable by users
- **Major: CurvesDialog + Adjustments created but NOT wired into app.ts** — curves/levels with histogram, per-channel LUTs, draggable UI exist but have no entry point (no menu/shortcut/button)
- Minor: Symmetry axis overlay dashed lines not implemented (cosmetic — symmetry drawing itself works)
- All code compiles, lint passes, `npm run make` produces distributable
- Validation file: `.copilot-tracking/reviews/rpi/2026-02-26/plan-06-advanced-001-validation.md`

---

## Implementation Quality Findings

**Note:** Initial automated validation read stale/cached source code. All findings were re-validated against actual source files on disk. Original critical findings (IV-001, IV-002, IV-013) and several major findings (IV-003, IV-004, IV-007, IV-008, IV-012) were **invalidated** — the actual implementations correctly address these concerns:
- UndoManager IS layer-aware with `layerId` per entry and `resolveCtx` callback
- `getContext()` IS layer-aware — returns active layer context when LayerManager exists
- Tools use `getCanvasCoords(e, ctx.canvas)` with NO circular PaintEngine dependency
- BrushTool saves/restores `ctx.globalAlpha` around all drawing operations
- Menu undo/redo IPC IS wired in app.ts via `onMenuUndo`/`onMenuRedo`
- ColorSelection uses pre-computed Path2D for efficient boundary rendering

### Corrected Findings

**Major:**

1. **Missing unsaved changes prompt** — `newDocument()` and `openFile()` don't check for unsaved work before clearing canvas. Data loss scenario. (Source: RPI Plan 03)

2. **Unwired BrushEngine + BrushPresetPanel** — Code exists at `src/renderer/tools/BrushEngine.ts` and `src/renderer/ui/BrushPresetPanel.ts` but neither is imported or instantiated in `app.ts`. Custom brush presets are unreachable. (Source: RPI Plan 06, changes log disclosure)

3. **Unwired CurvesDialog + Adjustments** — Code exists at `src/renderer/canvas/Adjustments.ts` and `src/renderer/ui/CurvesDialog.ts` but no menu item, keyboard shortcut, or button invokes them. (Source: RPI Plan 06, changes log disclosure)

4. **openFile() lacks undo save and error handling** — `PaintEngine.openFile()` clears the active layer context and draws the image but doesn't save undo state first. No `img.onerror` handler. If file load fails after clear, user data is lost with no recovery path. (Source: actual code review)

5. **Blend modes not visually applied during editing** — `LayerManager.setBlendMode()` stores the blend mode property but never sets `canvas.style.mixBlendMode` on the layer canvas element. Blend modes only take effect during `flattenAll()`, `mergeDown()`, and `getExportCanvas()` — not during live editing with stacked DOM canvases. Users see no visual change when switching blend modes. (Source: actual code review, `LayerManager.ts` lines 153-159)

**Minor:**

1. **Preload IPC listeners leak event objects** — `ipcRenderer.on(channel, callback)` passes callbacks directly without stripping the `IpcRendererEvent` parameter. No cleanup/removeListener API exposed. Listener accumulation possible on repeated calls. (`preload.ts`)

2. **No file size validation on open** — Main process `fs.readFileSync(filePath)` reads entire file without size check. Base64 encoding increases size ~33%. A very large file could cause OOM. (`main.ts`)

3. **EraserTool compositeOperation restoration fragile** — Sets `destination-out` in `onPointerDown` and restores `source-over` in `onPointerUp`. If pointer capture is lost (window blur, browser error), restoration never fires. Subsequent draws from any tool would erase instead of draw. (`EraserTool.ts`)

4. **openFile() async image load** — `openFile()` awaits IPC but image loading via `img.onload` is deferred. The method completes before the image renders, creating a brief window for user interaction during load.

5. **FillTool hexToRgba limited** — Only handles 6-digit hex. Not currently the primary path (app.ts sets `fillColor` directly as `{r,g,b,a}`), but the helper exists and would fail for shorthand hex.

6. **JPEG/WebP quality hardcoded** — Export quality fixed at 0.92 in `PaintEngine.saveFile()`. No quality slider in save dialog.

7. **Symmetry axis overlay not implemented** — Symmetry drawing works correctly with mirrored/rotated points, but no dashed overlay lines show the axis positions. (Cosmetic)

---

## Validation Command Results

| Command | Status | Details |
|---------|--------|---------|
| `npx tsc --noEmit` | ✅ Pass | 0 errors |
| `npm run lint` | ✅ Pass | 0 errors, 47 warnings (non-null assertions — standard for DOM apps) |
| `npm run make` | ✅ Pass | Produces `out/make/zip/darwin/arm64/Mac Paint-darwin-arm64-1.0.0.zip` (106MB) |
| IDE diagnostics | ✅ Pass | No compile or lint errors detected |

---

## Missing Work and Deviations

### Unwired Features (implemented but not accessible)
- BrushEngine stamp-based rendering with spacing/scatter/jitter/rotation
- BrushPresetPanel with save/load/delete from localStorage
- CurvesDialog with draggable curve editor and histogram
- Adjustments module with curves/levels/LUT operations

### Deviations from Plan
- SelectionTool registered as `marquee` (M) instead of overriding `selection` (W) — avoids namespace conflict with ColorSelection tool
- StatusBar inlined in app.ts + HTML rather than separate component
- Blend modes stored but not applied via CSS mix-blend-mode for live rendering

### Missing Plan Requirements
- Unsaved changes prompt before New Document (Plan 03, Step 3.6)
- Undo state save before file open (not in plan but expected for correctness)

---

## Follow-Up Recommendations

### Deferred from Scope (changes log disclosures)
1. Wire BrushPresetPanel + BrushEngine into app.ts with container element and keyboard shortcut
2. Wire CurvesDialog into app.ts with menu item or keyboard shortcut (e.g., Ctrl+M or Ctrl+L)
3. Implement symmetry axis overlay dashed lines on overlay canvas

### Discovered During Review
4. Implement unsaved changes tracking (dirty flag on canvas modification) and confirmation dialog before `newDocument()` and `openFile()`
5. Add `img.onerror` handler in `openFile()` to handle corrupt files gracefully
6. Save undo state before `openFile()` clears the canvas
7. Apply blend modes as CSS `mix-blend-mode` on layer canvas elements for live rendering
8. Wrap preload IPC `on` callbacks to strip IpcRendererEvent and expose removeListener API
9. Add file size validation in main process open-file handler (reject files > 50MB)

---

## Overall Status

**⚠️ Needs Rework**

All 6 plans have all steps marked complete. TypeScript compiles cleanly, lint passes, and `npm run make` produces a distributable app. The core architecture is sound: layer-aware undo, layer-aware context routing, PointerEvent throughout, correct FloodFill algorithm, proper IPC isolation. 36 source files across tools/, canvas/, ui/, and Electron main/preload.

However, 5 major findings require attention:
- 2 fully implemented features (BrushEngine/Presets, Curves/Levels) are unreachable — just need wiring
- 1 data-safety gap (unsaved changes prompt missing)
- 1 file-operation correctness issue (no undo save or error handling on open)
- 1 layer rendering gap (blend modes stored but not visually applied)

No critical findings. All major findings are fixable without architectural changes.
