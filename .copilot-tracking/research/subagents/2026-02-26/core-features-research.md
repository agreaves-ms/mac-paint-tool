# Core Paint App Feature Inventory — Research Document

**Status:** Complete
**Date:** 2026-02-26
**Researcher:** Copilot Subagent

---

## Research Topics

- Comprehensive feature inventory for a new Mac Paint application
- Feature analysis across six reference applications: Apple Preview, Paintbrush (Mac), MacPaint, Microsoft Paint, Krita, Paint.NET
- Mac-specific platform considerations

## Sources Researched

| Source | URL | Status |
|--------|-----|--------|
| Apple Preview (macOS) | Wikipedia: Preview (Apple) | Researched |
| Paintbrush (Mac) | Wikipedia: Paintbrush (software) | Researched |
| MacPaint (historical) | Wikipedia: MacPaint | Researched |
| Microsoft Paint | Wikipedia: Microsoft Paint | Researched |
| Krita Features | krita.org/en/features/ | Researched |
| Paint.NET Features | getpaint.net/doc/latest/index.html | Researched |
| Raster Editor Comparison | Wikipedia: Comparison of raster graphics editors | Researched |

---

## 1. Feature Categories

### 1.1 Drawing Tools

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Pencil / Freehand | Yes | Yes | Yes | Yes (markup) | Yes | Yes |
| Brush (basic) | Yes (24 brush shapes/patterns) | Yes | Yes | No | Yes | Yes |
| Artistic Brushes (oil, watercolor, calligraphy) | No | Yes (Win7+) | No | No | No | Yes (100+ presets) |
| Brush Engines (customizable) | No | No | No | No | No | Yes (9 engines) |
| Brush Stabilizers | No | No | No | No | No | Yes (3 modes) |
| Spray Can / Airbrush | No | Yes | Yes | No | Yes | Yes |
| Eraser | No | Yes | Yes | No | Yes | Yes |
| Line Tool | Yes | Yes | Yes | Yes (markup) | Yes | Yes |
| Curve Tool (Bézier) | Yes | Yes | Yes | No | Yes | Yes |
| Rectangle / Square | Yes | Yes | Yes | Yes (markup) | Yes | Yes |
| Rounded Rectangle | Yes | Yes | Yes | No | Yes | Yes |
| Ellipse / Circle | Yes | Yes | Yes | Yes (markup) | Yes | Yes |
| Polygon | No | Yes | No | No | Yes | Yes |
| Arrow | No | No | No | Yes (markup) | No | Yes |
| Star | No | No | No | Yes (markup) | No | Yes |
| Custom Shapes | No | No | No | No | Yes | Yes (via vector library) |
| Speech/Thought Bubbles | No | No | No | Yes (markup) | No | Yes (vector library) |
| Pattern Fill Drawing | Yes (patterns) | No | No | No | No | Yes |
| Symmetry / Mirror Drawing | No | No | No | No | No | Yes (multibrush) |
| Wrap-around Mode (seamless textures) | No | No | No | No | No | Yes |

**Discovered Features:**

- **MacPaint:** Pioneered FatBits (pixel-level editing via magnification), 24 brush shapes/patterns, Bézier curves, isometric line constraint (3-angle snapping)
- **MS Paint (Win7+):** Artistic brushes (oil, watercolor, natural media, marker, crayon, calligraphy, pencil) with variable opacity/shade, anti-aliased shapes, paint "running out" simulation
- **MS Paint (Win11):** Background removal tool, AI art generation (DALL-E Cocreator)
- **Paintbrush:** Adjustable stroke sizes (1-10 levels, 1px to 19px width), "bomb" tool (clear page)
- **Krita:** 100+ professional brush presets, 9 unique brush engines (Color Smudge, Shape, Particle, Filter, etc.), brush stabilizers for shaky hands, wrap-around mode for seamless textures, drawing assistants (vanishing points, perspective, ellipses)
- **Paint.NET:** Standard drawing toolkit with plugin extensibility

### 1.2 Selection Tools

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Rectangle Select | Yes | Yes | Yes | No | Yes | Yes |
| Freeform / Lasso Select | No | Yes | No | No | Yes | Yes |
| Magic Wand (color-based) | No | No | No | No | Yes | Yes |
| Select All | Yes | Yes | No | No | Yes | Yes |
| Feather Selection | No | No | No | No | No | Yes |
| Invert Selection | No | No | Yes | No | Yes | Yes |
| Add/Subtract from Selection | No | No | No | No | Yes | Yes |
| Global Selection Mask | No | No | No | No | No | Yes |
| Move Selection | Yes | Yes | Yes | No | Yes | Yes |
| Stamp Mode (Ctrl+Drag copy) | No | Yes | No | No | No | Yes |
| Trail Mode (Shift+Drag) | No | Yes | No | No | No | No |
| Transparent Selection | No | Yes (Win7+) | No | No | Yes | Yes |

### 1.3 Color Tools

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Color Palette | No (B&W only) | Yes | Yes | Yes | Yes | Yes |
| Color Picker / Eyedropper | No | Yes | Yes | No | Yes | Yes |
| Custom Color Dialog | No | Yes | No | No | Yes | Yes |
| Fill Bucket / Flood Fill | Yes | Yes | Yes | No | Yes | Yes |
| Gradient Fill | No | No | No | No | Yes | Yes |
| Foreground/Background Colors | No | Yes (primary/secondary) | Yes | No | Yes | Yes |
| Color Replace Brush | No | Yes (legacy) | No | No | Yes | Yes |
| Full Color Management (ICC/OCIO) | No | No | No | No | Yes | Yes |
| HDR Color Support | No | No | No | No | No | Yes |

### 1.4 Text Tools

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Text Tool | Yes | Yes | Yes | Yes (markup) | Yes | Yes |
| Font Selection | Yes | Yes | Yes (system fonts) | Yes | Yes | Yes |
| Font Size | Yes | Yes | Yes | Yes | Yes | Yes |
| Bold / Italic / Underline | No | Yes | No | Yes | Yes | Yes |
| Text Color | No | Yes | Yes | Yes | Yes | Yes |
| Resizable Text Box | No | Yes (Win7+) | No | No | Yes | Yes |
| Anti-aliased Text | No | Yes (Win11) | No | Yes | Yes | Yes |
| Vector Text (SVG) | No | No | No | No | No | Yes |

### 1.5 Transform Tools

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Resize / Scale Image | No | Yes | No | Yes | Yes | Yes |
| Rotate (90°/180°/270°) | No | Yes | No | Yes | Yes | Yes |
| Rotate (free angle) | No | Yes | No | Yes | Yes | Yes |
| Flip Horizontal | No | Yes | No | Yes | Yes | Yes |
| Flip Vertical | No | Yes | No | Yes | Yes | Yes |
| Crop | No | Yes (Vista+) | Yes | Yes | Yes | Yes |
| Skew / Shear | No | Yes | No | No | Yes | Yes |
| Stretch | No | Yes | No | No | Yes | Yes |
| Free Transform | No | No | No | No | Yes | Yes |
| Perspective Transform | No | No | No | No | No | Yes |
| Warp Transform | No | No | No | No | No | Yes |

### 1.6 Canvas / Document Management

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| New Document | Yes | Yes | Yes | Yes | Yes | Yes |
| Resize Canvas | No | Yes (drag handle) | No | No | Yes | Yes |
| Custom Canvas Size | No | Yes | No | No | Yes | Yes |
| Zoom In/Out | Yes (FatBits 2x) | Yes (slider, Vista+) | Yes (25%-1600%) | Yes | Yes | Yes |
| Pan / Scroll | Yes (viewport) | Yes | Yes | Yes | Yes | Yes |
| Canvas Rotation | No | No | No | No | No | Yes (GPU accelerated) |
| Multiple Documents / Tabs | No (v1); Yes (v2, up to 9) | No | No | Yes | Yes (tabbed) | Yes |
| Fit to Window | No | Yes | No | Yes | Yes | Yes |
| Rulers | No | No | No | No | No | Yes |
| Full Screen Mode | No | No | No | Yes | Yes | Yes |
| Custom DPI | No | No | No | No | Yes | Yes |

### 1.7 Layer Support

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Layer Support | No | Yes (Win11, 2023+) | No | No | Yes | Yes |
| Layer Blend Modes | No | No | No | No | Yes | Yes |
| Layer Transparency/Opacity | No | Yes (Win11) | No | No | Yes | Yes |
| Layer Reorder (drag-and-drop) | No | No | No | No | Yes | Yes |
| Layer Groups | No | No | No | No | No | Yes |
| Vector Layers | No | No | No | No | No | Yes |
| Filter Layers | No | No | No | No | No | Yes |
| File Layers | No | No | No | No | No | Yes |
| Layer Masks | No | No | No | No | No | Yes |
| Flatten Layers | No | No | No | No | Yes | Yes |
| Transparent PNG Support | No | Yes (Win11) | No | Yes | Yes | Yes |

### 1.8 Effects and Filters

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Blur | No | No | No | No | Yes | Yes |
| Sharpen | No | No | No | No | Yes | Yes |
| Noise Reduction | No | No | No | No | Yes | Yes |
| Invert Colors | No | Yes | Yes | No | Yes | Yes |
| Brightness / Contrast | No | No | No | Yes (Core Image) | Yes | Yes |
| Hue / Saturation | No | No | No | Yes | Yes | Yes |
| Color Balance | No | No | No | No | Yes | Yes |
| Levels | No | No | No | No | Yes | Yes |
| Curves | No | No | No | No | Yes | Yes |
| Posterize | No | No | No | No | Yes | Yes |
| Sepia / Color Effects | No | No | No | No | Yes | Yes |
| Emboss | No | No | No | No | Yes | Yes |
| Edge Detection | No | No | No | No | Yes | Yes |
| Oil Painting Effect | No | No | No | No | Yes | Yes |
| Ink Sketch Effect | No | No | No | No | Yes | No |
| Distortion Effects | No | No | No | No | Yes | Yes |
| Red Eye Removal | No | No | No | No | Yes | No |
| Background Removal (AI) | No | Yes (Win11) | No | No | No | No |
| Plugin/Extension Effects | No | No | No | No | Yes (extensible) | Yes (Python scripting) |

### 1.9 File Format Support

| Format | MacPaint | MS Paint | Paintbrush | Preview (macOS) | Paint.NET | Krita |
|--------|----------|----------|------------|-----------------|-----------|-------|
| PNG | No | Yes (XP+, default Win7+) | Yes | Yes | Yes | Yes |
| JPEG | No | Yes (XP+) | Yes | Yes | Yes | Yes |
| BMP | No | Yes (native) | Yes | Yes | Yes | Yes |
| GIF | No | Yes (XP+) | Yes | Yes | Yes | Yes |
| TIFF | No | Yes (XP+) | Yes | Yes | Yes | Yes |
| PSD (Photoshop) | No | No | No | Yes (import) | Via plugin | Yes |
| SVG | No | No | No | No | No | Yes (vector) |
| WebP | No | No | No | No | Yes | Yes |
| HEIC/HEIF | No | No | No | Yes | Yes | No |
| AVIF | No | No | No | No | Yes | No |
| JPEG XL | No | No | No | No | Yes | No |
| JPEG XR | No | No | No | No | Yes | No |
| TGA | No | No | No | Yes | Yes | Yes |
| DDS | No | No | No | No | Yes | No |
| OpenEXR | No | No | No | Yes | No | Yes |
| RAW (camera) | No | No | No | Yes (CR2, DNG, etc.) | No | Yes |
| ICO | No | Yes (view, Win7+) | No | Yes | No | No |
| PDF | No | No | No | Yes | No | No |
| JPEG 2000 | No | No | No | Yes | No | Yes |
| Native Format | PNTG | BMP | N/A | N/A | PDN (preserves layers) | KRA (preserves layers) |

### 1.10 History / Undo System

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Undo | Yes (1 level, via buffer) | Yes | Yes | Yes | Yes | Yes |
| Undo Depth | 1 | 3 (pre-Vista) / 10 (Vista) / 50 (Win7+) | Limited | Multiple | Unlimited (disk-limited) | Unlimited |
| Redo | No | Yes | Yes | Yes | Yes | Yes |
| History Panel (visual list) | No | No | No | No | Yes (clickable list) | Yes |
| Non-destructive Undo | No | No | No | No | Yes | Yes |

### 1.11 UI Features

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Toolbar | Yes (fixed) | Yes (ribbon, Win7+) | Yes | Yes (markup bar) | Yes | Yes (customizable) |
| Keyboard Shortcuts | Yes | Yes | Yes | Yes | Yes | Yes (fully customizable) |
| Dark Mode / Dark Theme | No | Yes (Win11) | No | Yes (follows system) | No (Windows only) | Yes |
| Customizable UI Layout | No | No | No | No | No | Yes (dockers, workspaces) |
| Saved Workspaces | No | No | No | No | No | Yes |
| Status Bar | No | Yes | No | No | Yes | Yes |
| Floating Tool Options | No | No | No | No | Yes | Yes |
| Context Menus | No | Yes | No | Yes | Yes | Yes |
| Touch Support | No | No | No | Yes (Apple Pencil on iPad) | No | Yes (tablet/stylus) |
| Multi-language Support | No | Yes | No | Yes (system language) | No (Windows) | Yes (built-in) |

### 1.12 Clipboard Operations

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Copy | Yes | Yes | Yes | Yes | Yes | Yes |
| Cut | Yes | Yes | Yes | Yes | Yes | Yes |
| Paste | Yes | Yes | Yes | Yes | Yes | Yes |
| Paste as New Image | No | No | No | No | Yes | Yes |
| Paste Into Selection | No | No | No | No | Yes | Yes |
| Copy to/from Other Apps | Yes (MacWrite) | Yes | Yes | Yes | Yes | Yes |

### 1.13 Grid and Guides

| Feature | MacPaint | MS Paint | Paintbrush | Preview | Paint.NET | Krita |
|---------|----------|----------|------------|---------|-----------|-------|
| Pixel Grid | Yes (FatBits) | No | Yes | No | Yes (at zoom) | Yes |
| Snap-to-Grid | No | No | No | No | No | Yes |
| Guide Lines | No | No | No | No | No | Yes |
| Drawing Assistants | No | No | No | No | No | Yes (vanishing points, perspective, ellipses) |

---

## 2. Feature Comparison Matrix

### Legend

- **●** = Full support
- **◐** = Partial/limited support
- **○** = Not supported

| Category | MacPaint | MS Paint | Paintbrush (Mac) | Apple Preview | Paint.NET | Krita |
|----------|----------|----------|------------------|---------------|-----------|-------|
| **Drawing Tools** | ◐ | ● | ◐ | ◐ | ● | ● |
| **Selection Tools** | ◐ | ◐ | ◐ | ○ | ● | ● |
| **Color Tools** | ○ | ◐ | ◐ | ◐ | ● | ● |
| **Text Tools** | ◐ | ● | ◐ | ◐ | ● | ● |
| **Transform Tools** | ○ | ◐ | ◐ | ◐ | ● | ● |
| **Canvas Management** | ◐ | ◐ | ◐ | ◐ | ● | ● |
| **Layer Support** | ○ | ◐ (Win11) | ○ | ○ | ● | ● |
| **Effects & Filters** | ○ | ○ | ◐ | ◐ | ● | ● |
| **File Format Support** | ○ | ◐ | ◐ | ● | ● | ● |
| **History / Undo** | ◐ | ◐ | ◐ | ● | ● | ● |
| **UI Features** | ◐ | ◐ | ◐ | ◐ | ● | ● |
| **Clipboard** | ● | ● | ● | ● | ● | ● |
| **Grid & Guides** | ◐ | ○ | ◐ | ○ | ◐ | ● |

### Positioning Summary

| App | Market Position | Complexity Level |
|-----|----------------|-----------------|
| MacPaint | Historical pioneer, minimal feature set | Simple |
| Paintbrush (Mac) | MS Paint equivalent for Mac, basic bitmap editor | Simple |
| MS Paint | Ubiquitous basic editor, evolving in Win11 | Simple → Moderate |
| Apple Preview | Viewer with annotation/markup, not a paint app | Simple (annotation) |
| Paint.NET | Sweet spot: powerful yet accessible, layers + effects | Moderate |
| Krita | Professional digital painting, animation, full-featured | Advanced |

---

## 3. Mac-Specific Considerations

### 3.1 Platform Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dark Mode** | Follow macOS system appearance (NSAppearance), support both light and dark themes | High |
| **Retina / HiDPI Support** | Render at native resolution on Retina displays, sharp UI at all scales | High |
| **Native macOS Menus** | Standard menu bar with macOS conventions (Cmd+Z undo, Cmd+S save, etc.) | High |
| **Trackpad Gestures** | Pinch-to-zoom, two-finger scroll/pan, rotate gesture for canvas rotation | High |
| **Touch Bar Support** | Tool selection, color picker, brush size slider on Touch Bar (legacy MacBook Pro) | Low (deprecated) |
| **Continuity Camera** | Insert photo/scan directly from iPhone camera into canvas | Medium |
| **Handoff** | Start editing on one device, continue on another | Low |
| **iCloud Integration** | Save/open files from iCloud Drive | Medium |
| **Spotlight Integration** | Index saved images with metadata for Spotlight search | Medium |
| **Quick Look Preview** | Generate Quick Look thumbnails for native file format | Medium |
| **Share Sheet** | Export/share via macOS Share extension | Medium |
| **Apple Pencil Support** | Pressure sensitivity, tilt support via Sidecar (iPad as second display) | Medium |
| **Universal Binary** | Native Apple Silicon (ARM64) + Intel (x86_64) support | High |
| **Sandboxing** | App Store-compatible sandboxed architecture | Medium |
| **Auto Save / Versions** | macOS document model with auto-save and version browsing | High |

### 3.2 macOS Frameworks to Leverage

| Framework | Use Case |
|-----------|----------|
| **AppKit** | Native UI, menus, toolbars, windows |
| **Core Graphics / Quartz 2D** | 2D rendering, path drawing, color spaces |
| **Core Image** | GPU-accelerated image filters and effects |
| **Metal** | High-performance GPU rendering for canvas |
| **ImageIO** | Image format import/export (PNG, JPEG, TIFF, HEIC, etc.) |
| **UniformTypeIdentifiers** | Modern file type handling |
| **NSUndoManager** | Built-in undo/redo stack |
| **ColorSync** | Color management / ICC profiles |
| **Vision** | Text recognition (OCR) in images |
| **VNRemoveBackgroundRequest** | AI background removal |

### 3.3 macOS Design Guidelines

- Follow Human Interface Guidelines (HIG) for Mac apps
- Use SF Symbols for toolbar icons
- Support system accent color for UI highlights
- Resizable, draggable tool palettes (inspector panels)
- Full-screen mode support
- Accessibility: VoiceOver, keyboard navigation, reduced motion
- Native file dialogs with recent files and tags support

---

## 4. Recommended Feature Tiers for Mac Paint Tool

### Tier 1 — Core / MVP (Simple Paint App)

- **Drawing:** Pencil, brush (multiple sizes), eraser, line, rectangle, ellipse, rounded rectangle, polygon
- **Selection:** Rectangle select, lasso select, move selection
- **Color:** Color picker (system color panel), fill bucket, foreground/background colors, color palette
- **Text:** Basic text tool with font/size/color selection
- **Transform:** Resize image, rotate (90°/free), flip H/V, crop
- **Canvas:** New document (custom size), zoom in/out, pan/scroll, resize canvas
- **History:** Unlimited undo/redo (NSUndoManager)
- **File Formats:** PNG, JPEG, BMP, GIF, TIFF (via ImageIO)
- **Clipboard:** Copy, cut, paste, paste as new image
- **UI:** Native macOS toolbar, keyboard shortcuts, dark mode, Retina support
- **Platform:** Universal binary (Apple Silicon + Intel), auto-save

### Tier 2 — Powerful (Competitive with Paint.NET)

- **Drawing:** Curve/Bézier tool, spray can/airbrush, shapes (arrow, star, polygon), anti-aliased rendering
- **Selection:** Magic wand, add/subtract from selection, select all, invert selection
- **Color:** Gradient fill, color replace brush, custom color dialog with hex input
- **Transform:** Skew, perspective, free transform
- **Layers:** Multiple layers, blend modes, layer opacity, layer reorder, flatten, merge
- **Effects:** Blur, sharpen, brightness/contrast, hue/saturation, levels, invert colors, sepia
- **Canvas:** Grid overlay, rulers
- **File Formats:** WebP, HEIC, PSD (import), AVIF, custom native format (preserving layers)
- **History:** Visual history panel
- **UI:** Floating tool options bar, customizable toolbar

### Tier 3 — Advanced (Power User Features)

- **Drawing:** Brush stabilizers, symmetry/mirror drawing, customizable brush engine, pressure sensitivity
- **Selection:** Feathered selection, global selection mask
- **Color:** Full color management (ICC profiles), wide gamut (Display P3)
- **Layers:** Layer groups, layer masks, vector layers, filter layers
- **Effects:** Curves, color balance, posterize, edge detection, emboss, distortion, noise reduction, plugin system
- **Canvas:** Canvas rotation, guides, snap-to-grid, drawing assistants
- **Animation:** Basic frame animation (onion skinning, timeline)
- **Platform:** Continuity Camera, iCloud, Share Sheet, Quick Look, Spotlight metadata
- **Advanced:** Python/AppleScript scripting, plugin architecture

---

## 5. Key Discoveries

1. **Paint.NET is the sweet spot model.** It hits the perfect balance between simplicity (MS Paint heritage) and power (layers, effects, extensibility). A Mac equivalent with native macOS integration would fill a significant gap.

2. **No true Paint.NET equivalent exists for Mac.** Paintbrush is too simple (no layers, no effects). Krita is too complex for casual use. Preview is an annotator, not a paint app. Pixelmator Pro is commercial ($50+).

3. **Layer support is table stakes for "powerful."** MS Paint added layers in Win11 (2023). Paint.NET has had them since inception. Any competitive app needs layers.

4. **macOS frameworks provide significant advantages.** Core Image provides GPU-accelerated filters for free. ImageIO handles all major formats. NSUndoManager provides unlimited undo. Metal enables smooth canvas rendering. These reduce implementation effort dramatically.

5. **MacPaint's FatBits concept (pixel-level editing) remains relevant** for pixel art. Paintbrush's grid mode serves this use case. Consider including a pixel grid mode.

6. **Brush stabilization (Krita) is highly valued** by digital artists and differentiates from simpler tools.

7. **The gap in the Mac market** is between Preview (annotations only) and Pixelmator/Affinity Photo (professional, paid). A free/affordable, powerful-yet-simple paint app would serve a large audience.

---

## 6. Clarifying Questions

1. **Target audience:** Is the primary audience casual users (MS Paint level), hobbyists (Paint.NET level), or aspiring digital artists (Krita level)?
2. **Technology stack:** Swift/AppKit native, SwiftUI, or cross-platform (Electron, Qt)?
3. **Distribution model:** Mac App Store, direct download, or both?
4. **Pricing model:** Free, freemium, or paid?
5. **Plugin architecture:** Should the app support third-party plugins/effects from the start?

---

## References

- [Wikipedia: MacPaint](https://en.wikipedia.org/wiki/MacPaint)
- [Wikipedia: Microsoft Paint](https://en.wikipedia.org/wiki/Microsoft_Paint)
- [Wikipedia: Paintbrush (software)](https://en.wikipedia.org/wiki/Paintbrush_(software))
- [Wikipedia: Preview (Apple)](https://en.wikipedia.org/wiki/Preview_(Apple))
- [Wikipedia: Paint.NET](https://en.wikipedia.org/wiki/Paint.NET)
- [Wikipedia: Comparison of raster graphics editors](https://en.wikipedia.org/wiki/Comparison_of_raster_graphics_editors)
- [Krita Features](https://krita.org/en/features/)
- [Paint.NET Features](https://www.getpaint.net/doc/latest/index.html)
