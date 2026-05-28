# 2D Self-Driving Car Simulation with Genetic Algorithm

An interactive 2D self-driving car simulation built with HTML5 Canvas, CSS, and vanilla JavaScript. The project demonstrates how a simple feedforward neural network can control a car and how a Genetic Algorithm (GA) can evolve that network until the car learns to drive from a start point to a finish point.

The app runs entirely in the browser. There is no build step, package manager, backend service, or external JavaScript dependency.

---

## Features

- **Multi-page browser dashboard**
  - Home page with a PEAS overview.
  - Training Mode for evolving neural-network-driven cars.
  - Testing Mode for evaluating an imported or newly trained model.
- **Canvas-based simulation**
  - Road rendering, car polygons, sensor rays, road-border collision, and camera follow behavior are drawn directly on canvas.
- **Configurable tracks**
  - Tracks are loaded from `src/data/roads.json`.
  - The current project includes Straight Highway, S-Curve Circuit, and Grand Prix Challenge.
- **Ray-casting sensors**
  - Each car uses 5 front-facing distance sensors.
  - Sensor rays are 150 pixels long and spread across a 120-degree field of view.
- **Neural-network controller**
  - Network shape: `[5, 6, 3]`.
  - Inputs are sensor readings.
  - Outputs control throttle, brake, and steering.
- **Genetic Algorithm training**
  - Population size: 100 cars.
  - Top 10 cars are used as parents.
  - The best car is preserved exactly through elitism.
  - New cars are created with crossover and mutation.
- **Live telemetry**
  - Training stats include generation, cars alive, best fitness, and best distance.
  - Training speed can be cycled between `1x`, `2x`, `5x`, and `10x`.
  - Testing stats include speed, elapsed time, control outputs, and status.
- **Visualization**
  - Active neural-network graph.
  - GA learning curve chart based on maximum generation fitness.
  - Responsive visualizer canvases for desktop and mobile layouts.
- **Model portability**
  - Export the best trained brain as JSON.
  - Import JSON models into Training Mode as seed brains.
  - Import JSON models into Testing Mode for evaluation.
  - Use the included `sample_models` files for quick Grand Prix Challenge testing.

---

## Project Structure

```text
.
├── index.html
├── README.md
├── sample_models
│   ├── best.json
│   ├── best_fast.json
│   └── best_quick.json
└── src
    ├── css
    │   └── style.css
    ├── data
    │   └── roads.json
    └── js
        ├── car.js
        ├── ga.js
        ├── main.js
        ├── network.js
        ├── road.js
        ├── sensor.js
        └── visualizer.js
```

### Main Files

- `index.html` defines the Home, Training Mode, and Testing Mode pages and loads all scripts.
- `sample_models/` contains ready-to-import trained models for Testing Mode.
- `src/css/style.css` contains the responsive dark dashboard styling.
- `src/data/roads.json` defines the available tracks.
- `src/js/main.js` coordinates app state, navigation, event handlers, animation loops, imports, exports, and training/testing workflows.
- `src/js/network.js` implements the feedforward neural network, cloning, crossover, and mutation.
- `src/js/sensor.js` implements ray casting and line intersection detection.
- `src/js/car.js` implements car physics, controls, collision detection, fitness scoring, drawing, and reset behavior.
- `src/js/road.js` builds road borders from track waypoints and renders the road, start, and finish markers.
- `src/js/ga.js` manages population creation and generation evolution.
- `src/js/visualizer.js` draws the active neural network and the fitness history chart.

---

## How to Run

Use a local web server from the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

A local server is recommended because the app loads `src/data/roads.json` with `fetch()`. Opening `index.html` directly may be blocked by browser file-access rules. If the JSON fetch fails, the app uses an embedded fallback copy of the same default roads.

---

## How to Use

### Home Page

The Home page introduces the project through a PEAS description:

- **Performance**: drive safely and efficiently from the start point to the finish point.
- **Environment**: 2D roads with straight sections, curves, checkpoints, and boundaries.
- **Actuators**: throttle, brake, and steering.
- **Sensors**: front-facing ray-cast distance sensors.

Use the navigation bar or page buttons to enter Training Mode or Testing Mode.

### Training Mode

Training Mode evolves a population of AI-controlled cars.

1. Choose a track from the **Select Track** dropdown.
2. Adjust the population size to trade off exploration against simulation speed.
3. Choose a mutation rate from `1%` to `50%`. The default is `15%`.
4. Choose a seed mode:
   - **Random**: every starting brain is randomly initialized.
   - **Import Model**: upload a JSON brain and use it as the base for the population.
5. Click **Start Training**.
6. Use the **Speed** button to cycle training playback speed through `1x`, `2x`, `5x`, and `10x`.
7. Watch the best car, live brain visualizer, learning chart, and stats update in real time.
8. Use **Pause**, **Reset**, or **Export Best Model** as needed.

When the best car gets within 50 pixels of the finish point, the app pauses training, downloads the winning model JSON, preloads it into Testing Mode, and switches to the testing screen.

### Testing Mode

Testing Mode evaluates one trained model on a selected track.

1. Import a saved JSON model, unless a successful training run already autoloaded one.
2. Choose a test track.
3. Click **Launch Evaluation**.
4. Watch the car drive with live velocity, elapsed time, control-output, status, and brain telemetry.

Testing stops when the car crashes, gets within 50 pixels of the finish point, or the user clicks **Stop**. The elapsed-time stopwatch starts when evaluation launches and freezes when the run ends.

---

## How the Simulation Works

### Road Model

Roads are defined as waypoint centerlines in `src/data/roads.json`. Each road has:

- `id`: stable identifier used by the UI.
- `name`: human-readable track name.
- `description`: short track description.
- `startPoint`: `{ "x": number, "y": number }`.
- `endPoint`: `{ "x": number, "y": number }`.
- `width`: road width in pixels.
- `waypoints`: ordered centerline points.

`Road` converts the waypoint centerline into left and right border line segments. Cars collide against these border segments.

### Sensors

Each AI car has 5 rays projected from the car's current position. For every ray, the sensor checks intersection against all road-border segments.

The closest intersection becomes that sensor's reading. If a ray does not hit a border, the reading is `null`.

Neural-network inputs are normalized like this:

- border detected: `1 - offset`
- no border detected: `0`

This means closer obstacles produce stronger input values.

### Neural Network

Each car brain is a feedforward neural network:

```text
5 inputs -> 6 hidden neurons -> 3 outputs
```

The network uses `Math.tanh()` activation, so raw outputs are in the `-1` to `1` range.

Outputs are mapped to car controls:

- Output 0: throttle, mapped from `[-1, 1]` to `[0, 1]`.
- Output 1: brake, mapped from `[-1, 1]` to `[0, 1]`.
- Output 2: steering, used directly as `[-1, 1]`.

### Car Physics

Cars use simple 2D physics:

- Throttle increases speed.
- Brake reduces speed.
- Friction gradually slows the car.
- Speed is clamped between `0` and the car's maximum speed.
- Cars do not reverse.
- Steering only affects the car while it is moving.
- A rotated polygon represents the car body for collision detection.

Training cars use the default max speed. Testing cars are created with a higher max speed for clearer performance display.

### Fitness

Fitness rewards progress along the road and penalizes poor outcomes.

The score is based on:

- progress through the waypoint sequence,
- distance to the nearest waypoint,
- a crash penalty,
- a small survival-time reward,
- a large bonus when within 100 pixels of the finish point.

A car is also marked damaged if it remains almost stationary for more than 90 frames. This prevents stuck cars from wasting generation time.

### Genetic Algorithm

Training starts with 100 cars. Each generation:

1. All cars update until they crash, reach the finish, become stuck, or the 1500-frame generation limit is reached.
2. Cars are sorted by fitness.
3. The top 10 cars become parents.
4. The best parent's brain is copied exactly into the next generation.
5. The rest of the population is created through parent crossover and mutation.

The mutation rate is controlled by the Training Mode slider.

---

## Model Import and Export

Exported models are raw neural-network JSON objects containing levels, weights, and biases.

Typical workflow:

1. Train on a simple track.
2. Export the best model.
3. Import that model into Training Mode as a seed for more training.
4. Import the model into Testing Mode to evaluate it on the same or a different track.

The app does not currently validate model shape beyond JSON parsing. Import files should be models exported by this project.

### Included Sample Models

The `sample_models/` folder contains trained models that can be imported directly in Testing Mode. These are intended for the **Grand Prix Challenge** road.

| File | Track | Recorded Time |
| --- | --- | --- |
| `sample_models/best.json` | Grand Prix Challenge | 16.38s |
| `sample_models/best_quick.json` | Grand Prix Challenge | 15.18s |
| `sample_models/best_fast.json` | Grand Prix Challenge | 15.15s |

To try one, open Testing Mode, click **Import Saved JSON Model**, choose one of the sample JSON files, select **Grand Prix Challenge**, and launch the evaluation.

---

## Customizing Tracks

Add or edit tracks in `src/data/roads.json`.

Example:

```json
{
  "id": "example_track",
  "name": "Example Track",
  "description": "A short custom route.",
  "startPoint": { "x": 100, "y": 1000 },
  "endPoint": { "x": 500, "y": 200 },
  "width": 150,
  "waypoints": [
    { "x": 100, "y": 1000 },
    { "x": 200, "y": 700 },
    { "x": 500, "y": 200 }
  ]
}
```

Guidelines:

- Keep `startPoint` aligned with the first waypoint.
- Keep `endPoint` aligned with the final waypoint.
- Use enough waypoints to describe curves and turns smoothly.
- Wider roads are easier for early training.
- Train on simpler roads before moving to complex tracks.

---

## Troubleshooting

- **Tracks do not appear**: run the project through a local server instead of opening `index.html` directly.
- **Training looks slow**: use Straight Highway first, then seed harder tracks with a previously exported model.
- **Cars crash immediately**: reduce mutation when fine-tuning an imported model, or train for more generations from random initialization.
- **Cars stop moving**: stationary cars are intentionally marked damaged after 90 frames to speed up training.
- **Imported model fails**: make sure the file is valid JSON exported from this project.
- **No model can be exported yet**: start training first; export becomes available after progress begins.
- **Visualizer is blank on mobile**: resize the browser or revisit the page; the app recalculates canvas dimensions after layout changes and uses mobile min-heights for visualizer panels.

---

## Current Default Tracks

| Track | Purpose |
| --- | --- |
| Straight Highway | Basic throttle and forward movement training. |
| S-Curve Circuit | Steering behavior through smooth turns. |
| Grand Prix Challenge | More difficult route with sharper turns and longer navigation. |

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- JSON track configuration

No npm packages or bundlers are required.
