<!-- markdownlint-disable-file -->

# Icon Distinguishability - Changes Log

## Related Plan

`.copilot-tracking/plans/2026-02-27/icon-distinguishability-plan.instructions.md`

## Implementation Date

2026-02-27

## Summary of Changes

Redesigned RoundedRect and Lasso tool icons in the toolbar for better distinguishability at small rendered sizes.

## Changes by Category

### Modified

- `src/renderer/ui/Toolbar.ts`
  - **RoundedRect icon**: Increased corner radius from rx=3 to rx=4; added inner corner arc indicator path in top-left corner to emphasize rounded-corner concept
  - **Lasso icon**: Replaced complex blob/cloud Bezier path with simpler freeform open curve (dashed stroke) and added solid anchor dot at the bottom — reads as freeform selection rather than amorphous shape

## Additional Changes

None.

## Release Summary

Two toolbar icons improved for better visual distinction at 18×18px rendered size. Rectangle and RoundedRect are now clearly distinguishable. Lasso reads as a freeform selection tool rather than a cloud shape.
