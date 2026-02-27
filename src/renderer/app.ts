import './styles/app.css';
import { PaintEngine } from './canvas/PaintEngine';

const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
const engine = new PaintEngine(canvas, 1024, 768);

const ctx = engine.getContext();
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
