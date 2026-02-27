<!-- markdownlint-disable-file -->

# Toolbar SVG Icons - Implementation Plan

## Overview and Objectives

Replace all 15 Unicode/emoji toolbar icons with consistent inline SVG icons in a 1990s Mac-classic style.

### User Requirements
1. Make better icons for each of the buttons
2. Make sure the icons have a consistent style
3. Use Playwright MCP tools to verify how they look and if they represent what they do

### Derived Objectives
- Replace `btn.textContent` with `btn.innerHTML` for SVG rendering
- Design 15 SVG icons with consistent viewBox (16×16), stroke (1.5px), and style
- Add CSS rules for SVG sizing within toolbar buttons
- Verify via Playwright MCP screenshots

## Context Summary

- Research: `.copilot-tracking/research/2026-02-27/toolbar-icons-research.md`
- Subagent research: `.copilot-tracking/research/subagents/2026-02-27/toolbar-implementation.md`
- Instructions: `.github/copilot-instructions.md` (project conventions)

## Implementation Checklist

### Phase 1: SVG Icon Implementation <!-- parallelizable: false -->
- [ ] Update `TOOLS` array in `Toolbar.ts` with inline SVG icon strings for all 15 tools
- [ ] Change `btn.textContent = tool.icon` to `btn.innerHTML = tool.icon` in `render()` method
- [ ] Add CSS rules for `.toolbar-btn svg` sizing (width/height 18px)

### Phase 2: Visual Verification <!-- parallelizable: false -->
- [ ] Start standalone Vite dev server
- [ ] Navigate Playwright MCP to app
- [ ] Take screenshot and verify all 15 icons render correctly
- [ ] Verify icons are recognizable at toolbar button size
- [ ] Verify active state (white on blue) works with SVG icons

## Dependencies
- No external dependencies needed

## Success Criteria
1. All 15 icons render as SVGs in the toolbar
2. Consistent visual style across all icons
3. Icons recognizable at 40×40px button size
4. Theme support (dark/light/active) works via currentColor
5. Playwright screenshots confirm visual quality
