class NeuralNetwork {
  constructor(neuronCounts) {
    this.levels = [];
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
    }
  }

  static feedForward(givenInputs, network) {
    let outputs = Level.feedForward(givenInputs, network.levels[0]);
    for (let i = 1; i < network.levels.length; i++) {
      outputs = Level.feedForward(outputs, network.levels[i]);
    }
    return outputs;
  }

  // Clone a network structure and copy its weights and biases
  static clone(network) {
    const cloned = new NeuralNetwork(
      [network.levels[0].inputs.length, ...network.levels.map(l => l.outputs.length)]
    );
    for (let i = 0; i < network.levels.length; i++) {
      const level = network.levels[i];
      const clonedLevel = cloned.levels[i];
      clonedLevel.biases = [...level.biases];
      clonedLevel.weights = level.weights.map(w => [...w]);
    }
    return cloned;
  }

  // Mutate the network's weights and biases by some amount (0 to 1)
  static mutate(network, amount = 1) {
    network.levels.forEach(level => {
      for (let i = 0; i < level.biases.length; i++) {
        level.biases[i] = lerp(
          level.biases[i],
          Math.random() * 2 - 1,
          amount
        );
      }
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          level.weights[i][j] = lerp(
            level.weights[i][j],
            Math.random() * 2 - 1,
            amount
          );
        }
      }
    });
  }

  // Crossover: Create a child from two parent networks
  static crossover(parentA, parentB) {
    const child = NeuralNetwork.clone(parentA);
    for (let i = 0; i < child.levels.length; i++) {
      const level = child.levels[i];
      const levelA = parentA.levels[i];
      const levelB = parentB.levels[i];
      
      // Mix biases
      for (let j = 0; j < level.biases.length; j++) {
        level.biases[j] = Math.random() < 0.5 ? levelA.biases[j] : levelB.biases[j];
      }
      // Mix weights
      for (let j = 0; j < level.weights.length; j++) {
        for (let k = 0; k < level.weights[j].length; k++) {
          level.weights[j][k] = Math.random() < 0.5 ? levelA.weights[j][k] : levelB.weights[j][k];
        }
      }
    }
    return child;
  }
}

class Level {
  constructor(inputCount, outputCount) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);

    this.weights = [];
    for (let i = 0; i < inputCount; i++) {
      this.weights[i] = new Array(outputCount);
    }

    Level.randomize(this);
  }

  static randomize(level) {
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = Math.random() * 2 - 1;
      }
    }

    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = Math.random() * 2 - 1;
    }
  }

  static feedForward(givenInputs, level) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0;
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i];
      }

      // Linear combining + bias
      // Activation function: hyperbolic tangent (tanh) to get values in range -1 to 1 cleanly
      level.outputs[i] = Math.tanh(sum + level.biases[i]);
    }

    return level.outputs;
  }
}

// Utility linear interpolation
function lerp(A, B, t) {
  return A + (B - A) * t;
}
