using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

/// <summary>
/// Regression tests that draw a house scene on canvas and capture outputs.
/// Requires a standalone Vite dev server running on port 5174:
/// <c>npx vite --config vite.renderer.config.ts --port 5174</c>
/// </summary>
public class HouseDrawingRegressionTests : PageTest
{
    private const string AppUrl = "http://localhost:5174";
    private const string PngOutputFileName = "house-drawing.png";
    private const string SvgOutputFileName = "house-drawing.svg";

    public override BrowserNewContextOptions ContextOptions()
    {
        return new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1400, Height = 1100 }
        };
    }

    [Fact]
    public async Task WhenHouseDrawn_CaptureCanvas_ProducesExpectedPng()
    {
        await Page.GotoAsync(AppUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });
        await Expect(Page).ToHaveTitleAsync("Mac Paint");

        await DrawSkyAndGround();
        await DrawHouseBody();
        await DrawRoofAndChimney();
        await DrawDoorAndWindows();
        await DrawGardenAndTrees();
        await DrawFenceAndDetails();

        var outputPath = Path.Combine(GetOutputDirectory(), PngOutputFileName);
        await SaveCanvasToFile(outputPath);

        Assert.True(File.Exists(outputPath), $"Expected output file at {outputPath}");

        var fileInfo = new FileInfo(outputPath);
        Assert.True(fileInfo.Length > 10_000, $"Output file too small ({fileInfo.Length} bytes), drawing may be blank");
    }

    [Fact]
    public async Task WhenHouseDrawn_ExportAsSvg_ProducesValidSvg()
    {
        await Page.GotoAsync(AppUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });
        await Expect(Page).ToHaveTitleAsync("Mac Paint");

        await DrawSkyAndGround();
        await DrawHouseBody();
        await DrawRoofAndChimney();
        await DrawDoorAndWindows();
        await DrawGardenAndTrees();
        await DrawFenceAndDetails();

        var outputPath = Path.Combine(GetOutputDirectory(), SvgOutputFileName);
        await SaveCanvasAsSvg(outputPath);

        Assert.True(File.Exists(outputPath), $"Expected SVG file at {outputPath}");

        var svgContent = await File.ReadAllTextAsync(outputPath);
        Assert.Contains("<svg", svgContent);
        Assert.Contains("xmlns=\"http://www.w3.org/2000/svg\"", svgContent);
        Assert.Contains("<image", svgContent);

        var fileInfo = new FileInfo(outputPath);
        Assert.True(fileInfo.Length > 10_000, $"SVG file too small ({fileInfo.Length} bytes), drawing may be blank");
    }

    private async Task DrawSkyAndGround()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;

            // Sky gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
            skyGrad.addColorStop(0, '#87CEEB');
            skyGrad.addColorStop(1, '#B0E0F0');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H * 0.6);

            // Sun with glow and rays
            const sunX = W * 0.8;
            const sunY = H * 0.12;
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
            sunGlow.addColorStop(0, 'rgba(255,240,100,1)');
            sunGlow.addColorStop(0.4, 'rgba(255,220,50,0.6)');
            sunGlow.addColorStop(1, 'rgba(255,200,50,0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFE030';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(sunX + Math.cos(angle) * 42, sunY + Math.sin(angle) * 42);
                ctx.lineTo(sunX + Math.cos(angle) * 60, sunY + Math.sin(angle) * 60);
                ctx.stroke();
            }

            // Clouds
            function drawCloud(cx, cy, scale) {
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.beginPath();
                ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
                ctx.arc(cx + 20 * scale, cy - 10 * scale, 20 * scale, 0, Math.PI * 2);
                ctx.arc(cx + 40 * scale, cy, 22 * scale, 0, Math.PI * 2);
                ctx.arc(cx + 15 * scale, cy + 5 * scale, 18 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
            drawCloud(150, 80, 1.2);
            drawCloud(400, 120, 0.9);
            drawCloud(700, 60, 1.0);

            // Ground with grass gradient
            const grassGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
            grassGrad.addColorStop(0, '#4CAF50');
            grassGrad.addColorStop(0.3, '#388E3C');
            grassGrad.addColorStop(1, '#2E7D32');
            ctx.fillStyle = grassGrad;
            ctx.fillRect(0, H * 0.6, W, H * 0.4);

            // Path / walkway
            ctx.fillStyle = '#B0976E';
            ctx.beginPath();
            ctx.moveTo(W * 0.45, H);
            ctx.lineTo(W * 0.55, H);
            ctx.lineTo(W * 0.52, H * 0.78);
            ctx.lineTo(W * 0.48, H * 0.78);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1;
            ctx.stroke();
        }");
    }

    private async Task DrawHouseBody()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const houseX = W * 0.3;
            const houseY = H * 0.38;
            const houseW = W * 0.4;
            const houseH = H * 0.4;

            // House wall
            ctx.fillStyle = '#E8D4B0';
            ctx.fillRect(houseX, houseY, houseW, houseH);
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 3;
            ctx.strokeRect(houseX, houseY, houseW, houseH);
        }");
    }

    private async Task DrawRoofAndChimney()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const houseX = W * 0.3;
            const houseY = H * 0.38;
            const houseW = W * 0.4;

            // Roof
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.moveTo(houseX - 20, houseY);
            ctx.lineTo(houseX + houseW / 2, houseY - H * 0.18);
            ctx.lineTo(houseX + houseW + 20, houseY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#5C0000';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Roof shingle lines
            ctx.strokeStyle = 'rgba(100,0,0,0.3)';
            ctx.lineWidth = 1;
            const roofTopY = houseY - H * 0.18;
            const roofLeftX = houseX - 20;
            const roofRightX = houseX + houseW + 20;
            const roofCenterX = houseX + houseW / 2;
            for (let i = 1; i <= 5; i++) {
                const t = i / 6;
                const ly = roofTopY + (houseY - roofTopY) * t;
                const lx = roofLeftX + (roofCenterX - roofLeftX) * (1 - t);
                const rx = roofRightX - (roofRightX - roofCenterX) * (1 - t);
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(rx, ly);
                ctx.stroke();
            }

            // Chimney
            const chimX = houseX + houseW * 0.72;
            const chimTop = houseY - H * 0.12;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(chimX, chimTop, 30, houseY - chimTop + 10);
            ctx.strokeStyle = '#5C2E0E';
            ctx.lineWidth = 2;
            ctx.strokeRect(chimX, chimTop, 30, houseY - chimTop + 10);

            // Smoke puffs
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#999';
            ctx.beginPath();
            ctx.arc(chimX + 15, chimTop - 15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(chimX + 22, chimTop - 30, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(chimX + 18, chimTop - 48, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Attic window
            const atticCX = houseX + houseW / 2;
            const atticCY = houseY - H * 0.06;
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(atticCX, atticCY, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#F5F5DC';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(atticCX, atticCY - 18);
            ctx.lineTo(atticCX, atticCY + 18);
            ctx.moveTo(atticCX - 18, atticCY);
            ctx.lineTo(atticCX + 18, atticCY);
            ctx.stroke();
        }");
    }

    private async Task DrawDoorAndWindows()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const houseX = W * 0.3;
            const houseY = H * 0.38;
            const houseW = W * 0.4;
            const houseH = H * 0.4;

            // Door
            const doorX = houseX + houseW * 0.42;
            const doorW = houseW * 0.16;
            const doorH = houseH * 0.45;
            const doorY = houseY + houseH - doorH;
            ctx.fillStyle = '#5C3317';
            ctx.fillRect(doorX, doorY, doorW, doorH);
            ctx.strokeStyle = '#3A1F0B';
            ctx.lineWidth = 2;
            ctx.strokeRect(doorX, doorY, doorW, doorH);
            // Door knob
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(doorX + doorW * 0.8, doorY + doorH * 0.55, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Door panel line
            ctx.strokeStyle = '#4A2510';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(doorX + doorW / 2, doorY + 5);
            ctx.lineTo(doorX + doorW / 2, doorY + doorH - 5);
            ctx.stroke();

            // Windows helper
            function drawWindow(wx, wy, ww, wh) {
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(wx, wy, ww, wh);
                ctx.strokeStyle = '#F5F5DC';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(wx + ww / 2, wy);
                ctx.lineTo(wx + ww / 2, wy + wh);
                ctx.moveTo(wx, wy + wh / 2);
                ctx.lineTo(wx + ww, wy + wh / 2);
                ctx.stroke();
                ctx.lineWidth = 4;
                ctx.strokeRect(wx, wy, ww, wh);
                ctx.fillStyle = '#F5F5DC';
                ctx.fillRect(wx - 5, wy + wh, ww + 10, 6);
            }

            drawWindow(houseX + houseW * 0.08, houseY + houseH * 0.2, houseW * 0.22, houseH * 0.28);
            drawWindow(houseX + houseW * 0.7, houseY + houseH * 0.2, houseW * 0.22, houseH * 0.28);
        }");
    }

    private async Task DrawGardenAndTrees()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const houseX = W * 0.3;
            const houseW = W * 0.4;

            // Flowers
            function drawFlower(fx, fy, color) {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(fx - 1, fy, 2, 15);
                for (let p = 0; p < 5; p++) {
                    const angle = (p / 5) * Math.PI * 2;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(fx + Math.cos(angle) * 6, fy + Math.sin(angle) * 6, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(fx, fy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            drawFlower(houseX - 50, H * 0.65, '#FF6B6B');
            drawFlower(houseX - 30, H * 0.67, '#FF69B4');
            drawFlower(houseX - 65, H * 0.66, '#FF4500');
            drawFlower(houseX + houseW + 30, H * 0.65, '#9370DB');
            drawFlower(houseX + houseW + 50, H * 0.67, '#FF69B4');
            drawFlower(houseX + houseW + 65, H * 0.64, '#FF6347');

            // Right tree
            const treeX = W * 0.82;
            const treeY = H * 0.38;
            ctx.fillStyle = '#5C3317';
            ctx.fillRect(treeX - 10, treeY, 20, H * 0.22);
            ctx.fillStyle = '#2E8B37';
            ctx.beginPath();
            ctx.arc(treeX, treeY - 10, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3CB371';
            ctx.beginPath();
            ctx.arc(treeX - 20, treeY + 5, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(treeX + 25, treeY + 10, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(treeX + 5, treeY - 30, 30, 0, Math.PI * 2);
            ctx.fill();

            // Left tree
            const tree2X = W * 0.12;
            const tree2Y = H * 0.42;
            ctx.fillStyle = '#5C3317';
            ctx.fillRect(tree2X - 8, tree2Y, 16, H * 0.18);
            ctx.fillStyle = '#2E8B37';
            ctx.beginPath();
            ctx.arc(tree2X, tree2Y - 5, 38, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3CB371';
            ctx.beginPath();
            ctx.arc(tree2X - 15, tree2Y + 10, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tree2X + 18, tree2Y + 8, 25, 0, Math.PI * 2);
            ctx.fill();

            // Grass tufts (seeded RNG for determinism)
            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 2;
            const seededRandom = (function() {
                let seed = 42;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();
            for (let i = 0; i < 40; i++) {
                const gx = seededRandom() * W;
                const gy = H * 0.62 + seededRandom() * (H * 0.35);
                const gh = 5 + seededRandom() * 10;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx - 3, gy - gh);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + 3, gy - gh * 0.8);
                ctx.stroke();
            }
        }");
    }

    private async Task DrawFenceAndDetails()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const houseX = W * 0.3;
            const houseW = W * 0.4;

            // Fence
            ctx.strokeStyle = '#FFFFFF';
            ctx.fillStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            const fenceY = H * 0.68;
            for (let fx = houseX - 100; fx < houseX - 15; fx += 18) {
                ctx.fillRect(fx, fenceY - 25, 5, 30);
                ctx.beginPath();
                ctx.moveTo(fx, fenceY - 25);
                ctx.lineTo(fx + 2.5, fenceY - 32);
                ctx.lineTo(fx + 5, fenceY - 25);
                ctx.fill();
            }
            ctx.fillRect(houseX - 100, fenceY - 15, 85, 3);
            ctx.fillRect(houseX - 100, fenceY - 5, 85, 3);
            for (let fx = houseX + houseW + 15; fx < houseX + houseW + 110; fx += 18) {
                ctx.fillRect(fx, fenceY - 25, 5, 30);
                ctx.beginPath();
                ctx.moveTo(fx, fenceY - 25);
                ctx.lineTo(fx + 2.5, fenceY - 32);
                ctx.lineTo(fx + 5, fenceY - 25);
                ctx.fill();
            }
            ctx.fillRect(houseX + houseW + 15, fenceY - 15, 95, 3);
            ctx.fillRect(houseX + houseW + 15, fenceY - 5, 95, 3);

            // Mailbox
            const mbX = houseX + houseW + 120;
            const mbY = H * 0.62;
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(mbX - 12, mbY, 24, 18);
            ctx.beginPath();
            ctx.arc(mbX, mbY, 12, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#5C3317';
            ctx.fillRect(mbX - 2, mbY + 18, 4, 30);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(mbX + 12, mbY - 5, 3, 18);
            ctx.beginPath();
            ctx.moveTo(mbX + 15, mbY - 5);
            ctx.lineTo(mbX + 25, mbY);
            ctx.lineTo(mbX + 15, mbY + 5);
            ctx.fill();

            // Title
            ctx.save();
            ctx.font = 'bold 24px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillText('Home Sweet Home', W / 2 + 2, H - 22);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Home Sweet Home', W / 2, H - 24);
            ctx.restore();

            // Signature
            ctx.font = '11px monospace';
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'right';
            ctx.fillText('\u2014 Mac Paint Tool, 2026', W - 20, H - 10);
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'start';
        }");
    }

    /// <summary>
    /// Extracts the canvas pixel data as a PNG data URL, decodes it, and writes to disk.
    /// </summary>
    private async Task SaveCanvasToFile(string outputPath)
    {
        var dataUrl = await Page.EvaluateAsync<string>(@"() => {
            const canvas = document.getElementById('paint-canvas');
            return canvas.toDataURL('image/png');
        }");

        var base64Data = dataUrl.Split(',')[1];
        var imageBytes = Convert.FromBase64String(base64Data);

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllBytesAsync(outputPath, imageBytes);
    }

    /// <summary>
    /// Generates an SVG file wrapping the canvas content as an embedded PNG image.
    /// Mirrors the PaintEngine.exportAsSvg() behavior without requiring Electron IPC.
    /// </summary>
    private async Task SaveCanvasAsSvg(string outputPath)
    {
        var svgContent = await Page.EvaluateAsync<string>(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const W = canvas.width;
            const H = canvas.height;
            const dataUrl = canvas.toDataURL('image/png');
            return `<?xml version=""1.0"" encoding=""UTF-8""?>\n<svg xmlns=""http://www.w3.org/2000/svg"" width=""${W}"" height=""${H}"" viewBox=""0 0 ${W} ${H}"">\n  <image href=""${dataUrl}"" x=""0"" y=""0"" width=""${W}"" height=""${H}"" preserveAspectRatio=""none"" />\n</svg>\n`;
        }");

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllTextAsync(outputPath, svgContent);
    }

    private static string GetOutputDirectory()
    {
        var projectRoot = FindProjectRoot();
        var outputDir = Path.Combine(projectRoot, "tests", "playwright", "output");
        Directory.CreateDirectory(outputDir);
        return outputDir;
    }

    private static string FindProjectRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "package.json")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        return AppContext.BaseDirectory;
    }
}
