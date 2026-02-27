# Cross-Reference Validation Report

## Research Topics

- Validate `Details:` line references in 6 plan files against details files
- Verify step heading alignment at referenced line ranges
- Check predecessor dependency chain correctness
- Verify log file DR-/DD- item references

## Status: Complete

---

## Plan 01 — Foundation and Canvas Engine

### Step Count: 6/6 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 1.1 | Lines 12-45 | Line 12 | `### Step 1.1: Bootstrap Electron + Vite + TypeScript project` | ✅ |
| 1.2 | Lines 47-96 | Line 47 | `### Step 1.2: Configure project structure` | ✅ |
| 1.3 | Lines 98-131 | Line 98 | `### Step 1.3: Set up main HTML layout` | ✅ |
| 1.4 | Lines 133-148 | Line 133 | `### Step 1.4: Validate scaffold` | ✅ |
| 2.1 | Lines 154-250 | Line 154 | `### Step 2.1: Implement PaintEngine.ts` | ✅ |
| 2.2 | Lines 252-310 | Line 252 | `### Step 2.2: Implement Tool interface with lineWidth property` | ✅ |

- **Line reference accuracy**: All 6/6 correct — start lines match exactly
- **Range overlaps**: None — ranges are contiguous with expected gaps for phase headers/blank lines
- **Dependency chain**: CORRECT — "No predecessor plan — this is the first plan in the dependency chain"
- **Log items**: DD-01 (inherited phase structure) — valid, properly categorized as Implementation Deviation

---

## Plan 02 — P0 Core Drawing Tools

### Step Count: 7/7 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 2.3 | Lines 13-47 | Line 13 | `### Step 2.3: Implement BrushTool.ts` | ✅ |
| 2.4 | Lines 48-72 | Line 48 | `### Step 2.4: Implement EraserTool.ts` | ✅ |
| 2.5 | Lines 73-106 | Line 73 | `### Step 2.5: Implement ShapeTool.ts` | ✅ |
| 2.6 | Lines 107-176 | Line 107 | `### Step 2.6: Implement FloodFill.ts and FillTool.ts` | ✅ |
| 2.7 | Lines 177-215 | Line 177 | `### Step 2.7: Implement ColorSelection.ts` | ✅ |
| 2.8 | Lines 216-245 | Line 216 | `### Step 2.8: Implement UndoManager.ts` | ✅ |
| 2.9 | Lines 246-260 | Line 246 | `### Step 2.9: Validate Phase 2` | ✅ |

- **Line reference accuracy**: All 7/7 correct
- **Dependency chain**: CORRECT — "Plan 01 completion" (PaintEngine.ts and Tool interface)
- **Log items**: DR-06 (Euclidean RGB distance) — valid; also referenced in plan objectives as "per DR-06" and in details as "DD-06 (DR-06)"
- **Minor note**: Details file calls it "DD-06 (DR-06)" while log says "DR-06 (inherited)" — these are cross-referencing the same item using different prefixes (DD = design decision explaining the DR = discrepancy record). Consistent in meaning.

---

## Plan 03 — P0 MVP UI, File I/O and Polish

### Step Count: 9/9 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 3.1 | Lines 12-37 | Line 12 | `### Step 3.1: Implement ColorPicker.ts` | ✅ |
| 3.2 | Lines 38-64 | Line 38 | `### Step 3.2: Implement Toolbar.ts` | ✅ |
| 3.3 | Lines 65-109 | Line 65 | `### Step 3.3: Implement PropertyPanel.ts` | ✅ |
| 3.4 | Lines 110-137 | Line 110 | `### Step 3.4: Implement zoom/pan` | ✅ |
| 3.5 | Lines 138-214 | Line 138 | `### Step 3.5: Implement file I/O` | ✅ |
| 3.6 | Lines 215-242 | Line 215 | `### Step 3.6: Implement New Document action` | ✅ |
| 3.7 | Lines 243-291 | Line 243 | `### Step 3.7: Implement keyboard shortcuts` | ✅ |
| 3.8 | Lines 292-316 | Line 292 | `### Step 3.8: Implement app.css` | ✅ |
| 3.9 | Lines 317-343 | Line 317 | `### Step 3.9: Validate Phase 3 — Complete P0 MVP` | ✅ |

- **Line reference accuracy**: All 9/9 correct
- **Dependency chain**: CORRECT — "Plan 02 completion" (all P0 drawing tools)
- **Log items**: DR-10 (RESOLVED, New Document), DD-01 (inherited) — valid, properly tracked

---

## Plan 04 — P1 Features: Content and Canvas

### Step Count: 11/11 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 4.1 | Lines 12-49 | Line 12 | `### Step 4.1: Implement rectangular marquee selection` | ✅ |
| 4.2 | Lines 50-75 | Line 50 | `### Step 4.2: Implement eyedropper tool` | ✅ |
| 4.3 | Lines 76-110 | Line 76 | `### Step 4.3: Implement text tool` | ✅ |
| 4.4 | Lines 111-150 | Line 111 | `### Step 4.4: Implement clipboard integration` | ✅ |
| 4.5 | Lines 151-167 | Line 151 | `### Step 4.5: Validate Phase 1` | ✅ |
| 5.1 | Lines 172-209 | Line 172 | `### Step 5.1: Implement canvas resize/crop` | ✅ |
| 5.2 | Lines 210-253 | Line 210 | `### Step 5.2: Implement export formats` | ✅ |
| 5.3 | Lines 254-296 | Line 254 | `### Step 5.3: Implement drag-and-drop` | ✅ |
| 5.4 | Lines 297-330 | Line 297 | `### Step 5.4: Implement additional shapes` | ✅ |
| 5.5 | Lines 331-375 | Line 331 | `### Step 5.5: Implement curve/Bézier tool` | ✅ |
| 5.6 | Lines 376-394 | Line 376 | `### Step 5.6: Validate Phase 2` | ✅ |

- **Line reference accuracy**: All 11/11 correct
- **Range gap**: Lines 168-171 between Step 4.5 and Step 5.1 — valid (Phase 2 section header)
- **Dependency chain**: CORRECT — "Plan 03 completion" (UI components, file I/O, keyboard shortcuts)
- **Log items**: DR-04 (Bézier SVG deferred), DR-08 (advanced selection deferred), DD-02 (sequential phases), DD-03 (shared PaintEngine.ts) — all valid and properly categorized

---

## Plan 05 — P2 Power: Layers and Effects

### Step Count: 10/10 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 6.1 | Lines 12-56 | Line 12 | `### Step 6.1: Implement layer system` | ✅ |
| 6.2 | Lines 57-81 | Line 57 | `### Step 6.2: Implement lasso selection` | ✅ |
| 6.3 | Lines 82-106 | Line 82 | `### Step 6.3: Implement gradient tool` | ✅ |
| 6.4 | Lines 107-131 | Line 107 | `### Step 6.4: Implement brush presets` | ✅ |
| 6.5 | Lines 132-175 | Line 132 | `### Step 6.5: Implement image filters` | ✅ |
| 6.6 | Lines 176-201 | Line 176 | `### Step 6.6: Implement transform tools` | ✅ |
| 6.7 | Lines 202-223 | Line 202 | `### Step 6.7: Implement transparency support` | ✅ |
| 6.8 | Lines 224-252 | Line 224 | `### Step 6.8: Implement dark mode` | ✅ |
| 6.9 | Lines 253-280 | Line 253 | `### Step 6.9: Implement grid overlay and status bar` | ✅ |
| 6.10 | Lines 281-302 | Line 281 | `### Step 6.10: Validate Phase 6` | ✅ |

- **Line reference accuracy**: All 10/10 correct
- **Dependency chain**: CORRECT — "Plan 04 completion" (all P1 features and 5 PaintEngine.ts additive methods)
- **Log items**: DR-01 (native .paintdoc deferred), DR-05 (non-destructive filters deferred), DD-01 (inherited) — valid

---

## Plan 06 — P3 Advanced and Final Validation

### Step Count: 11/11 CORRECT

| Step | Plan Reference | Actual Line | Heading Found | Match |
|------|---------------|-------------|---------------|-------|
| 1.1 | Lines 12-40 | Line 12 | `### Step 1.1: Implement blend modes` | ✅ |
| 1.2 | Lines 42-66 | Line 42 | `### Step 1.2: Implement layer opacity` | ✅ |
| 1.3 | Lines 68-97 | Line 68 | `### Step 1.3: Implement pressure sensitivity` | ✅ |
| 1.4 | Lines 99-132 | Line 99 | `### Step 1.4: Implement custom brush engine` | ✅ |
| 1.5 | Lines 134-173 | Line 134 | `### Step 1.5: Implement curves/levels` | ✅ |
| 1.6 | Lines 175-210 | Line 175 | `### Step 1.6: Implement symmetry drawing` | ✅ |
| 1.7 | Lines 212-222 | Line 212 | `### Step 1.7: Validate Phase 1` | ✅ |
| 2.1 | Lines 228-237 | Line 228 | `### Step 2.1: Run full project validation` | ✅ |
| 2.2 | Lines 239-241 | Line 239 | `### Step 2.2: Fix minor validation issues` | ✅ |
| 2.3 | Lines 243-269 | Line 243 | `### Step 2.3: End-to-end functional testing` | ✅ |
| 2.4 | Lines 271-278 | Line 271 | `### Step 2.4: Report blocking issues` | ✅ |

- **Line reference accuracy**: All 11/11 correct
- **Dependency chain**: CORRECT — "Plan 05 completion" (layer system must exist)
- **Log items**: DR-02 (additional formats), DR-03 (animation), DR-07 (ICC/HDR), DR-09 (batch processing) — all valid
- **⚠️ ISSUE: Step Numbering** — See Issues section below

---

## Overall Summary

### Total Step Count

| Plan | Expected | Actual | Status |
|------|----------|--------|--------|
| Plan 01 | 6 steps (1.1-1.4, 2.1-2.2) | 6 steps (1.1-1.4, 2.1-2.2) | ✅ |
| Plan 02 | 7 steps (2.3-2.9) | 7 steps (2.3-2.9) | ✅ |
| Plan 03 | 9 steps (3.1-3.9) | 9 steps (3.1-3.9) | ✅ |
| Plan 04 | 11 steps (4.1-4.5, 5.1-5.6) | 11 steps (4.1-4.5, 5.1-5.6) | ✅ |
| Plan 05 | 10 steps (6.1-6.10) | 10 steps (6.1-6.10) | ✅ |
| Plan 06 | 11 steps (7.1-7.7, 8.1-8.4) | 11 steps (1.1-1.7, 2.1-2.4) | ⚠️ numbering |
| **Total** | **54** | **54** | ✅ |

### Line Reference Accuracy: 54/54 (100%)

Every `Details:` line reference in every plan file points to the exact line where the corresponding `### Step X.X:` heading begins in the details file. Zero mismatches.

### Dependency Chain: All 6 Correct

```
Plan 01 (none) → Plan 02 (Plan 01) → Plan 03 (Plan 02) → Plan 04 (Plan 03) → Plan 05 (Plan 04) → Plan 06 (Plan 05)
```

### DR/DD Log References: All Valid

Each log file properly categorizes discrepancy records (DR-) and design decisions (DD-) with source references. All DR/DD items referenced in plan and details files have corresponding entries in the log files.

### Step Coverage Analysis

- **Global step sequence**: 1.1→6.10 (Plans 01-05) + 1.1→2.4 (Plan 06 local numbering)
- **No duplicate step numbers across Plans 01-05**: Steps 1.1-6.10 are unique
- **Plan 06 duplicate**: Steps 1.1-1.4 and 2.1-2.2 conflict with Plan 01's numbering
- **No coverage gaps within Plans 01-05**: 1.1-1.4, 2.1-2.9, 3.1-3.9, 4.1-4.5, 5.1-5.6, 6.1-6.10

---

## Issues Found

### Issue 1 (Medium): Plan 06 Step Numbering Uses Local Instead of Global Convention

**Files affected:**

- `plan-06-advanced.instructions.md` — Steps labeled 1.1-1.7, 2.1-2.4
- `plan-06-advanced-details.md` — Step headings labeled 1.1-1.7, 2.1-2.4

**Problem:** Plans 01-05 use a globally sequential step numbering scheme:

- Plan 01: 1.1-1.4, 2.1-2.2 (Phases 1-2)
- Plan 02: 2.3-2.9 (continues Phase 2)
- Plan 03: 3.1-3.9 (Phase 3)
- Plan 04: 4.1-4.5, 5.1-5.6 (Phases 4-5)
- Plan 05: 6.1-6.10 (Phase 6)
- Plan 06: **1.1-1.7, 2.1-2.4** ← Resets to local numbering

Expected for Plan 06: **7.1-7.7, 8.1-8.4** (continuing Phases 7-8)

**Impact:** Step numbers 1.1-1.4 and 2.1-2.2 collide with Plan 01's steps. When referencing steps across plans, "Step 1.1" is ambiguous (Plan 01 bootstrap or Plan 06 blend modes?).

**Fix:** Renumber Plan 06 steps in both the plan file and details file:

- Phase 1 steps: 1.1→7.1, 1.2→7.2, 1.3→7.3, 1.4→7.4, 1.5→7.5, 1.6→7.6, 1.7→7.7
- Phase 2 steps: 2.1→8.1, 2.2→8.2, 2.3→8.3, 2.4→8.4
- Phase labels: "Phase 1"→"Phase 7", "Phase 2"→"Phase 8"

---

## Clarifying Questions

None — all validation could be completed through file analysis.
