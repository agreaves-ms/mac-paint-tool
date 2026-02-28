<!-- markdownlint-disable-file -->

# Icon Distinguishability - Research Document

## Scope

Address two minor review findings from toolbar icons review:
1. Rectangle and RoundedRect icons nearly identical at 18×18px
2. Lasso icon reads as cloud/blob rather than freeform selection

## Evidence

### Finding 1: Rectangle vs RoundedRect

Current SVGs:
- Rectangle: `<rect x="2" y="3" width="12" height="10" rx="0.5"/>`
- RoundedRect: `<rect x="2" y="3" width="12" height="10" rx="3"/>`

At 18×18px rendered size, the difference between rx=0.5 and rx=3 is approximately 1-2 pixels in corner rendering. Users cannot reliably distinguish between these two icons at a quick glance.

### Finding 2: Lasso Icon

Current SVG: Complex cubic Bezier path forming an irregular closed shape with stroke-dasharray="2 2". The resulting shape resembles a cloud or amorphous blob rather than a recognizable freeform selection/lasso loop.

## Selected Approach

### RoundedRect Icon Redesign
- Increase corner radius to rx=4 for maximum visual distinction
- Add a small corner arc indicator in the top-left corner — a small curved L-shape showing the rounded corner concept
- This creates an immediately recognizable "rounded corner" visual cue even at 18px

### Lasso Icon Redesign
- Replace the complex blob with a simpler freeform irregular loop
- Use a hand-drawn-style irregular closed path (not a perfect circle/ellipse)
- Keep stroke-dasharray="2 2" to indicate selection/marching ants
- Add a small "tail" or crossing point to suggest a lasso rope

## Success Criteria
- [ ] RoundedRect icon visually distinct from Rectangle icon at 18×18px
- [ ] Lasso icon recognizable as freeform selection at 18×18px
- [ ] Both icons maintain consistent style (16×16 viewBox, 1.5px stroke, currentColor, round caps)
- [ ] Visual verification via Playwright screenshot
