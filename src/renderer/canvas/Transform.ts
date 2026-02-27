export class Transform {
  static rotate90(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.canvas.width = height;
    ctx.canvas.height = width;

    ctx.save();
    ctx.translate(height, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  }

  static rotate180(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  }

  static rotate270(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.canvas.width = height;
    ctx.canvas.height = width;

    ctx.save();
    ctx.translate(0, width);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  }

  static flipHorizontal(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  }

  static flipVertical(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(0, -height);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  }

  static scale(ctx: CanvasRenderingContext2D, newWidth: number, newHeight: number): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = ctx.canvas.width;
    tempCanvas.height = ctx.canvas.height;
    tempCanvas.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    ctx.canvas.width = newWidth;
    ctx.canvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, newWidth, newHeight);
  }
}
