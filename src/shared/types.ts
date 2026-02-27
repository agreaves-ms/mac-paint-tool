export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum ToolType {
  Brush = 'brush',
  Eraser = 'eraser',
  Fill = 'fill',
  Selection = 'selection',
  Shape = 'shape',
  Text = 'text',
}
