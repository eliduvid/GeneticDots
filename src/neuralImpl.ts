import {BaseActor, Board, Receptor} from "./neuralModel";
import {getRandomInt, randomChoice} from "./random";

interface DirectionCoords {
    x: number
    y: number
}

class Direction {
    static readonly UP: Direction = new Direction('UP', {x: 0, y: -1});
    static readonly RIGHT: Direction = new Direction('RIGHT', {x: 1, y: 0});
    static readonly DOWN: Direction = new Direction('DOWN', {x: 0, y: 1});
    static readonly LEFT: Direction = new Direction('LEFT', {x: -1, y: 0});
    static readonly values: ReadonlyArray<Direction> = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
    private static reverseValues: { [p: string]: number } = Object.fromEntries(
        Direction.values.map((d, i) => [d, i])
    );

    private constructor(private name: string, public readonly coords: DirectionCoords) {
    }

    right(): Direction {
        return Direction.values[(Direction.reverseValues[this.toString()] + 1) % Direction.values.length]
    }

    left(): Direction {
        return Direction.values[(Direction.reverseValues[this.toString()] + Direction.values.length - 1) % Direction.values.length]
    }

    toString() {
        return this.name;
    }
}

interface EntityProperties {
    x: number,
    y: number,
    direction: Direction,
    gameProps: {
        maxX: number,
        maxY: number,
        turn: number,
        maxTurn: number
    }
}

class IsUp implements Receptor<EntityProperties> {
    name: string = "IU";

    read(properties: Readonly<EntityProperties>): number {
        return properties.direction === Direction.UP? 1 : 0;
    }
}

class TouchingBorder implements Receptor<EntityProperties> {
    name: string = "TB";

    read(properties: EntityProperties): number {
        return (
            properties.y === 0 ||
            properties.y === properties.gameProps.maxY ||
            properties.x === 0 ||
            properties.x === properties.gameProps.maxX
        ) ? 1 : 0;
    }
}

class Always implements Receptor<EntityProperties> {
    name: string = "AL";

    read(properties: EntityProperties): number {
        return 1;
    }
}

class TimePerception implements Receptor<EntityProperties> {
    name: string = 'TP';

    read(properties: EntityProperties): number {
        return properties.gameProps.turn / properties.gameProps.maxTurn;
    }
}

class Random implements Receptor<EntityProperties> {
    name: string = 'RN';

    read(properties: EntityProperties): number {
        return Math.random();
    }
}

function preventOverflow(num: number, min: number, max: number) {
    if (num < min) return min;
    if (num > max) return max;
    return num
}

class MoveForward extends BaseActor<EntityProperties> {
    constructor() {
        super('FD');
    }

    _innerWrite(input: number, properties: EntityProperties): void {
        if (input > 0) {
            const directionCoords = properties.direction.coords;
            const {maxX, maxY} = properties.gameProps;
            properties.x = preventOverflow(properties.x + directionCoords.x * 2, 0, maxX);
            properties.y = preventOverflow(properties.y + directionCoords.y * 2, 0, maxY);
        }
    }
}

class MoveBackward extends BaseActor<EntityProperties> {
    constructor() {
        super('BW');
    }

    _innerWrite(input: number, properties: EntityProperties): void {
        if (input > 0) {
            const directionCoords = properties.direction.coords;
            const {maxX, maxY} = properties.gameProps;
            properties.x = preventOverflow(properties.x - directionCoords.x, 0, maxX);
            properties.y = preventOverflow(properties.y - directionCoords.y, 0, maxY);
        }
    }
}

class TurnRight extends BaseActor<EntityProperties> {
    constructor() {
        super('RT');
    }

    _innerWrite(input: number, properties: EntityProperties): void {
        if (input > 0) {
            properties.direction = properties.direction.right();
        }
    }
}

class TurnLeft extends BaseActor<EntityProperties> {
    constructor() {
        super('LT');
    }

    _innerWrite(input: number, properties: EntityProperties): void {
        if (input > 0) {
            properties.direction = properties.direction.left();
        }
    }
}

export class ActualBoard {
    private _survivorsLastGen: number = 0;
    private _generationNumber: number = 0;
    private readonly board: Board<EntityProperties>;
    private readonly gameProps: {
        maxX: number,
        maxY: number,
        turn: number,
        maxTurn: number,
    };

    constructor(boardSize: { x: number, y: number },
                populationSize: number,
                turnsPerGeneration: number,
                private condition: (props: EntityProperties) => boolean) {
        this.gameProps = {
            maxX: boardSize.x - 1,
            maxY: boardSize.y - 1,
            turn: 0,
            maxTurn: turnsPerGeneration,
        }
        this.board = new Board<EntityProperties>(
            populationSize,
            () => {
                const direction = randomChoice(Direction.values);
                return {
                    x: getRandomInt(0, boardSize.x),
                    y: getRandomInt(0, boardSize.y),
                    gameProps: this.gameProps,
                    direction: direction
                };
            },
            [
                new IsUp(),
                new TouchingBorder(),
                new Random(),
                new TimePerception(),
                new Always()
            ],
            [
                new TurnLeft(),
                new TurnRight(),
                new MoveForward(),
                new MoveBackward()
            ],
            4,
            10,
            0.01
        )
    }

    doTurn() {
        if (this.gameProps.turn > this.gameProps.maxTurn) {
            this.gameProps.turn = 0;
            this.board.kill(this.condition);
            this._survivorsLastGen = this.population.length;
            this.board.repopulate();
            this._generationNumber++;
        }
        this.board.tick()
        this.gameProps.turn++;
    }

    get generationNumber() {
        return this._generationNumber;
    }

    get population() {
        return this.board.population;
    }

    get survivorsLastGen() {
        return this._survivorsLastGen;
    }

    dumpGeneration() {
        return {
            generationNumber: this.generationNumber,
            generation: this.board.dumpPopulation(),
        }
    }
}
