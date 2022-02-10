export function popKey<T>(obj: { [key: string]: T }, key: string): T | undefined {
    if (!Object.keys(obj).includes(key)) return;
    const val = obj[key];
    delete obj[key];
    return val;
}

export function isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
}

export function generateArray<T>(length: number, generator: (i: number) => T): T[] {
    const out = [];
    for (let i = 0; i < length; i++) {
        out.push(generator(i))
    }
    return out;
}