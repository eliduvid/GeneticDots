import {getRandomFloat, getRandomIntInclusive, randomBoolean, randomChoice} from "./random";
import {generateArray, isEmpty, popKey} from "./utils";

interface Receptor<P> {
    name: string;

    // From 0 to 1.0
    read(properties: P): number;
}

interface Actor<P> {
    name: string;

    write(input: number, properties: P): void;
}

class Neuron<P> implements Receptor<P>, Actor<P> {
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

abstract class BaseActor<P> implements Actor<P> {
    protected constructor(public name: string) {
    }


    write(input: number): void {
        this._innerWrite(Math.tanh(input));
    }

    abstract _innerWrite(input: number): void;
}

type ReceptorActorStringRepr = `${string}-${string}`

class NeuralLink<P> {
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

class Entity<P> {
    constructor(private readonly properties: P,
                private readonly neurons: Neuron<P>[],
                private readonly links: NeuralLink<P>[]) {
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
                return Math.max(maximumParentLinkNumber + 1, maximumLinkNumber);
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
    }
}