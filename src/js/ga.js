class GeneticAlgorithm {
  constructor(populationSize = 100, mutationRate = 0.15) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.generation = 1;
  }

  // Create initial population of 100 cars
  // If baseBrain is provided, we clone it and mutate from it!
  generatePopulation(startX, startY, baseBrain = null) {
    const cars = [];
    for (let i = 0; i < this.populationSize; i++) {
      const car = new Car(startX, startY, 30, 50, "AI");
      if (baseBrain) {
        // Clone from imported/loaded base brain
        car.brain = NeuralNetwork.clone(baseBrain);
        if (i > 0) {
          // Mutate clones slightly except the absolute first one
          NeuralNetwork.mutate(car.brain, this.mutationRate);
        }
      } else {
        // Otherwise completely random (initially)
        // No modification needed, Car constructor randomizes the neural net weights
      }
      cars.push(car);
    }
    return cars;
  }

  // Generate next generation of cars based on crossover and mutation of the best N individuals
  nextGeneration(oldCars, startX, startY) {
    this.generation++;
    
    // Sort old population descending by fitness
    const sortedCars = [...oldCars].sort((a, b) => b.fitness - a.fitness);

    // Keep the best N individuals (e.g., top 10 as parents)
    const numParents = 10;
    const parents = sortedCars.slice(0, numParents);

    const newCars = [];

    // 1. Keep the exact best individual (Elitist selection)
    const bestCar = new Car(startX, startY, 30, 50, "AI");
    bestCar.brain = NeuralNetwork.clone(parents[0].brain);
    newCars.push(bestCar);

    // 2. Populate the rest with a mix of crossover and mutation from parents
    while (newCars.length < this.populationSize) {
      // Pick two random parents
      const parentA = parents[Math.floor(Math.random() * parents.length)];
      const parentB = parents[Math.floor(Math.random() * parents.length)];

      // Crossover
      const childBrain = NeuralNetwork.crossover(parentA.brain, parentB.brain);

      // Mutate
      NeuralNetwork.mutate(childBrain, this.mutationRate);

      // Create new car
      const childCar = new Car(startX, startY, 30, 50, "AI");
      childCar.brain = childBrain;
      newCars.push(childCar);
    }

    return {
      newCars,
      bestFitness: parents[0].fitness,
      bestCarModel: parents[0].brain
    };
  }
}
