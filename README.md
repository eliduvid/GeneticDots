# GeneticDots
Trying to get my feet wet with all this genetic stuff. You can see it in action here -> https://eliduvid.github.io/genetic-dots-dist/

Havily inspited by [davidrandallmiller's video](https://www.youtube.com/watch?v=N3tRFayqVtk), although not using any code from it.

In short, every dot on the screen is an entity with it's own genome (that affects behaviour, obviously), and every one that is on the right side of the screen by the end of generation gets to pass his genome to next generation. Over time all of them know to move right. In general, you can see improvment in survival rate by gen 500-600, but i saw one that it took it 13000 generations, so be patient.

## Some more details
In current implementation every dot has 5 inputs:
* IU - returns 1 if dot's direction is up, 0 otherwise
* TB - returns 1 if dot is on border pixel
* RN - random float for 0 to 1
* TP - how close are we to the and of generation, 0 is turn 0 of the generation and 1 is last turn
* AL - always returns 1

And 4 actions:
* LT - turn left
* RT - right
* FD - move forward by 2 pixels
* BW - mobe backwards by 1 pixel

They also have 4 neurons, that can act as action (and sum all the inputs it gets) or as a sensor (and output value between -1 and 1 based on a sum of inputs so far).

So the genome consists of 0 to 10 neural links that connect input with an action and have a multiplier between -4 and 4.

## Dump generation button
Downloads JSON file with all neural links of all dots in current gen. For now it's only for after-the-fact investigation.

## Possible improvements
* Savestates - I think it may be based on current dump function
* More things for genetic algotith  to solve! - For now it's only "get to the right side of the board", but its relatively easy to write other ones or even do it user-defined.
* More knobs and handles: neuron number, turns in gen, mutation rate, link number - you name it
* Possibly rewrite dot implementation so they could interact with each other (for now they can even occupate same pixel).
