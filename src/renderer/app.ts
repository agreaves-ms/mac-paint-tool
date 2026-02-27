import './styles/app.css';

const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
canvas.width = 1024;
canvas.height = 768;

const ctx = canvas.getContext('2d', { willReadFrequently: true });
if (ctx) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
