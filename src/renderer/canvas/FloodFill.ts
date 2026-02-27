export interface FillColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function colorDistance(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2 + (a1 - a2) ** 2);
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: FillColor,
  tolerance: number
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return;

  const startIdx = (sy * width + sx) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  if (colorDistance(targetR, targetG, targetB, targetA,
                    fillColor.r, fillColor.g, fillColor.b, fillColor.a) <= tolerance) {
    return;
  }

  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  stack.push(sx, sy);

  while (stack.length >= 2) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y * width + x]) continue;

    const idx = (y * width + x) * 4;
    if (colorDistance(data[idx], data[idx + 1], data[idx + 2], data[idx + 3],
                      targetR, targetG, targetB, targetA) > tolerance) {
      continue;
    }

    let left = x;
    while (left > 0) {
      const li = (y * width + left - 1) * 4;
      if (visited[y * width + left - 1] ||
          colorDistance(data[li], data[li + 1], data[li + 2], data[li + 3],
                        targetR, targetG, targetB, targetA) > tolerance) break;
      left--;
    }

    let right = x;
    while (right < width - 1) {
      const ri = (y * width + right + 1) * 4;
      if (visited[y * width + right + 1] ||
          colorDistance(data[ri], data[ri + 1], data[ri + 2], data[ri + 3],
                        targetR, targetG, targetB, targetA) > tolerance) break;
      right++;
    }

    for (let i = left; i <= right; i++) {
      const pi = (y * width + i) * 4;
      data[pi] = fillColor.r;
      data[pi + 1] = fillColor.g;
      data[pi + 2] = fillColor.b;
      data[pi + 3] = fillColor.a;
      visited[y * width + i] = 1;
    }

    if (y > 0) {
      let aboveInRun = false;
      for (let i = left; i <= right; i++) {
        const vi = (y - 1) * width + i;
        if (!visited[vi]) {
          const ai = vi * 4;
          if (colorDistance(data[ai], data[ai + 1], data[ai + 2], data[ai + 3],
                            targetR, targetG, targetB, targetA) <= tolerance) {
            if (!aboveInRun) {
              stack.push(i, y - 1);
              aboveInRun = true;
            }
          } else {
            aboveInRun = false;
          }
        } else {
          aboveInRun = false;
        }
      }
    }

    if (y < height - 1) {
      let belowInRun = false;
      for (let i = left; i <= right; i++) {
        const vi = (y + 1) * width + i;
        if (!visited[vi]) {
          const bi = vi * 4;
          if (colorDistance(data[bi], data[bi + 1], data[bi + 2], data[bi + 3],
                            targetR, targetG, targetB, targetA) <= tolerance) {
            if (!belowInRun) {
              stack.push(i, y + 1);
              belowInRun = true;
            }
          } else {
            belowInRun = false;
          }
        } else {
          belowInRun = false;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
