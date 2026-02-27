<!-- markdownlint-disable-file -->
# Planning Log: Plan 06 — P3 Advanced and Final Validation

## Discrepancy Log

Gaps and differences identified between research findings and the implementation plan. Validated 2026-02-26.

### Unaddressed Research Items

* DR-02 (inherited): HEIF/HEIC, TIFF, PSD, SVG, RAW, OpenEXR, ICO/ICNS format support
  * Source: mac-paint-app-features-research.md — Export format analysis
  * Reason: Beyond scope of a Paint.NET-class application; would require format-specific native libraries
  * Impact: low — PNG, JPEG, WebP cover the vast majority of use cases

* DR-03 (inherited): Animation support with frame timeline
  * Source: mac-paint-app-features-research.md — Animation features
  * Reason: Niche feature requiring significant architecture (frame manager, timeline UI, GIF/APNG encoder); separate investigation warranted
  * Impact: low — paint applications rarely include animation; this is a separate product category

* DR-07 (inherited): Full Color Management (ICC profiles) and HDR
  * Source: mac-paint-app-features-research.md — Color management features
  * Reason: Professional-grade feature requiring color management library and ICC profile parsing; beyond target user segment
  * Impact: low — sRGB is sufficient for target use case

* DR-09 (inherited): Batch Processing
  * Source: mac-paint-app-features-research.md — Batch operations
  * Reason: Beyond scope; would require a separate processing pipeline and progress UI
  * Impact: low — single-file editing is the primary workflow

### Plan Deviations from Research

* None — Plan 06 implements research P3 recommendations directly with no deviations

## Implementation Paths Considered

### Selected: Canvas globalCompositeOperation for blend modes

* Approach: Use the native Canvas 2D API `globalCompositeOperation` property to set blend modes during layer compositing
* Rationale: Native browser-level implementation is GPU-accelerated, zero additional code for the blending math, supports all standard modes out of the box
* Evidence: HTML5 Canvas specification supports multiply, screen, overlay, darken, lighten natively

### IP-01: Manual pixel-by-pixel blending

* Approach: Implement blend mode formulas manually using `getImageData()`/`putImageData()` pixel manipulation
* Trade-offs: Full control over blending math but vastly more complex, slower (JavaScript pixel loop vs native compositing), and no benefit over the native API for standard modes
* Rejection rationale: Native `globalCompositeOperation` provides identical results with zero implementation cost

## Suggested Follow-On Work

Items identified during planning that fall outside current scope.

* WI-01: Animation/frame timeline
  * Requires: Frame manager, timeline UI, onion skinning, GIF/APNG encoder
  * Source: DR-03 — Animation support beyond current scope
  * Priority: low — separate product investigation

* WI-02: Additional export formats (HEIF, TIFF, PSD)
  * Requires: Format-specific encoding libraries (e.g., sharp for HEIF/TIFF, custom PSD writer)
  * Source: DR-02 — Extended format support
  * Priority: medium — user value for interop with other tools

* WI-03: ICC color profiles and HDR support
  * Requires: Color management library, ICC profile parsing, wide-gamut canvas support
  * Source: DR-07 — Professional color management
  * Priority: low — beyond target user segment

* WI-04: Batch processing
  * Requires: Processing pipeline, file queue, progress tracking UI
  * Source: DR-09 — Batch operations
  * Priority: low — separate feature investigation

## User Decisions Requested

* None — Plan 06 can proceed without additional user input
