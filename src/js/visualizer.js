class Visualizer {
  // Draws the Neural Network structure showing nodes, weights, and current activation levels
  static drawNetwork(ctx, network) {
    const margin = 20;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const layerCount = network.levels.length + 1;
    const layerSpacing = (height - margin * 2) / (layerCount - 1);

    // Compute node locations
    const nodes = [];
    for (let i = 0; i < layerCount; i++) {
      const nodeCount = i === 0 
        ? network.levels[0].inputs.length 
        : network.levels[i - 1].outputs.length;
      
      const layerNodes = [];
      const nodeSpacing = (width - margin * 2) / (nodeCount === 1 ? 1 : nodeCount - 1);
      
      for (let j = 0; j < nodeCount; j++) {
        const x = margin + (nodeCount === 1 ? (width - margin * 2) / 2 : j * nodeSpacing);
        const y = height - margin - i * layerSpacing; // Input layer at bottom, output at top
        layerNodes.push({ x, y });
      }
      nodes.push(layerNodes);
    }

    // Draw weights/connections
    for (let i = 0; i < network.levels.length; i++) {
      const level = network.levels[i];
      const levelInputs = nodes[i];
      const levelOutputs = nodes[i + 1];

      for (let j = 0; j < level.inputs.length; j++) {
        for (let k = 0; k < level.outputs.length; k++) {
          ctx.beginPath();
          ctx.moveTo(levelInputs[j].x, levelInputs[j].y);
          ctx.lineTo(levelOutputs[k].x, levelOutputs[k].y);
          
          const weight = level.weights[j][k];
          ctx.lineWidth = Math.abs(weight) * 3;
          ctx.strokeStyle = weight > 0 
            ? `rgba(0, 123, 255, ${Math.abs(weight)})` // blue for positive weights
            : `rgba(220, 53, 69, ${Math.abs(weight)})`; // red for negative weights
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    const nodeRadius = 13;
    const labels = [
      ["S1", "S2", "S3", "S4", "S5"], // Input sensors
      ["H1", "H2", "H3", "H4", "H5", "H6"], // Hidden layer
      ["THR", "BRK", "STR"] // Outputs
    ];

    for (let i = 0; i < nodes.length; i++) {
      const layerNodes = nodes[i];
      for (let j = 0; j < layerNodes.length; j++) {
        const node = layerNodes[j];
        
        // Compute node value
        let value = 0;
        if (i === 0) {
          value = network.levels[0].inputs[j];
        } else {
          value = network.levels[i - 1].outputs[j];
        }

        // Node background circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e1e1e";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node fill color representing activation (0 to 1 as green, -1 to 0 as orange)
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius - 2, 0, Math.PI * 2);
        if (value > 0) {
          ctx.fillStyle = `rgba(40, 167, 69, ${value})`;
        } else {
          ctx.fillStyle = `rgba(255, 193, 7, ${Math.abs(value)})`;
        }
        ctx.fill();

        // Draw node label / value
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i] && labels[i][j] ? labels[i][j] : "", node.x, node.y);
      }
    }
  }

  // Draw training line chart representing fitness progress over generations
  static drawChart(canvas, history) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    if (history.length === 0) {
      ctx.fillStyle = "#888";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Awaiting Generations...", width / 2, height / 2);
      return;
    }

    const padding = 35;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Get limits
    const maxVal = Math.max(...history, 1);
    const minVal = Math.min(...history, 0);
    const valRange = maxVal - minVal;

    // Grid lines and Y axis markers
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#aaa";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";

    const numGridLines = 4;
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding + (graphHeight * i) / numGridLines;
      const val = maxVal - (valRange * i) / numGridLines;
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      ctx.fillText(Math.round(val), padding - 8, y + 3);
    }

    // Draw graph line
    ctx.beginPath();
    ctx.strokeStyle = "#00bc8c";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";

    for (let i = 0; i < history.length; i++) {
      const x = padding + (graphWidth * i) / Math.max(history.length - 1, 1);
      const y = padding + graphHeight - ((history[i] - minVal) / valRange) * graphHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw points on graph line
    ctx.fillStyle = "#375a7f";
    ctx.strokeStyle = "#00bc8c";
    ctx.lineWidth = 2;
    for (let i = 0; i < history.length; i++) {
      const x = padding + (graphWidth * i) / Math.max(history.length - 1, 1);
      const y = padding + graphHeight - ((history[i] - minVal) / valRange) * graphHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // X Axis markings (Generation numbers)
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    for (let i = 0; i < history.length; i += Math.max(1, Math.floor(history.length / 5))) {
      const x = padding + (graphWidth * i) / Math.max(history.length - 1, 1);
      ctx.fillText(`G${i + 1}`, x, height - padding + 15);
    }
  }
}
