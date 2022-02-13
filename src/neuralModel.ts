import {getRandomFloat, getRandomIntInclusive, randomBoolean, randomChoice} from "./random";
import {generateArray, isEmpty, popKey} from "./utils";

export interface Receptor<P> {
    name: string;

    // From 0 to 1.0
    read(properties: Readonly<P>): number;
}

export interface Actor<P> {
    name: string;

    write(input: number, properties: P): void;
}

export class Neuron<P> implements Receptor<P>, Actor<P> {
    private input: number = 0;
    public name: string;

    constructor(public readonly neuronNumber: number) {
        this.name = 'N' + neuronNumber;
    }

    read(): number {
        return Math.tanh(this.input);
    }

    write(input: number): void {
        this.input += input
    }

    clear(): void {
        this.input = 0
    }
}

export abstract class BaseActor<P> implements Actor<P> {
    protected constructor(public name: string) {
    }

    write(input: number, properties: P): void {
        this._innerWrite(Math.tanh(input), properties);
    }

    abstract _innerWrite(input: number, properties: P): void;
}

export type ReceptorActorStringRepr = `${string}-${string}`

export class NeuralLink<P> {
    private constructor(public sensor: Receptor<P>,
                        public action: Actor<P>,
                        // From -4.0 to 4.0
                        public linkStrength: number) {
    }

    act(properties: P): void {
        this.action.write(this.sensor.read(properties) + this.linkStrength, properties);
    }

    get shortRepr(): ReceptorActorStringRepr {
        return `${this.sensor.name}-${this.action.name}`
    }

    static fromScratch<P>(sensor: Receptor<P>,
                          action: Actor<P>,
                          linkStrength: number) {
        return new NeuralLink(sensor, action, linkStrength);
    }

    static random<P>(sensors: Receptor<P>[], actions: Actor<P>[]) {
        return NeuralLink.fromScratch<P>(
            randomChoice(sensors),
            randomChoice(actions),
            getRandomFloat(-4, 4)
        );
    }

    static withRandomStrength<P>(sensor: Receptor<P>,
                                 action: Actor<P>) {
        return this.fromScratch(sensor, action, getRandomFloat(-4, 4))
    }
}

type ReprNeuralLinksMapping<P> = { [p: ReceptorActorStringRepr]: NeuralLink<P>[] };

export class Entity<P> {
    constructor(public readonly properties: P,
                private readonly neurons: Neuron<P>[],
                public readonly links: NeuralLink<P>[]) {
    }

    private static createParentLinkMapping<P>(parents: [Entity<P>, Entity<P>]): ReprNeuralLinksMapping<P> {
        const mapping: { [repr: ReceptorActorStringRepr]: NeuralLink<P>[] } = {};
        parents.flatMap(parent => parent.links).forEach(link => {
            const shortRepr = link.shortRepr;
            (mapping[shortRepr] ?? (mapping[shortRepr] = [])).push(link)
        })
        return mapping;
    }

    public static fromParents<P>(properties: P,
                                 receptors: Receptor<P>[],
                                 neuronNumber: number,
                                 actors: Actor<P>[],
                                 // Positive integer
                                 maxLinks: number,
                                 parents: [Entity<P>, Entity<P>],
                                 mutationRate: number) {
        const neurons = generateArray(neuronNumber, i => new Neuron<P>(i));
        const allReceptors = [...neurons, ...receptors];
        const allActors = [...neurons, ...actors];

        const mapping = Entity.createParentLinkMapping(parents);
        const linksNumber: number = this.calculateLinksNumber(mutationRate, parents, maxLinks);
        const links = generateArray(linksNumber, _ => {
            if (isEmpty(mapping)) {
                return NeuralLink.random(allReceptors, allActors);
            }
            const parentLinks = popKey(mapping, randomChoice(Object.keys(mapping))) as NeuralLink<P>[];
            if (randomBoolean(mutationRate)) {
                return NeuralLink.withRandomStrength<P>(parentLinks[0].sensor, parentLinks[0].action)
            } else {
                return randomChoice(parentLinks);
            }
        });
        return new Entity(properties, neurons, links);
    }

    private static calculateLinksNumber(mutationRate: number,
                                        parents: Entity<unknown>[],
                                        maximumLinkNumber: number) {
        const minimumParentLinkNumber = Math.min(...parents.map(parent => parent.links.length));
        const maximumParentLinkNumber = Math.max(...parents.map(parent => parent.links.length))
        if (randomBoolean(mutationRate)) {
            if (randomBoolean()) {
                return Math.max(minimumParentLinkNumber - 1, 0);
            } else {
                return Math.min(maximumParentLinkNumber + 1, maximumLinkNumber);
            }
        } else {
            return getRandomIntInclusive(minimumParentLinkNumber, maximumParentLinkNumber);
        }
    }

    public static random<P>(properties: P,
                            receptors: Receptor<P>[],
                            neuronNumber: number,
                            actors: Actor<P>[],
                            // Positive integer
                            maxLinks: number) {
        const neurons = this.generateNeurons(neuronNumber);
        const allReceptors = [...neurons, ...receptors];
        const allActors = [...neurons, ...actors];

        const links = generateArray(getRandomIntInclusive(0, maxLinks / 2), _ => {
            return NeuralLink.random(allReceptors, allActors);
        });

        return new Entity<P>(properties, neurons, links);
    }

    private static generateNeurons<P>(neuronNumber: number) {
        return generateArray(neuronNumber, i => new Neuron<P>(i));
    }

    run(): void {
        this.links.forEach(link => link.act(this.properties));
        this.neurons.forEach(neuron => neuron.clear())
    }
}

export class Board<P> {
    private _population: Entity<P>[];

    constructor(private readonly populationSize: number,
                private readonly generateProps: () => P,
                private readonly receptors: Receptor<P>[],
                private readonly actions: Actor<P>[],
                private readonly neuronNumber: number,
                private readonly maxLinks: number,
                private readonly mutationRate: number) {
        this._population = generateArray(populationSize, _ => this.generateRandomEntity());
    }

    tick(): void {
        this._population.forEach(entity => entity.run());
    }

    kill(condition: (props: Readonly<P>) => boolean): void {
        this._population = this._population.filter(entity => condition(entity.properties))
    }

    repopulate() {
        const newPopulation: Entity<P>[] = [];
        for (let i = 0; i < this.populationSize; i += 1) {
            newPopulation.push(Entity.fromParents<P>(
                this.generateProps(),
                this.receptors,
                this.neuronNumber,
                this.actions,
                this.maxLinks,
                [this._population[i % this._population.length], this._population[(i + 1) % this._population.length]],
                this.mutationRate
            ))
        }
        this._population = newPopulation;
    }

    private generateRandomEntity() {
        return Entity.random(
            this.generateProps(),
            this.receptors,
            this.neuronNumber,
            this.actions,
            this.maxLinks
        )
    }

    get population(): ReadonlyArray<Entity<P>> {
        return this._population;
    }

    dumpPopulation() {
        return this._population.map(({links}) => {
            return links.map(({sensor, action, linkStrength}) => ({
                sensor: sensor.name,
                action: action.name,
                linkStrength
            }));
        })
    }
}