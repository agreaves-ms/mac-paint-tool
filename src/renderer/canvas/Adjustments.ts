export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
}

export class Adjustments {
  static applyLevels(
    imageData: ImageData,
    inputBlack: number,
    inputWhite: number,
    outputMin: number,
    outputMax: number
  ): ImageData {
    const data = imageData.data;
    const range = inputWhite - inputBlack || 1;
    const outputRange = outputMax - outputMin;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let value = (data[i + c] - inputBlack) / range;
        value = Math.max(0, Math.min(1, value));
        value = outputMin + value * outputRange;
        data[i + c] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }

    return imageData;
  }

  static applyCurves(imageData: ImageData, lut: number[]): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];
      data[i + 1] = lut[data[i + 1]];
      data[i + 2] = lut[data[i + 2]];
    }
    return imageData;
  }

  static applyCurvesPerChannel(
    imageData: ImageData,
    lutR: number[],
    lutG: number[],
    lutB: number[]
  ): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lutR[data[i]];
      data[i + 1] = lutG[data[i + 1]];
      data[i + 2] = lutB[data[i + 2]];
    }
    return imageData;
  }

  static buildLUT(controlPoints: { x: number; y: number }[]): number[] {
    const pts = [...controlPoints].sort((a, b) => a.x - b.x);

    // Ensure endpoints
    if (pts.length === 0 || pts[0].x > 0) pts.unshift({ x: 0, y: 0 });
    if (pts[pts.length - 1].x < 255) pts.push({ x: 255, y: 255 });

    const lut = new Array<number>(256);

    if (pts.length === 2) {
      for (let i = 0; i < 256; i++) {
        const t = (i - pts[0].x) / (pts[1].x - pts[0].x || 1);
        lut[i] = Math.max(0, Math.min(255, Math.round(pts[0].y + t * (pts[1].y - pts[0].y))));
      }
      return lut;
    }

    // Monotone cubic spline interpolation (Fritsch-Carlson)
    const n = pts.length;
    const dx: number[] = [];
    const dy: number[] = [];
    const m: number[] = [];

    for (let i = 0; i < n - 1; i++) {
      dx.push(pts[i + 1].x - pts[i].x);
      dy.push(pts[i + 1].y - pts[i].y);
      m.push(dy[i] / (dx[i] || 1));
    }

    // Compute tangents
    const tangents: number[] = [m[0]];
    for (let i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) {
        tangents.push(0);
      } else {
        tangents.push((m[i - 1] + m[i]) / 2);
      }
    }
    tangents.push(m[n - 2]);

    // Monotonicity enforcement
    for (let i = 0; i < n - 1; i++) {
      if (Math.abs(m[i]) < 1e-6) {
        tangents[i] = 0;
        tangents[i + 1] = 0;
      } else {
        const alpha = tangents[i] / m[i];
        const beta = tangents[i + 1] / m[i];
        const s = alpha * alpha + beta * beta;
        if (s > 9) {
          const tau = 3 / Math.sqrt(s);
          tangents[i] = tau * alpha * m[i];
          tangents[i + 1] = tau * beta * m[i];
        }
      }
    }

    // Evaluate spline at each integer x
    let seg = 0;
    for (let i = 0; i < 256; i++) {
      while (seg < n - 2 && i > pts[seg + 1].x) seg++;
      const h = dx[seg] || 1;
      const t = (i - pts[seg].x) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      const value = h00 * pts[seg].y + h10 * h * tangents[seg] + h01 * pts[seg + 1].y + h11 * h * tangents[seg + 1];
      lut[i] = Math.max(0, Math.min(255, Math.round(value)));
    }

    return lut;
  }

  static calculateHistogram(imageData: ImageData): HistogramData {
    const r = new Array<number>(256).fill(0);
    const g = new Array<number>(256).fill(0);
    const b = new Array<number>(256).fill(0);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      r[data[i]]++;
      g[data[i + 1]]++;
      b[data[i + 2]]++;
    }

    return { r, g, b };
  }
}
