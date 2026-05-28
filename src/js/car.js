class Car {
  constructor(x, y, width, height, controlType, maxSpeed = 3) {
    this.x = x;
    this.y = y;
    this.originalX = x; // Store original position for fitness calculations
    this.originalY = y;
    this.width = width;
    this.height = height;

    this.speed = 0;
    this.acceleration = 0.15;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.angle = 0;
    this.damaged = false;
    this.finished = false;

    this.controlType = controlType; // "AI" or "KEYBOARD"
    this.useBrain = controlType === "AI";

    if (this.controlType !== "DUMMY") {
      this.sensor = new Sensor(this);
      this.brain = new NeuralNetwork([5, 6, 3]); // 5 inputs, 6 hidden neurons, 3 outputs (Throttle, Brake, Steering)
    }

    // Performance measurements
    this.distanceTraveled = 0;
    this.fitness = 0;
    this.timeAlive = 0;
    this.polygon = this.#createPolygon();
    this.stationaryTime = 0; // tracking stationary frames to prevent stuck cars

    // Inputs to controls from brain or keys
    this.controls = {
      throttle: 0, // 0 to 1
      brake: 0,    // 0 to 1
      steering: 0  // -1 to 1
    };
  }

  update(roadBorders, finishPoint, roadWaypoints) {
    if (!this.damaged) {
      const prevX = this.x;
      const prevY = this.y;
      
      this.#move();
      this.polygon = this.#createPolygon();
      this.damaged = this.#assessDamage(roadBorders);
      
      this.timeAlive += 1;

      // Track if car is stationary/stuck (moving less than 0.2 pixels)
      const distMoved = Math.hypot(this.x - prevX, this.y - prevY);
      if (distMoved < 0.2) {
        this.stationaryTime += 1;
      } else {
        this.stationaryTime = 0;
      }

      // If a car remains stationary for too long (e.g., 90 frames / 1.5 seconds)
      if (this.stationaryTime > 90) {
        this.damaged = true;
      }
      
      // Calculate progress and distance to finish
      this.#calculateFitness(finishPoint, roadWaypoints);
    }

    if (this.sensor) {
      this.sensor.update(roadBorders);
      
      // AI controls
      if (this.useBrain && !this.damaged) {
        // Read sensor values as input. A reading represents {x, y, offset}.
        // Input is (1 - offset) if there's a reading (closer means offset is small, so input is closer to 1), 0 if no reading.
        const inputs = this.sensor.readings.map(
          s => s === null ? 0 : 1 - s.offset
        );

        const outputs = NeuralNetwork.feedForward(inputs, this.brain);
        
        // Outputs are scaled by tanh which returns -1 to 1
        // Output 0 -> Throttle: mapped from [-1, 1] to [0, 1]
        this.controls.throttle = (outputs[0] + 1) / 2;
        // Output 1 -> Brake: mapped from [-1, 1] to [0, 1]
        this.controls.brake = (outputs[1] + 1) / 2;
        // Output 2 -> Steering: mapped directly from [-1, 1] to [-1, 1]
        this.controls.steering = outputs[2];
      }
    }
  }

  #calculateFitness(finishPoint, roadWaypoints) {
    // 1. Calculate how close we are to finish point
    const distToFinish = Math.hypot(this.x - finishPoint.x, this.y - finishPoint.y);

    // 2. Find progress along the waypoints
    // We can see which waypoint segment the car is currently closest to
    let totalRoadLength = 0;
    let closestWaypointIdx = 0;
    let minWaypointDist = Infinity;

    for (let i = 0; i < roadWaypoints.length; i++) {
      const dist = Math.hypot(this.x - roadWaypoints[i].x, this.y - roadWaypoints[i].y);
      if (dist < minWaypointDist) {
        minWaypointDist = dist;
        closestWaypointIdx = i;
      }
    }

    // Progress fitness: based on index of the waypoint reached, plus fractional distance to the next
    // This provides an accurate progress metric along curvy/turning roads!
    this.distanceTraveled = closestWaypointIdx * 150 - minWaypointDist * 0.1;

    // Fitness score details:
    // - High reward for progressing through waypoints (`distanceTraveled`)
    // - Big penalty if damaged (crashed)
    // - High penalty for taking too much time to get nowhere
    // - Big bonus if we reach the finish point
    this.fitness = this.distanceTraveled - (this.damaged ? 100 : 0) + (this.timeAlive * 0.01);
    
    // Add bonus if close to finish point
    // Increase target finish line circle collision radius to slightly exceed road width (typically 140-150px, so 100px radius = 200px diameter)
    if (distToFinish < 100) {
      this.fitness += 10000; // HUGE fitness bonus for completing
    }
  }

  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height);
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(this.angle + Math.PI - alpha) * rad,
      y: this.y - Math.cos(this.angle + Math.PI - alpha) * rad
    });
    points.push({
      x: this.x - Math.sin(this.angle + Math.PI + alpha) * rad,
      y: this.y - Math.cos(this.angle + Math.PI + alpha) * rad
    });
    return points;
  }

  #assessDamage(roadBorders) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }
    return false;
  }

  #move() {
    // Throttle increases speed up to maxSpeed
    const throttleForce = this.controls.throttle * this.acceleration;
    // Brake slows the car down with deceleration force
    const brakeForce = this.controls.brake * this.acceleration * 2;

    if (throttleForce > 0) {
      this.speed += throttleForce;
    }
    if (brakeForce > 0) {
      this.speed -= brakeForce;
    }

    // Clamp speed between 0 and maxSpeed (cannot reverse in this GA setup to prevent endless backward loops)
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < 0) {
      this.speed = 0;
    }

    // Apply friction
    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed = 0;
    }

    // Turn car using steering output:
    // -1 (Left) to 1 (Right)
    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      // Steer factor scales with steering action & speed to make physics smoother
      const steerFactor = 0.04 * this.controls.steering;
      this.angle -= steerFactor * flip;
    }

    // Update coordinates
    this.x -= Math.sin(this.angle) * this.speed;
    this.y -= Math.cos(this.angle) * this.speed;
  }

  draw(ctx, color, drawSensor = false) {
    if (!this.polygon || this.polygon.length === 0) {
      return;
    }

    if (this.damaged) {
      ctx.fillStyle = "rgba(128, 128, 128, 0.4)";
    } else {
      ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }
    ctx.fill();

    // Draw simple windscreen/headlights for visual appeal
    if (!this.damaged && this.polygon.length >= 4) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
      ctx.lineTo(this.polygon[1].x, this.polygon[1].y);
      // Mid points for windscreen
      const mid1 = {
        x: (this.polygon[0].x + this.polygon[3].x) / 2,
        y: (this.polygon[0].y + this.polygon[3].y) / 2
      };
      const mid2 = {
        x: (this.polygon[1].x + this.polygon[2].x) / 2,
        y: (this.polygon[1].y + this.polygon[2].y) / 2
      };
      ctx.lineTo(mid2.x, mid2.y);
      ctx.lineTo(mid1.x, mid1.y);
      ctx.fill();
    }

    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }
  }

  reset() {
    this.x = this.originalX;
    this.y = this.originalY;
    this.speed = 0;
    this.angle = 0;
    this.damaged = false;
    this.finished = false;
    this.timeAlive = 0;
    this.distanceTraveled = 0;
    this.fitness = 0;
    this.stationaryTime = 0;

    if (this.sensor) {
      this.sensor.update([]); // Clear sensor readings
    }

  }
}

// Check polygon-line segment intersection
function polysIntersect(poly, line) {
  for (let i = 0; i < poly.length; i++) {
    const nextIdx = (i + 1) % poly.length;
    const touch = getIntersection(
      poly[i],
      poly[nextIdx],
      line[0],
      line[1]
    );
    if (touch) {
      return true;
    }
  }
  return false;
}
