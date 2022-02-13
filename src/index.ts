import {ActualBoard} from "./neuralImpl";

const WORLD_SIZE = Object.freeze({
    HEIGHT: 200,
    WIDTH: 200,
});


function createCanvas(): CanvasRenderingContext2D {
    const canvas: HTMLCanvasElement = document.getElementById('cnvs') as HTMLCanvasElement;
    canvas.height = WORLD_SIZE.HEIGHT;
    canvas.width = WORLD_SIZE.WIDTH;
    return canvas.getContext('2d') as CanvasRenderingContext2D;
}

const POPULATION_SIZE = 1000;
const board = new ActualBoard({y: WORLD_SIZE.HEIGHT, x: WORLD_SIZE.WIDTH},
    POPULATION_SIZE, 60,
    ({gameProps: {maxX}, x}) => x > maxX / 2);

const ctx: CanvasRenderingContext2D = createCanvas();

const runCheckbox: HTMLInputElement = document.getElementById('runChkbx') as HTMLInputElement;
const fastForwardCheckbox: HTMLInputElement = document.getElementById('ffChkbx') as HTMLInputElement;
const generationField: HTMLElement = document.getElementById('generation') as HTMLElement;
const numberOfSurvivorsField: HTMLElement = document.getElementById('survs') as HTMLElement;
const totalPopulationField: HTMLElement = document.getElementById('totalPop') as HTMLElement;

totalPopulationField.innerText = String(POPULATION_SIZE);

function gameLoop(doContinue: () => boolean): void {
    if (doContinue()) {
        ctx.fillStyle = 'rgb(171,133,133)';
        ctx.fillRect(0, 0, WORLD_SIZE.WIDTH / 2, WORLD_SIZE.HEIGHT);
        ctx.fillStyle = 'rgb(206,175,175)';
        ctx.fillRect(WORLD_SIZE.WIDTH / 2, 0, WORLD_SIZE.WIDTH / 2, WORLD_SIZE.HEIGHT);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        board.population.forEach(entity => {
            ctx.fillRect(entity.properties.x, entity.properties.y, 1, 1)
        })
        generationField.innerText = String(board.generationNumber)
        numberOfSurvivorsField.innerText = String(board.survivorsLastGen)
        board.doTurn();
    }
}

function runLoop(interval: number) {
    return setInterval(() => gameLoop(() => runCheckbox.checked), interval);
}

let interval = runLoop(100);

fastForwardCheckbox.addEventListener('change', ev => {
    clearInterval(interval);
    // @ts-ignore
    interval = ev.target.checked ? runLoop(1) : runLoop(100);
})

function createDumpLink(): string {
    return URL.createObjectURL(new Blob(
        [JSON.stringify(board.dumpGeneration(), undefined, '\t')],
        {type: 'application/json'}
    ));
}

function downloadDump() {
    const a = window.document.createElement('a');
    a.href = createDumpLink();
    a.download = 'dump.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

document.getElementById('dump')?.addEventListener('click', downloadDump);