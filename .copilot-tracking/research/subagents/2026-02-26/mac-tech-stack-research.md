# Mac-Native Paint App — Technology Stack Research

> **Status:** Complete
> **Date:** 2026-02-26
> **Scope:** Frameworks, APIs, architecture patterns, and platform features for a native macOS paint application

---

## Research Topics

- [x] Available Apple frameworks for paint/drawing app features
- [x] Architecture patterns: document-based app, undo system, layer architecture
- [x] Drawing API comparison: Core Graphics, PencilKit, Metal, SwiftUI Canvas
- [x] File format support and native macOS image I/O capabilities
- [x] Mac platform features: Touch Bar, trackpad, Continuity, Share, Quick Look
- [x] Accessibility: VoiceOver, color contrast, alternative input
- [x] Recommended technology choices for a "simple but powerful" paint app

---

## 1. Available Frameworks

### Primary Frameworks

| Framework | Purpose | macOS Availability |
|---|---|---|
| **SwiftUI** | Declarative UI, layout, windowing, menus | macOS 10.15+ (Canvas: 12.0+) |
| **AppKit** | NSView, NSWindow, NSDocument, NSBezierPath | All macOS |
| **Core Graphics (Quartz 2D)** | Low-level 2D drawing: CGContext, CGImage, CGPath, CGColor | All macOS |
| **Core Image** | GPU-accelerated image filters, non-destructive editing pipeline | macOS 10.4+ |
| **ImageIO** | Read/write image files (PNG, JPEG, TIFF, HEIF, WebP, GIF, BMP, PSD, RAW) | All macOS |
| **PencilKit** | Stroke-based drawing with pressure/tilt (Apple Pencil, trackpad, mouse) | macOS 14.0+ |
| **Metal** | GPU-accelerated custom rendering, compute shaders | macOS 10.11+ |
| **Metal Performance Shaders** | Optimized GPU image processing kernels | macOS 10.13+ |
| **UniformTypeIdentifiers** | Modern file type identification (replaces UTI strings) | macOS 11.0+ |
| **ColorSync / NSColorSpace** | Color management, ICC profiles | All macOS |

### Supporting Frameworks

| Framework | Purpose |
|---|---|
| **Combine** | Reactive data flow for tool state, layer updates |
| **SwiftData / Core Data** | Persistent settings, recent files, preferences |
| **Vision** | Text recognition in images, object detection |
| **Natural Language** | Smart text tool suggestions |
| **Accessibility (AX)** | VoiceOver, Switch Control, accessibility API |
| **CloudKit** | iCloud document sync |
| **GameController** | Stylus pressure via game controller API on Mac |

---

## 2. Architecture Patterns

### 2.1 Document-Based App Architecture

SwiftUI provides `DocumentGroup` for document-based apps. Two document model protocols:

#### FileDocument (Value Semantics)

- Conforms to `FileDocument` protocol
- Entire document model is a value type (struct)
- SwiftUI automatically tracks changes via `@Binding` mutations
- Automatic undo/redo: setting `$document` registers undo actions and marks document dirty
- Best for simpler document models

```swift
struct PaintDocument: FileDocument {
    static var readableContentTypes: [UTType] = [.png, .jpeg, .tiff]

    var imageData: Data

    init(configuration: ReadConfiguration) throws {
        imageData = configuration.file.regularFileContents ?? Data()
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: imageData)
    }
}
```

#### ReferenceFileDocument (Reference Semantics) — RECOMMENDED

- Conforms to `ReferenceFileDocument` protocol
- Document model is a reference type (class, `@Observable`)
- Developer manually registers undo operations via `UndoManager`
- Better for complex, mutable document state (layers, history, selections)
- Supports snapshots for serialization safety

```swift
@Observable
class PaintDocument: ReferenceFileDocument {
    static var readableContentTypes: [UTType] = [.png, .jpeg, .tiff]

    var layers: [Layer] = []
    var canvasSize: CGSize = CGSize(width: 1024, height: 768)

    required init(configuration: ReadConfiguration) throws { /* ... */ }
    func snapshot(contentType: UTType) throws -> Data { /* ... */ }
    func fileWrapper(snapshot: Data, configuration: WriteConfiguration) throws -> FileWrapper { /* ... */ }
}
```

#### DocumentGroup Scene

```swift
@main
struct PaintApp: App {
    var body: some Scene {
        DocumentGroup(newDocument: PaintDocument()) { config in
            CanvasEditorView(document: config.document)
        }
        .commands { /* custom menu commands */ }
    }
}
```

**Key capabilities provided by DocumentGroup:**

- macOS: Multi-window, standard File menu (New, Open, Save, Save As, Revert)
- Automatic recent documents tracking
- Window title with document name and edited indicator
- Standard close-with-unsaved-changes dialog

### 2.2 Undo/Redo System

SwiftUI provides `UndoManager` through the environment:

```swift
@Environment(\.undoManager) var undoManager
```

**Architecture approaches for undo in a paint app:**

1. **Command Pattern** — Each drawing action is a command object with `execute()` and `undo()` methods. Register the inverse command with `UndoManager.registerUndo(withTarget:handler:)`. Best for vector/stroke operations.

2. **Snapshot-Based** — Store bitmap snapshots of affected layers before each operation. Undo restores the snapshot. Memory-intensive but simple. Use with tile-based dirty region tracking to reduce memory.

3. **Hybrid** — Use command pattern for vector operations (shapes, text, transforms) and snapshot-based for raster operations (brush strokes, fills, filters). This is what professional apps like Pixelmator Pro use.

**NSUndoManager features:**

- `beginUndoGrouping()` / `endUndoGrouping()` for compound operations
- `setActionName(_:)` for human-readable undo menu items ("Undo Brush Stroke")
- `levelsOfUndo` to limit history depth
- Automatic redo stack management
- `canUndo` / `canRedo` for UI state
- `removeAllActions()` for document reset
- `groupsByEvent` — automatically groups by run loop cycle

### 2.3 Layer Architecture

A paint app layer system typically consists of:

```
CanvasModel
├── layers: [Layer]        // Ordered bottom-to-top
│   ├── Layer
│   │   ├── id: UUID
│   │   ├── name: String
│   │   ├── bitmap: CGImage (or MTLTexture)
│   │   ├── opacity: Double
│   │   ├── blendMode: CGBlendMode
│   │   ├── isVisible: Bool
│   │   ├── isLocked: Bool
│   │   ├── position: CGPoint
│   │   └── clipMask: CGImage?
│   └── ...
├── activeLayerIndex: Int
├── canvasSize: CGSize
├── backgroundColor: CGColor
└── selection: SelectionMask?
```

**Compositing pipeline:**

1. Start with background color
2. For each visible layer (bottom to top):
   - Apply layer transform
   - Composite layer bitmap using layer's blend mode and opacity
   - Apply clip mask if present
3. Overlay selection marching ants and tool guides

**Performance considerations:**

- Use `CGContext` for raster compositing
- Cache composited result; only re-composite when layers change
- For many layers, use Metal textures and GPU compositing
- Tile-based rendering for large canvases (split into 256×256 or 512×512 tiles)

---

## 3. Drawing APIs — Detailed Comparison

### 3.1 SwiftUI Canvas + GraphicsContext

**Overview:** SwiftUI's `Canvas` view provides immediate-mode 2D drawing via `GraphicsContext`. Available macOS 12.0+.

```swift
Canvas(opaque: true, colorMode: .nonLinear, rendersAsynchronously: false) { context, size in
    // Draw with GraphicsContext
    context.stroke(
        Path(ellipseIn: CGRect(origin: .zero, size: size)),
        with: .color(.green),
        lineWidth: 4
    )
}
.frame(width: 800, height: 600)
```

**Key GraphicsContext capabilities:**

- Draw paths, images, text, and resolved SwiftUI views
- Apply filters (blur, saturation, brightness, color matrix, shadow)
- Blend modes, opacity, clip masks, transforms
- `withCGContext(content:)` — bridge to Core Graphics for legacy drawing code
- Layer transparency groups

**Strengths:**

- Native SwiftUI integration — works with state, environment, gestures
- Clean declarative API for drawing
- Automatic display scaling / retina support
- Can bridge to CGContext when needed

**Weaknesses:**

- Limited bitmap manipulation (no pixel-level access)
- No off-screen rendering to bitmap from GraphicsContext directly
- Canvas redraws entirely on state change (no partial invalidation)
- Less control than raw CGContext for complex compositing
- Performance ceiling for complex brush engines

**Verdict:** Good for UI overlays, tool previews, simple drawing. Not sufficient alone for a full paint engine.

### 3.2 Core Graphics (CGContext)

**Overview:** The foundational 2D drawing API. Pixel-level control over bitmap contexts.

```swift
// Create a bitmap context
let context = CGContext(
    data: nil,
    width: 1024, height: 768,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!

// Draw
context.setFillColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1))
context.fillEllipse(in: CGRect(x: 100, y: 100, width: 50, height: 50))

// Get result
let image = context.makeImage()!
```

**Key capabilities:**

- Create off-screen bitmap contexts of arbitrary size and color depth
- Full path drawing: lines, curves, arcs, rectangles, ellipses
- Affine transforms, clip paths, gradient fills, pattern fills
- Blend modes (27+ modes: normal, multiply, screen, overlay, etc.)
- Anti-aliased rendering with sub-pixel accuracy
- Direct pixel data access via `context.data` pointer
- Image drawing with interpolation quality control
- PDF generation

**Strengths:**

- Complete control over every pixel
- Efficient for raster operations
- Well-understood, mature API (20+ years)
- Works everywhere in Apple ecosystem
- Direct memory access for custom brush engines

**Weaknesses:**

- CPU-bound (no GPU acceleration)
- Verbose C-based API (though Swift overlay helps)
- Manual memory management for pixel buffers
- No built-in concept of layers, undo, or interaction

**Verdict:** Essential building block. Use for layer bitmaps, brush rendering, compositing. Pair with Metal for GPU acceleration where needed.

### 3.3 Core Image (CIFilter / CIContext)

**Overview:** GPU-accelerated, non-destructive image processing pipeline. 200+ built-in filters.

```swift
let inputImage = CIImage(cgImage: cgImage)
let filter = CIFilter(name: "CIGaussianBlur")!
filter.setValue(inputImage, forKey: kCIInputImageKey)
filter.setValue(10.0, forKey: kCIInputRadiusKey)
let outputImage = filter.outputImage!

// Render to CGImage
let ciContext = CIContext()
let result = ciContext.createCGImage(outputImage, from: outputImage.extent)
```

**Relevant filter categories for a paint app:**

- **Blur:** Gaussian, Box, Motion, Zoom, Masked Variable
- **Color Adjustment:** Brightness, Contrast, Saturation, Hue, Exposure, Gamma, Levels, Curves, White Balance
- **Color Effect:** Sepia, Monochrome, Posterize, Invert, False Color
- **Distortion:** Bump, Pinch, Twirl, Vortex, Hole, Glass
- **Sharpen:** Unsharp Mask, Luminance Sharpen
- **Stylize:** Pixellate, Edges, Bloom, Gloom, Crystallize, Pointillize, Comic Effect
- **Composite:** Source Over, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge/Burn
- **Geometry:** Affine Transform, Crop, Perspective
- **Generator:** Checkerboard, Stripes, Random, Constant Color, Radial/Linear Gradient

**Strengths:**

- GPU-accelerated filter pipeline (assembles JIT kernel)
- Non-destructive — filters chain without intermediate copies
- 200+ built-in filters; custom filters via CIKernel (Metal Shading Language)
- `CIContext` can render to Metal texture, CGImage, or IOSurface
- Automatic color management

**Weaknesses:**

- Filter-oriented, not drawing-oriented
- Latency for first render (JIT compilation)
- Not suitable for interactive brush strokes

**Verdict:** Use for adjustments, effects, and filter layer types. Excellent complement to CGContext-based drawing.

### 3.4 PencilKit (PKCanvasView / PKDrawing)

**Overview:** Apple's high-level drawing framework. Originally iPad-only, expanded to macOS 14.0+.

```swift
import PencilKit

// SwiftUI wrapper
struct PencilCanvasView: NSViewRepresentable {
    @Binding var drawing: PKDrawing

    func makeNSView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.drawing = drawing
        canvas.tool = PKInkingTool(.pen, color: .black, width: 5)
        canvas.drawingPolicy = .anyInput  // mouse, trackpad, stylus
        return canvas
    }

    func updateNSView(_ canvasView: PKCanvasView, context: Context) {
        canvasView.drawing = drawing
    }
}
```

**Key capabilities:**

- Stroke-based vector drawing with realistic ink simulation
- Built-in tool palette (pen, marker, pencil, eraser, ruler, lasso)
- Pressure, tilt, and azimuth sensitivity (Apple Pencil, some styluses)
- `PKDrawing` serializable as Data — simple persistence
- `PKDrawing.image(from:scale:)` — rasterize to UIImage/NSImage
- Undo/redo built-in
- Finger vs pencil distinction (iOS)
- `.drawingPolicy = .anyInput` enables mouse/trackpad drawing on Mac

**Strengths:**

- Extremely fast to integrate — full drawing experience in ~20 lines
- Apple's own ink rendering engine (smooth, low-latency)
- Built-in tool picker UI
- Serialization built-in

**Weaknesses:**

- Limited to stroke-based drawing (no fill, no shape tools beyond freehand)
- No layer support
- No pixel-level manipulation
- No custom brush shapes or textures
- No selection/transform tools beyond built-in lasso
- macOS support is relatively new (14.0+) — may have edge cases
- Opaque implementation — limited customization
- No direct access to underlying bitmap

**Verdict:** Good for annotation/sketch features. Too limited for a full-featured paint app. Could be embedded as one drawing mode alongside custom raster tools.

### 3.5 Metal

**Overview:** Low-level GPU API for custom rendering and compute. Maximum performance.

**Use cases in a paint app:**

- **Brush rendering:** Custom compute shaders for textured brushes with pressure/tilt
- **Layer compositing:** Render layers as textures, composite with blend modes on GPU
- **Real-time filters:** Custom CIKernel or Metal compute shaders
- **Large canvas:** Tile-based rendering with GPU memory management
- **Zoom/pan:** GPU-accelerated canvas viewport rendering

```swift
// Example: GPU brush stamp via compute shader
let computePipeline = try device.makeComputePipelineState(function: brushFunction)
let commandBuffer = commandQueue.makeCommandBuffer()!
let encoder = commandBuffer.makeComputeCommandEncoder()!
encoder.setComputePipelineState(computePipeline)
encoder.setTexture(layerTexture, index: 0)
encoder.setTexture(brushTipTexture, index: 1)
encoder.setBytes(&brushParams, length: MemoryLayout<BrushParams>.size, index: 0)
encoder.dispatchThreadgroups(threadGroupCount, threadsPerThreadgroup: threadGroupSize)
encoder.endEncoding()
commandBuffer.commit()
```

**Strengths:**

- Maximum GPU performance
- Custom brush engines with realistic media simulation
- Parallel compositing of many layers
- Can handle very large canvases (tiled rendering)

**Weaknesses:**

- Significant implementation complexity
- Must manage GPU resources, synchronization, memory
- Debugging is harder than CPU-based approaches
- Overkill for simple apps

**Verdict:** Use selectively — for brush engine performance and large-canvas compositing. Not needed for basic tools. Can adopt incrementally.

### 3.6 Comparison Matrix

| Feature | SwiftUI Canvas | CGContext | Core Image | PencilKit | Metal |
|---|---|---|---|---|---|
| Pixel-level control | No | **Yes** | No | No | **Yes** |
| GPU-accelerated | Partial | No | **Yes** | **Yes** | **Yes** |
| Custom brushes | No | **Yes** | No | No | **Yes** |
| Image filters | Basic | No | **Yes** (200+) | No | **Yes** |
| Layer compositing | No | **Yes** | **Yes** | No | **Yes** |
| Ease of integration | **High** | Medium | Medium | **High** | Low |
| SwiftUI native | **Yes** | Bridged | Bridged | Wrapped | Bridged |
| Off-screen rendering | No | **Yes** | **Yes** | Limited | **Yes** |
| Pressure sensitivity | No | Manual | No | **Yes** | Manual |

---

## 4. File Format Support

### 4.1 ImageIO Framework

ImageIO provides read/write for all common image formats. It's the workhorse for file I/O.

**Supported formats (read):**

| Format | UTType | Notes |
|---|---|---|
| PNG | `.png` | Lossless, transparency |
| JPEG | `.jpeg` | Lossy, no transparency |
| TIFF | `.tiff` | Lossless, layers (limited), 16/32-bit |
| HEIF/HEIC | `.heic` | Modern lossy, HDR, Apple default |
| GIF | `.gif` | Animated, 256 colors |
| BMP | `.bmp` | Uncompressed |
| WebP | `.webP` | Modern lossy/lossless (macOS 13+) |
| PSD | `.psd` (custom) | Photoshop — flattened only via ImageIO |
| RAW | `.rawImage` | Camera RAW (via Core Image RAW filter) |
| SVG | `.svg` | Via WebKit or third-party |
| PDF | `.pdf` | Via PDFKit / Core Graphics |
| ICO | `.ico` | Windows icon |
| ICNS | `.icns` | macOS icon |
| OpenEXR | `.exr` (custom) | HDR imaging |

**Writing images:**

```swift
import ImageIO
import UniformTypeIdentifiers

func saveImage(_ cgImage: CGImage, to url: URL, as type: UTType, quality: CGFloat = 0.9) throws {
    guard let destination = CGImageDestinationCreateWithURL(
        url as CFURL, type.identifier as CFString, 1, nil
    ) else { throw SaveError.cannotCreateDestination }

    let options: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: quality
    ]
    CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)

    guard CGImageDestinationFinalize(destination) else {
        throw SaveError.finalizationFailed
    }
}
```

**Reading images:**

```swift
func loadImage(from url: URL) throws -> CGImage {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else { throw LoadError.cannotLoad }
    return image
}
```

### 4.2 NSImage Capabilities

```swift
// NSImage supports multiple representations
let image = NSImage(contentsOf: url)
let tiffData = image.tiffRepresentation
let bitmapRep = NSBitmapImageRep(data: tiffData!)

// Convert between formats
let pngData = bitmapRep?.representation(using: .png, properties: [:])
let jpegData = bitmapRep?.representation(using: .jpeg, properties: [.compressionFactor: 0.85])
```

### 4.3 Native Document Format

For a paint app's own format (preserving layers, undo history, etc.):

- **Option A: FileWrapper (directory bundle)** — `com.example.paintdoc` containing:
  - `manifest.json` — canvas size, layer order, metadata
  - `layers/` — individual layer PNGs or lossless compressed data
  - `thumbnail.png` — Quick Look preview
  - Use `UTType` with `conformsTo: .package`

- **Option B: Codable + Data** — Single file with header + serialized layers

**FileWrapper approach (recommended):**

```swift
// In ReferenceFileDocument.fileWrapper(snapshot:configuration:)
let root = FileWrapper(directoryWithFileWrappers: [:])
root.addRegularFile(withContents: manifestData, preferredFilename: "manifest.json")

let layersDir = FileWrapper(directoryWithFileWrappers: [:])
for (i, layer) in layers.enumerated() {
    let pngData = layer.bitmap.pngData()
    layersDir.addRegularFile(withContents: pngData, preferredFilename: "layer_\(i).png")
}
root.addFileWrapper(layersDir)
root.preferredFilename = "layers"
return root
```

### 4.4 UniformTypeIdentifiers

Modern file type system (replaces string-based UTIs):

```swift
import UniformTypeIdentifiers

// Declare custom document type
extension UTType {
    static let paintDocument = UTType(exportedAs: "com.example.paint-document",
                                       conformingTo: .package)
}

// Check type conformance
let isPNG = UTType(filenameExtension: "png")?.conforms(to: .image) ?? false
```

---

## 5. Mac Platform Features

### 5.1 Touch Bar (Legacy — pre-M-series external keyboards)

- Relevant for color picker, brush size slider, tool selection
- Implemented via `NSTouchBar` and `NSTouchBarItem`
- SwiftUI: `.touchBar { }` modifier
- Note: Touch Bar is deprecated on current hardware but still supported in software

### 5.2 Trackpad & Mouse

- **Force Touch / pressure sensitivity:** `NSEvent.pressure` (0.0–1.0) on Force Touch trackpads
- **Multi-touch gestures:** Pinch-to-zoom, rotate (via `NSMagnificationGestureRecognizer`, `NSRotationGestureRecognizer`)
- **SwiftUI gestures:** `MagnificationGesture`, `RotationGesture`, `DragGesture`
- **Scroll wheel:** Smooth scrolling for canvas pan
- **Right-click / Control-click:** Context menus for tool options

### 5.3 Apple Pencil (via Sidecar / iPad)

- When using iPad as secondary display via Sidecar, Apple Pencil input is supported
- Pressure, tilt, azimuth data available
- PencilKit or custom `NSEvent` handling

### 5.4 Continuity Camera

- Insert photos directly from iPhone camera into the document
- Available via `NSServicesMenuRequestor` or standard Services menu
- SwiftUI: Accessible through standard Services menu integration

### 5.5 Share Extensions

- `NSSharingServicePicker` for sharing images
- SwiftUI: `ShareLink` view (macOS 13+)

```swift
ShareLink(item: renderedImage, preview: SharePreview("My Painting", image: renderedImage))
```

### 5.6 Quick Look

- Provide `QLPreviewProvider` or a Quick Look thumbnail extension
- Generate preview images from custom document format
- Users can press Space in Finder to preview paint documents

### 5.7 Drag and Drop

- Drag images into canvas from Finder, Photos, web browsers
- Drag layers between documents
- SwiftUI: `.onDrop(of:)`, `.draggable()` modifiers
- AppKit: `NSPasteboardItem`, `NSDraggingDestination`

### 5.8 Menu Bar & Keyboard Shortcuts

**Standard Mac paint/graphics app conventions:**

| Action | Shortcut | Menu |
|---|---|---|
| New | ⌘N | File |
| Open | ⌘O | File |
| Save | ⌘S | File |
| Save As | ⇧⌘S | File |
| Export | ⌥⌘E | File |
| Undo | ⌘Z | Edit |
| Redo | ⇧⌘Z | Edit |
| Cut | ⌘X | Edit |
| Copy | ⌘C | Edit |
| Paste | ⌘V | Edit |
| Select All | ⌘A | Edit |
| Deselect | ⌘D | Edit |
| Zoom In | ⌘+ | View |
| Zoom Out | ⌘- | View |
| Actual Size | ⌘1 | View |
| Fit in Window | ⌘0 | View |
| Toggle Grid | ⌘' | View |
| Brush Size + | ] | Tool |
| Brush Size - | [ | Tool |
| Brush Opacity + | Shift+] | Tool |
| Brush Opacity - | Shift+[ | Tool |
| Default Colors | D | Tool |
| Swap Colors | X | Tool |
| Brush Tool | B | Tool |
| Eraser Tool | E | Tool |
| Selection Tool | M (marquee) / L (lasso) | Tool |
| Move Tool | V | Tool |
| Eyedropper | I | Tool |
| Paint Bucket | G | Tool |
| Text Tool | T | Tool |
| Shape Tool | U | Tool |
| Zoom Tool | Z | Tool |
| Hand/Pan Tool | H (or Space held) | Tool |
| Crop Tool | C | Tool |
| Flip Horizontal | — | Image |
| Flip Vertical | — | Image |
| Rotate 90° CW | — | Image |
| Canvas Size | — | Image |
| Image Size (Resize) | — | Image |

SwiftUI keyboard shortcuts:

```swift
.commands {
    CommandGroup(after: .pasteboard) {
        Button("Select All") { selectAll() }
            .keyboardShortcut("a", modifiers: .command)
    }
    CommandMenu("Tools") {
        Button("Brush") { selectTool(.brush) }
            .keyboardShortcut("b", modifiers: [])
    }
}
```

### 5.9 Color Picker

- `NSColorPanel` — system color picker (color wheel, sliders, crayons, palettes, pencils)
- SwiftUI: `ColorPicker` view
- Supports: RGB, HSB, CMYK, grayscale, custom palette
- Eyedropper built into system color picker
- Custom swatches / palette management

### 5.10 Printing

- `NSPrintOperation` for standard Print dialog
- SwiftUI: `.printable()` or custom `NSViewRepresentable`
- Supports preview, page setup, scale

### 5.11 Full Screen & Window Management

- SwiftUI: `.windowStyle(.automatic)`, `.windowResizability(.contentSize)`
- Stage Manager compatibility
- Split View support

---

## 6. Accessibility

### 6.1 VoiceOver Support

- Canvas area: Provide accessibility label describing canvas state ("Canvas, 3 layers, brush tool selected")
- Tool palette: Standard SwiftUI accessibility labels
- Layer list: Standard list accessibility
- Announce tool changes, color changes, layer operations
- Use `AccessibilityFocusState` for keyboard navigation

```swift
Canvas { context, size in /* drawing */ }
    .accessibilityLabel("Drawing canvas")
    .accessibilityHint("Use selected tool to draw")
    .accessibilityAddTraits(.allowsDirectInteraction)
```

### 6.2 Keyboard Navigation

- Full keyboard access for all tools and panels
- Tab navigation between UI panels
- Arrow keys for nudging selections
- Standard keyboard shortcuts (see section 5.8)
- Custom rotor actions for VoiceOver users

### 6.3 Color Considerations

- High contrast mode support
- Don't rely solely on color to convey information
- Use system colors that adapt to appearance modes
- Support both light and dark mode for UI chrome
- Color-blind friendly default palette options

### 6.4 Dynamic Type / Text Size

- Tool labels and panel text should respect Dynamic Type
- Toolbar icons have minimum 44×44 pt touch/click targets (HIG recommendation)

### 6.5 Alternative Input

- Voice Control: Ensure all UI is navigable via voice commands
- Switch Control: Sequential UI element access
- Head Tracking / Eye Tracking: Compatible with standard accessibility APIs
- Zoom: Ensure UI doesn't break under macOS Zoom accessibility feature

### 6.6 Reduce Motion & Transparency

- Respect `@Environment(\.accessibilityReduceMotion)` — disable marching ants animation, use static selection borders
- Respect `@Environment(\.accessibilityReduceTransparency)` — use opaque panel backgrounds

---

## 7. Recommended Technology Choices

### 7.1 Recommended Architecture

| Component | Technology | Rationale |
|---|---|---|
| **App Framework** | SwiftUI | Modern, declarative, excellent Mac integration |
| **App Structure** | `DocumentGroup` + `ReferenceFileDocument` | Multi-document, automatic file handling, undo support |
| **Drawing Engine** | CGContext (CPU) | Full pixel control, custom brushes, proven approach |
| **Canvas View** | SwiftUI `Canvas` + `NSViewRepresentable` hybrid | Canvas for overlays/guides, NSView wrapper for bitmap display with gesture handling |
| **Layer Compositing** | CGContext (initially), Metal (optimization) | Start simple, optimize later |
| **Image Filters** | Core Image | 200+ built-in GPU-accelerated filters |
| **File I/O** | ImageIO + FileWrapper | Native format support + custom document bundle |
| **Undo System** | `UndoManager` + Command Pattern | Standard Mac undo with named actions |
| **State Management** | `@Observable` + `@Environment` | Modern SwiftUI observation |
| **Color Management** | NSColorPanel + ColorPicker | System-standard color picking |

### 7.2 Recommended Approach Summary

**"Simple but powerful" strategy:**

1. **Start with SwiftUI + CGContext core.** Use SwiftUI for all UI (toolbars, panels, inspectors, menus). Use `CGContext` bitmap contexts for each layer's raster data. Display the composited result in a SwiftUI `Canvas` or via an `NSViewRepresentable` wrapper.

2. **Use `ReferenceFileDocument` with `DocumentGroup`.** This gives you multi-document windowing, standard File menu, automatic dirty tracking, and the `UndoManager` hookup — all for free.

3. **Implement layers as `[CGImage]` or `[Data]` with metadata.** Each layer is a bitmap plus blend mode, opacity, visibility, and name. Composite on CPU initially.

4. **Use Core Image for filters/adjustments.** Don't build blur, sharpen, color adjust from scratch. Chain `CIFilter` operations and render back to the layer.

5. **Use ImageIO for file format support.** Read/write PNG, JPEG, TIFF, HEIF natively. Design a custom `.paintdoc` bundle format using `FileWrapper` for preserving layers.

6. **Adopt Metal incrementally.** If brush performance or compositing becomes a bottleneck, move the brush stamp rendering and layer compositing to Metal compute shaders. This is an optimization, not a prerequisite.

7. **Consider PencilKit as an optional annotation mode.** Embed a `PKCanvasView` for freehand sketching if desired, but don't build the core around it.

### 7.3 Minimum Deployment Target

- **macOS 14.0 (Sonoma)** recommended — provides:
  - SwiftUI 5 with `@Observable` macro
  - PencilKit on Mac
  - Improved `DocumentGroup` APIs
  - `ShareLink`
  - Modern SwiftUI toolbar/inspector APIs
  - Stable `Canvas` view

- **macOS 15.0 (Sequoia)** if targeting latest — provides:
  - `@Entry` macro for environment values
  - Improved window management APIs
  - Enhanced accessibility APIs

### 7.4 Project Structure (Suggested)

```
MacPaintTool/
├── App/
│   └── MacPaintToolApp.swift          // @main, DocumentGroup
├── Models/
│   ├── PaintDocument.swift            // ReferenceFileDocument
│   ├── Layer.swift                     // Layer model
│   ├── Tool.swift                      // Tool enum/definitions
│   ├── BrushSettings.swift            // Brush configuration
│   └── SelectionMask.swift            // Selection state
├── Drawing/
│   ├── DrawingEngine.swift            // CGContext-based drawing core
│   ├── BrushEngine.swift              // Brush stamp rendering
│   ├── LayerCompositor.swift          // Layer compositing pipeline
│   └── Filters/
│       └── CoreImageFilters.swift     // CIFilter wrappers
├── Views/
│   ├── CanvasView.swift               // Main drawing canvas
│   ├── ToolPaletteView.swift          // Tool selection panel
│   ├── LayerPanelView.swift           // Layer list/management
│   ├── ColorPanelView.swift           // Color selection
│   ├── InspectorView.swift            // Tool properties inspector
│   └── Components/
│       ├── BrushSizeSlider.swift
│       └── BlendModePicker.swift
├── Commands/
│   ├── DrawingCommand.swift           // Command pattern for undo
│   ├── EditMenuCommands.swift         // Edit menu
│   └── ToolMenuCommands.swift         // Tool shortcuts
├── Extensions/
│   ├── CGImage+Extensions.swift
│   ├── CGContext+Extensions.swift
│   └── UTType+PaintDocument.swift
└── Resources/
    ├── Assets.xcassets
    └── Brushes/                        // Brush tip textures
```

---

## 8. Key Discoveries

### Evidence-Backed Findings

1. **SwiftUI `Canvas` + `GraphicsContext.withCGContext()`** provides a clean bridge between SwiftUI's declarative world and Core Graphics' imperative drawing. This is the key integration point. (Source: Apple SwiftUI docs, Context7)

2. **`ReferenceFileDocument`** is the correct document architecture choice. Value-type `FileDocument` auto-registers undo but lacks the flexibility needed for complex mutable state like layers and drawing history. (Source: Apple SwiftUI docs, Context7)

3. **Core Image assembles a JIT-compiled GPU pipeline** — chaining multiple filters doesn't proportionally increase processing time. This means offering many adjustment/filter options is nearly free in performance terms. (Source: Wikipedia Core Image article, Apple docs)

4. **PencilKit on macOS (14.0+)** supports mouse and trackpad input via `.drawingPolicy = .anyInput`, making it viable on Mac despite originating as an iPad framework. However, it lacks layers, custom brushes, and pixel manipulation. (Source: Apple PencilKit docs)

5. **ImageIO natively supports 10+ image formats** for both read and write, including modern formats like HEIF and WebP. No third-party libraries needed for standard image format support.

---

## 9. Outstanding Questions / Clarifications Needed

- [ ] Should the app support stylus input beyond trackpad pressure sensitivity? (Wacom, Astropad, etc.)
- [ ] Is iPad companion app (Universal Purchase) in scope, or Mac-only?
- [ ] Target minimum macOS version preference (14.0 recommended, 13.0 possible with limitations)
- [ ] What is the expected maximum canvas size? (Affects whether Metal is needed early)
- [ ] Should the app include vector drawing tools, or is it purely raster/bitmap?
- [ ] Is App Store distribution planned? (Affects sandboxing, entitlement, and file access design)

---

## 10. Next Research (Not Completed)

- [ ] Research Wacom stylus SDK and driver-level pressure/tilt integration on macOS
- [ ] Investigate `NSView` vs SwiftUI `Canvas` performance benchmarks for real-time brush rendering
- [ ] Research tile-based rendering patterns for large canvases (10000×10000+)
- [ ] Explore existing open-source Mac paint app codebases for architecture patterns
- [ ] Research Metal compute shader brush engine implementations
- [ ] Investigate `IOSurface` sharing between Core Image and Metal for zero-copy compositing
