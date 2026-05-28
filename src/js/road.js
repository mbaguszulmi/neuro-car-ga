class Road {
  constructor(roadData) {
    this.id = roadData.id;
    this.name = roadData.name;
    this.description = roadData.description;
    this.startPoint = roadData.startPoint;
    this.endPoint = roadData.endPoint;
    this.width = roadData.width;
    this.waypoints = roadData.waypoints;

    this.borders = [];
    this.#generateBorders();
  }

  // Generates the left and right road borders based on waypoints and road width
  #generateBorders() {
    const leftPoints = [];
    const rightPoints = [];

    for (let i = 0; i < this.waypoints.length; i++) {
      const current = this.waypoints[i];
      let tangentX = 0;
      let tangentY = -1; // Default to pointing upwards if single waypoint

      if (i < this.waypoints.length - 1) {
        // Pointing to next waypoint
        const next = this.waypoints[i + 1];
        tangentX = next.x - current.x;
        tangentY = next.y - current.y;
      } else if (i > 0) {
        // Last waypoint, pointing from previous
        const prev = this.waypoints[i - 1];
        tangentX = current.x - prev.x;
        tangentY = current.y - prev.y;
      }

      // Normalize the tangent vector
      const len = Math.hypot(tangentX, tangentY);
      const dx = len === 0 ? 0 : tangentX / len;
      const dy = len === 0 ? -1 : tangentY / len;

      // Find normal vectors (perpendicular to tangent)
      // Left normal is (-dy, dx)
      // Right normal is (dy, -dx)
      const halfWidth = this.width / 2;
      leftPoints.push({
        x: current.x - dy * halfWidth,
        y: current.y + dx * halfWidth
      });
      rightPoints.push({
        x: current.x + dy * halfWidth,
        y: current.y - dx * halfWidth
      });
    }

    // Convert points to lines representing borders
    for (let i = 0; i < leftPoints.length - 1; i++) {
      this.borders.push([leftPoints[i], leftPoints[i + 1]]);
    }
    for (let i = 0; i < rightPoints.length - 1; i++) {
      this.borders.push([rightPoints[i], rightPoints[i + 1]]);
    }
  }

  // Draw the road waypoints and lanes (dashed lines) as well as the dark road surface
  draw(ctx) {
    ctx.lineWidth = this.width;
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw main asphalt road
    ctx.beginPath();
    ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    ctx.stroke();

    // Draw dashed center line
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw road borders in thick white/grey lines
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineCap = "round";
    for (let i = 0; i < this.borders.length; i++) {
      ctx.beginPath();
      ctx.moveTo(this.borders[i][0].x, this.borders[i][0].y);
      ctx.lineTo(this.borders[i][1].x, this.borders[i][1].y);
      ctx.stroke();
    }

    // Draw Start and Finish areas
    const start = this.startPoint;
    const end = this.endPoint;

    // Green start circle
    ctx.beginPath();
    ctx.arc(start.x, start.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40, 167, 69, 0.7)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    // Red checkered-like target circle
    ctx.beginPath();
    ctx.arc(end.x, end.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220, 53, 69, 0.7)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("START", start.x, start.y);
    ctx.fillText("FINISH", end.x, end.y);
  }
}
