export class Filters {
  static invert(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  }

  static brightness(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + amount));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
    }
    return imageData;
  }

  static contrast(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (amount + 255)) / (255 * (259 - amount));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    return imageData;
  }

  static blur(imageData: ImageData, width: number, height: number): ImageData {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // 3×3 Gaussian kernel normalized by 16
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const half = 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let ki = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (py * width + px) * 4;
            const w = kernel[ki++];
            r += src[idx] * w;
            g += src[idx + 1] * w;
            b += src[idx + 2] * w;
            a += src[idx + 3] * w;
          }
        }
        const outIdx = (y * width + x) * 4;
        dst[outIdx] = r / 16;
        dst[outIdx + 1] = g / 16;
        dst[outIdx + 2] = b / 16;
        dst[outIdx + 3] = a / 16;
      }
    }

    return new ImageData(dst, width, height);
  }

  static sharpen(imageData: ImageData, width: number, height: number): ImageData {
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // Sharpen kernel: [0,-1,0; -1,5,-1; 0,-1,0]
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const half = 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
        let ki = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (py * width + px) * 4;
            const w = kernel[ki++];
            r += src[idx] * w;
            g += src[idx + 1] * w;
            b += src[idx + 2] * w;
          }
        }
        const outIdx = (y * width + x) * 4;
        dst[outIdx] = Math.max(0, Math.min(255, r));
        dst[outIdx + 1] = Math.max(0, Math.min(255, g));
        dst[outIdx + 2] = Math.max(0, Math.min(255, b));
        dst[outIdx + 3] = src[(y * width + x) * 4 + 3];
      }
    }

    return new ImageData(dst, width, height);
  }
}
