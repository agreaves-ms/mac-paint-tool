# Paint App Feature Ranking and User Priority Analysis

> **Status:** Complete
> **Date:** 2026-02-26
> **Scope:** Feature ranking framework for a new Mac paint application

---

## Research Topics

- Minimum viable features for a functional paint app
- User priority analysis (frequency, expectations, differentiators)
- Feature ranking framework (P0–P3)
- Implementation phasing for incremental delivery
- Mac-specific priorities and native framework leverage

---

## 1. Minimum Viable Paint App

Based on analysis of MacPaint (1984), Microsoft Paint, and the Wikipedia "Common Features" list for raster graphics editors, the absolute minimum features for a functional paint app are:

| Feature | Justification |
|---|---|
| **Canvas** | A drawable surface with configurable dimensions; the fundamental element |
| **Freehand Brush/Pencil** | The core drawing tool — every paint app since MacPaint (1984) includes this |
| **Eraser** | Users need to correct mistakes directly on the canvas |
| **Color Picker** | Minimum: a palette of basic colors; ideally a full RGB/HSV picker with eyedropper |
| **Undo / Redo** | MS Paint originally had 3 undos; Windows 7 expanded to 50. Users consider this mandatory |
| **File Open / Save** | Must open and save at least PNG and JPEG; BMP optional |
| **New / Clear Canvas** | Ability to start fresh |

Without all seven of these, the application is not a paint app — it is a demo.

### Evidence

- **MacPaint (1984):** Canvas, freehand brush, eraser, pattern fills, lasso selection, shapes, text, FatBits zoom, undo. Set the template for all future paint apps.
- **Microsoft Paint:** Pencil, brush, eraser, color palette, shapes, text, fill, undo. Has been the baseline "paint app" for 40 years.
- **Wikipedia Common Features list:** Select, brush, fill, color picker, text, layers, filters, file format conversion.

---

## 2. User Priority Analysis

### 2.1 Frequency of Use (Daily vs. Occasional)

| Tier | Features | Usage Pattern |
|---|---|---|
| **Constant** | Brush/pencil, color selection, undo/redo, zoom/pan | Used on every stroke or action |
| **Frequent** | Eraser, selection tools, fill/bucket, shapes | Used in most sessions |
| **Moderate** | Text, layers, crop/resize, eyedropper | Used in many sessions but not every action |
| **Occasional** | Filters/effects, gradients, blend modes, export options | Used for finishing or specific tasks |
| **Rare** | Color management, scripting, batch processing, plugins | Power-user or professional workflows |

### 2.2 User Expectations (What ANY Paint App Must Have)

Based on the ubiquity of these features across 80+ raster editors surveyed on Wikipedia, and the 40-year legacy of Microsoft Paint and MacPaint:

1. **Freehand drawing** — Pencil and/or brush with adjustable size and color
2. **Shapes** — Rectangle, ellipse, line, arrow at minimum
3. **Fill tool** — Flood fill with a selected color
4. **Color selection** — Color palette, custom color dialog, eyedropper
5. **Text tool** — Add text with font/size/color selection
6. **Selection tools** — Rectangular selection, move, copy, paste
7. **Eraser** — Remove drawn content
8. **Undo/Redo** — At least 20+ levels (modern expectation)
9. **Zoom** — Magnification for detail work (MacPaint's FatBits pioneered this in 1984)
10. **File I/O** — Open/save common formats (PNG, JPEG, BMP, TIFF)

### 2.3 Differentiation Features (What Makes a Paint App Stand Out)

Features that move an app from "basic" to "powerful but simple":

| Feature | Impact | Examples |
|---|---|---|
| **Layers** | Transforms workflow; enables non-destructive composition | Pixelmator Pro, GIMP, Photoshop, Paint.NET |
| **Pressure sensitivity** | Natural drawing feel with stylus/trackpad | Procreate, Krita, Corel Painter |
| **Custom/realistic brushes** | MS Paint Win7 added "artistic brushes" — oil, watercolor, crayon | Krita, MyPaint, Procreate |
| **Non-destructive editing** | Filters as adjustable layers, not baked changes | Pixelmator Pro, Affinity Photo |
| **Smart selection** (magic wand, auto-select) | Dramatically speeds up editing workflows | Every mid-tier+ editor |
| **Snapping and alignment** | Precision for design use cases | Pixelmator Pro, Photoshop |
| **Keyboard shortcuts** | Power users expect them; dramatically increases productivity | Universal expectation |
| **Dark mode** | Modern UX expectation on macOS | MS Paint (Win11), Pixelmator Pro |

### 2.4 Satisfaction-to-Implementation-Effort Ratio

Features ranked by how much user value they deliver relative to engineering cost on macOS:

| Rank | Feature | Effort | Value | Ratio | Notes |
|---|---|---|---|---|---|
| 1 | Undo/Redo | Low | Very High | ★★★★★ | UndoManager built into AppKit |
| 2 | Zoom/Pan | Low | Very High | ★★★★★ | NSScrollView + magnification built-in |
| 3 | Export (PNG/JPEG/TIFF) | Low | High | ★★★★★ | ImageIO framework handles this natively |
| 4 | Color Picker | Low | Very High | ★★★★☆ | NSColorPanel is built into macOS |
| 5 | Keyboard Shortcuts | Low | High | ★★★★☆ | First-class AppKit support |
| 6 | Dark Mode | Low | Moderate | ★★★★☆ | Automatic with proper AppKit usage |
| 7 | Basic Shapes | Medium | High | ★★★★☆ | NSBezierPath / Core Graphics |
| 8 | Eyedropper | Low | Moderate | ★★★★☆ | NSColorSampler API on macOS |
| 9 | Fill Tool | Medium | High | ★★★☆☆ | Flood fill algorithm; moderate complexity |
| 10 | Selection Tools | Medium | High | ★★★☆☆ | Rectangular easy; lasso/magic wand harder |
| 11 | Text Tool | Medium | Moderate | ★★★☆☆ | Core Text + NSFont; layout is tricky |
| 12 | Layers | High | Very High | ★★★☆☆ | Significant architecture; very high payoff |
| 13 | Pressure Sensitivity | Medium | High | ★★★☆☆ | NSEvent pressure/tilt on trackpad; Apple Pencil via PencilKit |
| 14 | Custom Brushes | High | High | ★★☆☆☆ | Brush engine is significant engineering |
| 15 | Filters/Effects | Medium-High | Moderate | ★★☆☆☆ | Core Image has 200+ built-in filters |
| 16 | Non-destructive Edits | Very High | High | ★★☆☆☆ | Requires layer-based filter architecture |

---

## 3. Feature Ranking Framework

### P0 — Must-Have (Without these, it is not a paint app)

| # | Feature | Description |
|---|---|---|
| 1 | Canvas | Configurable-size drawing surface with scroll/pan |
| 2 | Brush/Pencil Tool | Freehand drawing with adjustable size and color |
| 3 | Eraser Tool | Remove drawn content from the canvas |
| 4 | Color Picker | Color palette + custom color selection (NSColorPanel) |
| 5 | Undo / Redo | Multi-level undo (20+ levels minimum) |
| 6 | File Open / Save | Open and save PNG, JPEG; New canvas creation |
| 7 | Zoom / Pan | Magnification and scrolling for detail work |
| 8 | Basic Shapes | Line, rectangle, ellipse with stroke/fill |

### P1 — Should-Have (Expected by most users; high impact)

| # | Feature | Description |
|---|---|---|
| 9 | Fill (Bucket) Tool | Flood fill a region with selected color |
| 10 | Selection Tools | Rectangular marquee select, move, copy, paste |
| 11 | Eyedropper Tool | Pick color from canvas |
| 12 | Text Tool | Add text with font, size, and color |
| 13 | Line Width Control | Adjustable stroke width for brush and shapes |
| 14 | Clipboard Integration | Copy/paste to/from system clipboard (images) |
| 15 | Keyboard Shortcuts | Standard shortcuts for all tools and actions |
| 16 | Canvas Resize / Crop | Change canvas dimensions and crop to selection |
| 17 | Export Formats | Export to PNG, JPEG, TIFF, BMP, PDF, HEIC |
| 18 | Drag and Drop | Open images by dragging into the window |

### P2 — Nice-to-Have (Delighters; power-user features)

| # | Feature | Description |
|---|---|---|
| 19 | Layers | Multiple layers with visibility, opacity, reordering |
| 20 | Lasso / Free Selection | Freeform selection for irregular regions |
| 21 | Magic Wand | Auto-select contiguous areas by color similarity |
| 22 | Gradient Tool | Linear and radial gradient fills |
| 23 | Brush Customization | Size, opacity, hardness presets; custom brush shapes |
| 24 | Image Filters | Blur, sharpen, brightness/contrast, color adjustments |
| 25 | Transform Tools | Rotate, flip, scale, skew selection or layer |
| 26 | Grid / Snap | Grid overlay and snapping for pixel-perfect work |
| 27 | Transparency Support | Alpha channel editing and transparent PNG export |
| 28 | Dark Mode | Native macOS dark/light appearance support |
| 29 | Recent Files | Quick access to recently opened/saved files |
| 30 | Rulers / Guides | Measurement rulers along canvas edges |

### P3 — Future (Advanced features for later phases)

| # | Feature | Description |
|---|---|---|
| 31 | Blend Modes | Layer blend modes (multiply, screen, overlay, etc.) |
| 32 | Layer Effects | Drop shadow, stroke, inner glow on layers |
| 33 | Pressure Sensitivity | Trackpad force / Apple Pencil pressure for brush dynamics |
| 34 | Custom Brush Engine | User-defined brush textures, dynamics, spacing |
| 35 | Non-destructive Filters | Adjustable filter layers that can be modified later |
| 36 | Curves / Levels | Advanced color correction tools |
| 37 | Pen / Path Tool | Bezier path drawing and editing |
| 38 | Plugin / Extension API | Allow third-party filters and tools |
| 39 | Batch Processing | Apply operations to multiple files |
| 40 | Vector Shape Layers | Resizable vector shapes (like Pixelmator Pro) |
| 41 | AI Features | Background removal, subject selection, content-aware fill |
| 42 | Animation Support | Simple frame-based animation (GIF/APNG export) |
| 43 | Scripting | AppleScript / Shortcuts integration |

---

## 4. Implementation Phasing

### Phase 1 — Minimum Viable Product (P0)

**Goal:** A functional paint app that can draw, erase, save, and load.

| Deliverable | Details |
|---|---|
| Canvas view | NSView-based drawing surface with configurable size |
| Brush tool | Freehand drawing with Core Graphics; adjustable color and size |
| Eraser tool | Erases to background color (white) |
| Shape tools | Line, rectangle, ellipse with stroke color and fill |
| Color picker | Integrated NSColorPanel with palette strip in toolbar |
| Undo / Redo | NSUndoManager integration; 50+ levels |
| File I/O | Open PNG/JPEG; Save As PNG/JPEG; New canvas dialog |
| Zoom / Pan | Scroll view with pinch-to-zoom and zoom controls |
| Toolbar | Tool palette sidebar or toolbar with tool icons |

**Architecture:** Single-canvas, single-layer bitmap model. `NSBitmapImageRep` backing store. Core Graphics for all drawing operations.

### Phase 2 — Expected Functionality (P1)

**Goal:** Feature-complete basic paint app meeting user expectations.

| Deliverable | Details |
|---|---|
| Fill tool | Flood fill with tolerance control |
| Selection tools | Rectangular marquee; move, copy, paste selected area |
| Eyedropper | Click canvas to sample color |
| Text tool | Place text on canvas with system font picker |
| Line width | Slider for brush and shape stroke width |
| Clipboard | Copy/paste images to/from system clipboard |
| Keyboard shortcuts | Full set: ⌘Z, ⌘C, ⌘V, tool keys (B, E, T, etc.) |
| Canvas resize | Dialog for canvas dimensions; crop to selection |
| Export | NSDocument Save panel with format selection (PNG, JPEG, TIFF, PDF, HEIC) |
| Drag and drop | Accept dragged images into the canvas |

### Phase 3 — Power Features (P2)

**Goal:** Differentiate from basic paint apps; attract regular users.

| Deliverable | Details |
|---|---|
| Layers | Layer panel UI; add/remove/reorder layers; opacity and visibility per layer |
| Free selection | Lasso tool for freeform selections |
| Magic wand | Color-similarity auto selection with tolerance |
| Gradient tool | Linear and radial gradients with two-color stops |
| Brush presets | Predefined brush sizes and styles; softness/hardness |
| Basic filters | Blur, sharpen, brightness/contrast via Core Image |
| Transform | Rotate, flip horizontal/vertical, scale |
| Transparency | Alpha channel support; checkerboard background display |
| Dark mode | NSAppearance integration (likely automatic from Phase 1) |
| Grid overlay | Toggleable pixel grid at high zoom levels |

### Phase 4 — Advanced & AI (P3)

**Goal:** Professional-grade features; AI-powered tools.

| Deliverable | Details |
|---|---|
| Blend modes | Per-layer blend mode selection |
| Layer effects | Drop shadow, outer glow, stroke |
| Pressure dynamics | NSEvent.pressure for trackpad; PencilKit for Apple Pencil |
| Custom brush engine | User-defined brush tip, spacing, jitter, dynamics |
| Non-destructive filters | Core Image filter layers with adjustable parameters |
| Curves / Levels | Color correction with histogram |
| Pen tool | Bezier path creation and editing |
| AI background removal | Vision framework VNGenerateForegroundInstanceMaskRequest |
| AppleScript / Shortcuts | Scriptable app with Shortcuts integration |
| Animation | Simple frame timeline; GIF/APNG export |

---

## 5. Mac-Specific Priorities

### 5.1 Native Frameworks to Leverage

| Framework | Use Case | Priority |
|---|---|---|
| **AppKit** | NSView canvas, NSUndoManager, NSColorPanel, NSDocument, toolbar | Phase 1 |
| **Core Graphics (Quartz 2D)** | All 2D drawing: paths, strokes, fills, compositing | Phase 1 |
| **ImageIO** | Read/write PNG, JPEG, TIFF, HEIC, BMP, GIF, PDF | Phase 1 |
| **Uniform Type Identifiers** | File type declarations and document handling | Phase 1 |
| **Core Image** | Built-in filters (200+); GPU-accelerated image processing | Phase 3 |
| **Metal** | GPU rendering pipeline for large canvases and real-time effects | Phase 3–4 |
| **PencilKit** | Apple Pencil support on iPad (if targeting Mac Catalyst or iPad) | Phase 4 |
| **Vision** | ML-based image analysis, foreground/background segmentation | Phase 4 |
| **Create ML / Core ML** | Custom AI models for smart tools | Phase 4 |
| **NSColorSampler** | System-level eyedropper (samples any pixel on screen) | Phase 2 |
| **NSDraggingDestination** | Drag-and-drop file support | Phase 2 |
| **NSPrintOperation** | Native print support | Phase 2 |

### 5.2 Mac-Specific UX Priorities

| Priority | Feature | Rationale |
|---|---|---|
| **High** | Native macOS window management | Proper resize, full-screen, split view |
| **High** | Dark / Light mode | macOS users expect automatic appearance switching |
| **High** | Retina display support | @2x rendering; pixel-perfect on HiDPI |
| **High** | Trackpad gestures | Pinch-to-zoom, two-finger scroll for pan |
| **High** | Menu bar integration | Standard Edit, View, Format menus with shortcuts |
| **Medium** | Touch Bar support (legacy) | Tool selection on Touch Bar models |
| **Medium** | Continuity Camera | Insert photos directly from iPhone camera |
| **Medium** | Handoff | Continue editing on another Mac |
| **Medium** | iCloud document storage | Seamless cloud save |
| **Low** | Shortcuts app actions | Automation integration |
| **Low** | Share extension | Share to other apps via share sheet |

### 5.3 Competitive Landscape on Mac (2026)

| App | Category | Price | Key Differentiator |
|---|---|---|---|
| **Pixelmator Pro** (Apple) | Professional | $12.99/mo (Creator Studio) | Now Apple-owned; ML features, Metal rendering |
| **Affinity Photo** | Professional | $69.99 one-time | Photoshop alternative; non-destructive |
| **GIMP** | Professional (free) | Free | Full-featured but complex; non-native UI |
| **Acorn** | Mid-range | ~$30 | Mac-native; layers, filters, vectors |
| **Seashore** | Basic (free) | Free | GIMP-based, Mac-native; limited features |
| **Preview.app** | Minimal | Built-in | Annotation only; not a paint app |
| **Krita** | Digital art (free) | Free | Painting-focused; brush engine; non-native |

**Gap identified:** There is no modern, simple, Mac-native paint app equivalent to Microsoft Paint for Windows. Preview.app provides annotations but not drawing. Pixelmator Pro and Affinity Photo are professional tools. GIMP and Krita are non-native. **A simple, native, "Mac Paint" fills a genuine gap.**

---

## 6. Key Discoveries

1. **MacPaint (1984) established the template.** Its toolset — brush, eraser, shapes, fill, lasso, text, patterns, zoom (FatBits) — remains the baseline for simple paint apps 42 years later.

2. **Microsoft Paint's evolution validates the phasing model.** MS Paint started with basics (Win 1.0), added brushes and file formats (Win 95), added artistic brushes and undo (Win 7), then added layers and AI (Win 11). This 40-year arc maps directly to a P0→P3 phasing approach.

3. **Pixelmator Pro is now Apple-owned** (acquired Feb 2025). This means Apple has a professional image editor but no simple paint app. A lightweight alternative has even clearer positioning.

4. **macOS frameworks dramatically reduce implementation effort.** NSUndoManager, NSColorPanel, NSColorSampler, ImageIO, Core Image, and Core Graphics provide out-of-the-box solutions for many P0–P2 features.

5. **Layers are the #1 differentiator** between a "toy" and a "powerful" paint app. Every editor in the Wikipedia comparison that supports layers is considered mid-tier or higher.

6. **The "Common Features" of raster editors** per Wikipedia: select, brush, fill, color picker, text, layers, filters, file format conversion. Our P0+P1 covers all of these except layers and filters, which are in P2.

---

## 7. References and Evidence

| Source | Key Data |
|---|---|
| [Wikipedia: Comparison of raster graphics editors](https://en.wikipedia.org/wiki/Comparison_of_raster_graphics_editors) | 80+ editors compared across features, OS support, color spaces, file formats |
| [Wikipedia: Raster graphics editor](https://en.wikipedia.org/wiki/Raster_graphics_editor) | Common features definition: select, brush, fill, color picker, text, layers, filters |
| [Wikipedia: MacPaint](https://en.wikipedia.org/wiki/MacPaint) | Original Mac paint app (1984); established the paint app paradigm |
| [Wikipedia: Microsoft Paint](https://en.wikipedia.org/wiki/Microsoft_Paint) | 40-year evolution; feature progression model; Win11 added layers and AI |
| [Wikipedia: Pixelmator](https://en.wikipedia.org/wiki/Pixelmator) | Mac-native editor; acquired by Apple Feb 2025; uses Metal, CoreML |
| Apple Developer Documentation | PencilKit (PKCanvasView, PKDrawing), Core Graphics, Core Image, ImageIO, Vision |

---

## 8. Outstanding Questions

- [ ] **SwiftUI vs. AppKit:** Should the canvas be implemented in SwiftUI (NSViewRepresentable wrapper) or pure AppKit? Performance considerations for large bitmaps favor AppKit/Metal.
- [ ] **Document architecture:** Single-window SDI or multi-window MDI? NSDocument-based architecture recommended for file handling.
- [ ] **Target audience:** Is this aimed at casual users (MS Paint replacement) or aspiring artists (simple Procreate)? This affects brush engine investment.
- [ ] **iPad target:** Will this also target iPadOS via Mac Catalyst or native iPad build? This affects PencilKit adoption.
- [ ] **Monetization model:** Free, paid upfront, or freemium (basic free, layers/filters paid)? Affects feature gating.
