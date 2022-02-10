export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export function getRandomIntInclusive(min: number, max: number): number {
    return getRandomInt(min, max + 1);
}

export function randomChoice<T>(arr: T[]): T {
    return arr[getRandomInt(0, arr.length)];
}

export function getRandomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min
}

export function randomBoolean(rate?: number) {
    return Math.random() < (rate ?? 0.5);
}
