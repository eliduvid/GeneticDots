import {randomBoolean} from "./random";

const WORLD_SIZE = Object.freeze({
    HEIGHT: 500,
    WIDTH: 500,
});


function colorCanvas(): void {
    const canvas: HTMLCanvasElement = document.getElementById('cnvs') as HTMLCanvasElement;
    canvas.height = WORLD_SIZE.HEIGHT;
    canvas.width = WORLD_SIZE.WIDTH;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.fillStyle = 'rgb(171,133,133)';
    ctx.fillRect(0, 0, WORLD_SIZE.WIDTH, WORLD_SIZE.HEIGHT);
}

console.log(randomBoolean());