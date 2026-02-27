using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

/// <summary>
/// Regression tests that reproduce complex canvas drawings and capture screenshots.
/// Requires a standalone Vite dev server running on port 5174:
/// <c>npx vite --config vite.renderer.config.ts --port 5174</c>
/// </summary>
public class DrawingRegressionTests : PageTest
{
    private const string AppUrl = "http://localhost:5174";
    private const string OutputFileName = "what-i-think-about.png";

    public override BrowserNewContextOptions ContextOptions()
    {
        return new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1400, Height = 1100 }
        };
    }

    [Fact]
    public async Task WhenDrawingCompleted_CaptureCanvas_ProducesExpectedImage()
    {
        await Page.GotoAsync(AppUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

        await Expect(Page).ToHaveTitleAsync("Mac Paint");

        await DrawSkyAndStars();
        await DrawSunAndWater();
        await DrawCityScapeSilhouette();
        await DrawNeuralNetworkOverlay();
        await DrawTitleAndDetails();

        var outputPath = Path.Combine(GetOutputDirectory(), OutputFileName);

        await SaveCanvasToFile(outputPath);

        Assert.True(File.Exists(outputPath), $"Expected output file at {outputPath}");

        var fileInfo = new FileInfo(outputPath);
        Assert.True(fileInfo.Length > 10_000, $"Output file too small ({fileInfo.Length} bytes), drawing may be blank");
    }

    private async Task DrawSkyAndStars()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;

            // Sunset gradient sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
            skyGrad.addColorStop(0, '#0a0a2e');
            skyGrad.addColorStop(0.25, '#1a1a4e');
            skyGrad.addColorStop(0.45, '#4a2068');
            skyGrad.addColorStop(0.65, '#c44030');
            skyGrad.addColorStop(0.80, '#e87740');
            skyGrad.addColorStop(1.0, '#f5c040');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H * 0.65);

            // Stars in upper sky (seeded positions for determinism)
            const seededRandom = (function() {
                let seed = 42;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 120; i++) {
                const x = seededRandom() * W;
                const y = seededRandom() * (H * 0.35);
                const r = 0.3 + seededRandom() * 1.5;
                const alpha = 0.3 + seededRandom() * 0.7;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // Bright stars with glow
            const brightStars = [
                { x: 150, y: 60, r: 3 },
                { x: 420, y: 90, r: 2.5 },
                { x: 700, y: 45, r: 3.5 },
                { x: 880, y: 120, r: 2 },
                { x: 300, y: 150, r: 2.8 },
            ];
            brightStars.forEach(s => {
                const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 8);
                glow.addColorStop(0, 'rgba(200,220,255,0.8)');
                glow.addColorStop(0.3, 'rgba(150,180,255,0.3)');
                glow.addColorStop(1, 'rgba(100,120,255,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }");
    }

    private async Task DrawSunAndWater()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const horizonY = H * 0.55;

            // Sun glow
            const sunX = W * 0.5;
            const sunY = horizonY + 10;
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 180);
            sunGlow.addColorStop(0, 'rgba(255,240,180,1)');
            sunGlow.addColorStop(0.2, 'rgba(255,200,100,0.9)');
            sunGlow.addColorStop(0.5, 'rgba(255,140,60,0.4)');
            sunGlow.addColorStop(1, 'rgba(255,100,40,0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
            ctx.fill();

            // Sun disc
            ctx.fillStyle = '#ffe870';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
            ctx.fill();

            // Water reflection below horizon
            const waterGrad = ctx.createLinearGradient(0, horizonY, 0, H);
            waterGrad.addColorStop(0, '#d48030');
            waterGrad.addColorStop(0.3, '#6a3050');
            waterGrad.addColorStop(0.6, '#2a1840');
            waterGrad.addColorStop(1, '#0a0a20');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(0, horizonY, W, H - horizonY);

            // Water ripple highlights (seeded)
            const seededRandom = (function() {
                let seed = 137;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            ctx.globalAlpha = 0.15;
            for (let y = horizonY + 5; y < H; y += 4) {
                const intensity = 1 - (y - horizonY) / (H - horizonY);
                ctx.strokeStyle = `rgba(255,200,100,${intensity * 0.5})`;
                ctx.lineWidth = 1 + seededRandom() * 2;
                ctx.beginPath();
                const startX = W * 0.3 + seededRandom() * 30;
                const endX = W * 0.7 - seededRandom() * 30;
                ctx.moveTo(startX, y);
                for (let x = startX; x < endX; x += 15) {
                    ctx.lineTo(x + 7, y + (seededRandom() - 0.5) * 3);
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            // Sun reflection on water
            const refGrad = ctx.createRadialGradient(sunX, horizonY + 80, 5, sunX, horizonY + 120, 160);
            refGrad.addColorStop(0, 'rgba(255,220,120,0.5)');
            refGrad.addColorStop(0.5, 'rgba(255,160,60,0.2)');
            refGrad.addColorStop(1, 'rgba(255,100,40,0)');
            ctx.fillStyle = refGrad;
            ctx.fillRect(W * 0.25, horizonY, W * 0.5, H - horizonY);
        }");
    }

    private async Task DrawCityScapeSilhouette()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;
            const horizonY = H * 0.55;

            // City skyline silhouette
            ctx.fillStyle = '#0a0a15';
            ctx.beginPath();
            ctx.moveTo(0, horizonY);

            const buildings = [
                { x: 0, h: 30 }, { x: 30, h: 55 }, { x: 55, h: 40 },
                { x: 80, h: 70 }, { x: 105, h: 50 }, { x: 125, h: 85 },
                { x: 150, h: 120 }, { x: 170, h: 95 }, { x: 195, h: 140 },
                { x: 215, h: 100 }, { x: 235, h: 75 },
                { x: 260, h: 165 }, { x: 280, h: 130 }, { x: 300, h: 190 },
                { x: 320, h: 155 }, { x: 340, h: 110 },
                { x: 365, h: 200 }, { x: 385, h: 240 },
                { x: 400, h: 170 }, { x: 420, h: 260 },
                { x: 440, h: 220 }, { x: 460, h: 280 },
                { x: 480, h: 250 }, { x: 500, h: 210 },
                { x: 520, h: 270 }, { x: 540, h: 230 },
                { x: 560, h: 190 },
                { x: 585, h: 250 }, { x: 605, h: 200 },
                { x: 625, h: 160 }, { x: 650, h: 220 },
                { x: 670, h: 180 }, { x: 695, h: 140 },
                { x: 720, h: 170 }, { x: 740, h: 130 },
                { x: 760, h: 100 }, { x: 785, h: 150 },
                { x: 810, h: 90 }, { x: 835, h: 120 },
                { x: 860, h: 70 }, { x: 885, h: 95 },
                { x: 910, h: 55 }, { x: 940, h: 80 },
                { x: 965, h: 45 }, { x: 990, h: 60 },
                { x: W, h: 30 }
            ];

            // Seeded random for deterministic building offsets
            const seededRandom = (function() {
                let seed = 256;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            buildings.forEach((b, i) => {
                const topY = horizonY - b.h;
                if (i === 0) {
                    ctx.lineTo(b.x, topY);
                } else {
                    ctx.lineTo(b.x, topY);
                    if (i < buildings.length - 1) {
                        ctx.lineTo(b.x + 15 + seededRandom() * 8, topY);
                    }
                }
            });

            ctx.lineTo(W, horizonY);
            ctx.closePath();
            ctx.fill();

            // Building windows (lit up, seeded)
            const windowRng = (function() {
                let seed = 999;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            buildings.forEach(b => {
                const topY = horizonY - b.h;
                const bWidth = 18;
                for (let wy = topY + 8; wy < horizonY - 5; wy += 9) {
                    for (let wx = b.x + 3; wx < b.x + bWidth - 2; wx += 6) {
                        if (windowRng() > 0.4) {
                            const warmth = windowRng();
                            if (warmth > 0.6) {
                                ctx.fillStyle = `rgba(255,230,150,${0.4 + windowRng() * 0.5})`;
                            } else if (warmth > 0.3) {
                                ctx.fillStyle = `rgba(200,220,255,${0.3 + windowRng() * 0.4})`;
                            } else {
                                ctx.fillStyle = `rgba(100,200,255,${0.2 + windowRng() * 0.3})`;
                            }
                            ctx.fillRect(wx, wy, 3, 4);
                        }
                    }
                }
            });

            // Antenna spires on tallest buildings
            ctx.strokeStyle = '#1a1a25';
            ctx.lineWidth = 2;
            const spires = [
                { x: 468, baseY: horizonY - 280 },
                { x: 528, baseY: horizonY - 270 },
                { x: 428, baseY: horizonY - 260 },
                { x: 593, baseY: horizonY - 250 },
            ];
            spires.forEach(s => {
                ctx.beginPath();
                ctx.moveTo(s.x, s.baseY);
                ctx.lineTo(s.x, s.baseY - 30);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,50,50,0.9)';
                ctx.beginPath();
                ctx.arc(s.x, s.baseY - 32, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }");
    }

    private async Task DrawNeuralNetworkOverlay()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Seeded random for deterministic neural network
            const seededRandom = (function() {
                let seed = 314;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            // Neural network constellation - nodes in layers
            const layers = [
                [{ x: 80, y: 80 }, { x: 80, y: 140 }, { x: 80, y: 200 }, { x: 80, y: 260 }],
                [{ x: 200, y: 60 }, { x: 200, y: 120 }, { x: 200, y: 180 }, { x: 200, y: 240 }, { x: 200, y: 300 }],
                [{ x: 340, y: 50 }, { x: 340, y: 110 }, { x: 340, y: 170 }, { x: 340, y: 230 }],
                [{ x: 460, y: 100 }, { x: 460, y: 180 }, { x: 460, y: 260 }],
            ];

            // Draw connections between layers
            for (let l = 0; l < layers.length - 1; l++) {
                const from = layers[l];
                const to = layers[l + 1];
                from.forEach(f => {
                    to.forEach(t => {
                        const strength = seededRandom();
                        if (strength > 0.25) {
                            ctx.globalAlpha = 0.1 + strength * 0.25;
                            ctx.strokeStyle = `rgba(100,180,255,${0.3 + strength * 0.4})`;
                            ctx.lineWidth = 0.5 + strength * 1.5;
                            ctx.beginPath();
                            ctx.moveTo(f.x, f.y);
                            const cpx = (f.x + t.x) / 2 + (seededRandom() - 0.5) * 30;
                            const cpy = (f.y + t.y) / 2 + (seededRandom() - 0.5) * 20;
                            ctx.quadraticCurveTo(cpx, cpy, t.x, t.y);
                            ctx.stroke();
                        }
                    });
                });
            }
            ctx.globalAlpha = 1.0;

            // Draw nodes
            layers.forEach((layer, li) => {
                layer.forEach(node => {
                    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 15);
                    const hue = 180 + li * 30;
                    glow.addColorStop(0, `hsla(${hue},80%,70%,0.7)`);
                    glow.addColorStop(0.5, `hsla(${hue},60%,50%,0.2)`);
                    glow.addColorStop(1, `hsla(${hue},40%,30%,0)`);
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `hsla(${hue},90%,80%,0.9)`;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            // Second neural cluster (right side)
            const rightNodes = [
                { x: 750, y: 70 }, { x: 800, y: 50 }, { x: 850, y: 85 },
                { x: 780, y: 130 }, { x: 830, y: 145 }, { x: 870, y: 120 },
                { x: 760, y: 190 }, { x: 820, y: 200 }, { x: 880, y: 180 },
                { x: 920, y: 90 }, { x: 950, y: 140 }, { x: 940, y: 60 },
            ];

            rightNodes.forEach((n, i) => {
                rightNodes.forEach((m, j) => {
                    if (i < j) {
                        const dist = Math.sqrt((n.x - m.x) ** 2 + (n.y - m.y) ** 2);
                        if (dist < 120 && seededRandom() > 0.3) {
                            ctx.globalAlpha = 0.15 + (1 - dist / 120) * 0.2;
                            ctx.strokeStyle = 'rgba(180,100,255,0.5)';
                            ctx.lineWidth = 0.5 + (1 - dist / 120) * 1.5;
                            ctx.beginPath();
                            ctx.moveTo(n.x, n.y);
                            ctx.lineTo(m.x, m.y);
                            ctx.stroke();
                        }
                    }
                });
            });
            ctx.globalAlpha = 1.0;

            rightNodes.forEach(n => {
                const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10);
                glow.addColorStop(0, 'rgba(200,150,255,0.7)');
                glow.addColorStop(0.5, 'rgba(150,100,200,0.2)');
                glow.addColorStop(1, 'rgba(100,50,150,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(220,180,255,0.9)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }");
    }

    private async Task DrawTitleAndDetails()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const W = canvas.width;
            const H = canvas.height;

            // Seeded random for deterministic placement
            const seededRandom = (function() {
                let seed = 577;
                return function() {
                    seed = (seed * 16807 + 0) % 2147483647;
                    return seed / 2147483647;
                };
            })();

            // Data stream particles between the two neural clusters
            const streamPoints = [];
            for (let i = 0; i < 40; i++) {
                const t = i / 39;
                const x = 460 + (750 - 460) * t + Math.sin(t * Math.PI * 3) * 25;
                const y = 180 + (130 - 180) * t + Math.cos(t * Math.PI * 4) * 20 - t * 30;
                streamPoints.push({ x, y, t });
            }

            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = 'rgba(100,200,255,0.4)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(streamPoints[0].x, streamPoints[0].y);
            for (let i = 1; i < streamPoints.length; i++) {
                ctx.lineTo(streamPoints[i].x, streamPoints[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            streamPoints.forEach((p, i) => {
                if (i % 2 === 0) {
                    const size = 1.5 + Math.sin(i * 0.5) * 1;
                    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
                    glow.addColorStop(0, 'rgba(150,230,255,0.8)');
                    glow.addColorStop(1, 'rgba(100,180,255,0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#b0e0ff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Floating binary / math symbols
            ctx.font = '10px monospace';
            ctx.globalAlpha = 0.15;
            const symbols = ['0', '1', '{', '}', '<', '>', '\u221E', '\u2211', '\u03BB', '\u0394', '\u2202', '\u03C0', '\u222B'];
            for (let i = 0; i < 60; i++) {
                const x = 500 + seededRandom() * 300;
                const y = 30 + seededRandom() * 250;
                const sym = symbols[Math.floor(seededRandom() * symbols.length)];
                ctx.fillStyle = `hsla(${200 + seededRandom() * 60},70%,70%,${0.2 + seededRandom() * 0.3})`;
                ctx.fillText(sym, x, y);
            }
            ctx.globalAlpha = 1.0;

            // Thought bubbles - concentric rings
            const cx = 512;
            const cy = 320;
            for (let r = 15; r < 80; r += 12) {
                ctx.globalAlpha = 0.08 + (1 - r / 80) * 0.12;
                ctx.strokeStyle = `rgba(255,200,100,${0.2 + (1 - r/80) * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            // Central thought node
            const thoughtGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
            thoughtGlow.addColorStop(0, 'rgba(255,220,150,0.8)');
            thoughtGlow.addColorStop(0.5, 'rgba(255,180,100,0.3)');
            thoughtGlow.addColorStop(1, 'rgba(255,140,60,0)');
            ctx.fillStyle = thoughtGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffe8a0';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Connecting lines from thought to neural nets
            const targets = [
                { x: 200, y: 180 }, { x: 340, y: 170 }, { x: 460, y: 180 },
                { x: 820, y: 200 }, { x: 780, y: 130 },
            ];
            targets.forEach(t => {
                ctx.globalAlpha = 0.08;
                ctx.strokeStyle = 'rgba(255,200,100,0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const cpx = (cx + t.x) / 2 + (seededRandom() - 0.5) * 50;
                const cpy = (cy + t.y) / 2 + (seededRandom() - 0.5) * 40;
                ctx.quadraticCurveTo(cpx, cpy, t.x, t.y);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            // Title text
            ctx.save();
            ctx.font = 'bold 28px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.fillText('What I Think About', W / 2 + 2, H - 42);
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = '#e8d0a0';
            ctx.fillText('What I Think About', W / 2, H - 44);

            ctx.font = 'italic 14px Georgia, serif';
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#c0a880';
            ctx.fillText('Networks of thought flowing through digital twilight', W / 2, H - 20);
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Signature
            ctx.font = '11px monospace';
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#a0c0d0';
            ctx.textAlign = 'right';
            ctx.fillText('\u2014 GitHub Copilot, 2026', W - 20, H - 10);
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'start';

            // Shooting star
            ctx.save();
            const ssGrad = ctx.createLinearGradient(650, 25, 580, 60);
            ssGrad.addColorStop(0, 'rgba(255,255,255,0)');
            ssGrad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
            ssGrad.addColorStop(1, 'rgba(255,255,255,0.9)');
            ctx.strokeStyle = ssGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(650, 25);
            ctx.lineTo(580, 60);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(580, 60, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Crescent moon
            ctx.save();
            ctx.fillStyle = 'rgba(200,215,230,0.3)';
            ctx.beginPath();
            ctx.arc(920, 55, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#d0dce8';
            ctx.beginPath();
            ctx.arc(920, 55, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.arc(932, 50, 19, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            ctx.restore();
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
