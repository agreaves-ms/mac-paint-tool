<!-- markdownlint-disable-file -->

# Icon Distinguishability - Implementation Plan

## Overview

Address two minor review findings from the toolbar icons review to improve icon distinguishability at small rendered sizes.

## Objectives

1. Make RoundedRect icon visually distinct from Rectangle icon at 18×18px
2. Make Lasso icon recognizable as freeform selection rather than cloud/blob

## Context Summary

- Instructions: `.github/copilot-instructions.md`
- Research: `.copilot-tracking/research/2026-02-27/icon-distinguishability-research.md`
- Review finding source: `.copilot-tracking/reviews/2026-02-27/toolbar-icons-review.md` (Findings 2 and 3)

## Implementation Checklist

### [x] Phase 1: Redesign RoundedRect and Lasso Icons
<!-- parallelizable: false -->

- [ ] Step 1.1: Replace RoundedRect SVG in `src/renderer/ui/Toolbar.ts` line 23 — increase rx to 4, add inner corner arc indicator
- [ ] Step 1.2: Replace Lasso SVG in `src/renderer/ui/Toolbar.ts` line 17 — redesign as irregular freeform loop with dashed stroke
- [ ] Step 1.3: Visual verification via Playwright MCP screenshot

## Dependencies

- None — self-contained SVG changes in Toolbar.ts

## Success Criteria

- RoundedRect and Rectangle icons distinguishable at a quick glance at 18×18px
- Lasso icon reads as freeform selection loop, not cloud/blob
- Consistent SVG style maintained (viewBox, stroke width, color)
- No TypeScript errors
