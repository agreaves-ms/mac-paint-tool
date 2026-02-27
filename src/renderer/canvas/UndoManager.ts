interface UndoEntry {
  layerId: string | null;
  data: ImageData;
}

export class UndoManager {
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private maxHistory: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, maxHistory = 50) {
    this.width = width;
    this.height = height;
    this.maxHistory = maxHistory;
  }

  saveState(ctx: CanvasRenderingContext2D, layerId?: string): void {
    const snapshot = ctx.getImageData(0, 0, this.width, this.height);
    this.undoStack.push({ layerId: layerId ?? null, data: snapshot });
    this.redoStack.length = 0;

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo(
    ctx: CanvasRenderingContext2D,
    resolveCtx?: (layerId: string) => CanvasRenderingContext2D,
  ): boolean {
    const entry = this.undoStack.pop();
    if (!entry) return false;

    const targetCtx = entry.layerId && resolveCtx
      ? resolveCtx(entry.layerId)
      : ctx;
    const current = targetCtx.getImageData(0, 0, this.width, this.height);
    this.redoStack.push({ layerId: entry.layerId, data: current });
    targetCtx.putImageData(entry.data, 0, 0);
    return true;
  }

  redo(
    ctx: CanvasRenderingContext2D,
    resolveCtx?: (layerId: string) => CanvasRenderingContext2D,
  ): boolean {
    const entry = this.redoStack.pop();
    if (!entry) return false;

    const targetCtx = entry.layerId && resolveCtx
      ? resolveCtx(entry.layerId)
      : ctx;
    const current = targetCtx.getImageData(0, 0, this.width, this.height);
    this.undoStack.push({ layerId: entry.layerId, data: current });
    targetCtx.putImageData(entry.data, 0, 0);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
