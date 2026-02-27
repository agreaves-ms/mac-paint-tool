export class UndoManager {
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private maxHistory: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, maxHistory = 50) {
    this.width = width;
    this.height = height;
    this.maxHistory = maxHistory;
  }

  saveState(ctx: CanvasRenderingContext2D): void {
    const snapshot = ctx.getImageData(0, 0, this.width, this.height);
    this.undoStack.push(snapshot);
    this.redoStack.length = 0;

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo(ctx: CanvasRenderingContext2D): boolean {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;

    const current = ctx.getImageData(0, 0, this.width, this.height);
    this.redoStack.push(current);
    ctx.putImageData(snapshot, 0, 0);
    return true;
  }

  redo(ctx: CanvasRenderingContext2D): boolean {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return false;

    const current = ctx.getImageData(0, 0, this.width, this.height);
    this.undoStack.push(current);
    ctx.putImageData(snapshot, 0, 0);
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
