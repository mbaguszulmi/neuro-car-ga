# 🏎️ 2D Self-Driving Car Simulation with Genetic Algorithm

An interactive, modular 2D Self-Driving Car simulation built from scratch using HTML5 Canvas, Vanilla CSS3, and pure JavaScript. The simulation uses a Feedforward Neural Network as the brain of the car and a Genetic Algorithm (GA) to evolve the optimal weights and biases to guide cars from Point A to Point B.

---

## 🚀 Features

*   **Responsive Multi-View Dashboard**: Includes a home page presenting the PEAS overview, an advanced real-time training page, and a testing sandbox page.
*   **Modular Roads/Tracks (`roads.json`)**: Configured with three tracks (Straight Highway, S-Curve Circuit, Grand Prix Challenge) representing start/finish points, lanes, borders, and center lines.
*   **Agent PEAS Representation**:
    *   **Performance (P)**: Evaluates fitness based on progress along the track's waypoint sequence, elapsed survival time, and arrival success.
    *   **Environment (E)**: 2D roads featuring complex corners, curves, and check points.
    *   **Actuators (A)**: Precision throttle force [0, 1], braking force [0, 1], and steering turns [-1, 1].
    *   **Sensors (S)**: 5 distance sensors (ray-casting) measuring the distance to the road borders in a 120-degree field of view.
*   **Genetic Algorithm (GA)**:
    *   Population size of 100.
    *   Elitist selection (top-performing agent survives exactly to the next gen).
    *   Crossover and mutation from the top N best parents.
    *   Stall-detection: Automatically destroys stagnated/stationary cars (after 1.5 seconds of non-movement) to optimize generation times.
*   **Telemetry & Visualization**:
    *   **Active Brain Visualizer**: Real-time rendering of the best-performing car's neural network, detailing inputs, outputs, connections, and neuron activation states.
    *   **GA Learning Curve Chart**: Renders a line chart tracking the generation-over-generation maximum fitness progress.
*   **Model Portability**: Export the best-trained model in JSON format, or import a saved JSON brain directly into either Training (as a seed) or Testing mode.

---

## 📂 Project Structure

```
├── index.html            # Main markup and application pages structure
└── src/
    ├── css/
    │   └── style.css     # Clean modern dark theme UI styles
    ├── data/
    │   └── roads.json    # JSON representation of straight, curvy, and complex tracks
    └── js/
        ├── network.js    # Neural Network implementation (feedforward, crossover, mutate)
        ├── sensor.js     # Raycasting sensor math and drawing logic
        ├── car.js        # Car movement physics, bounding polygons, collision & fitness logic
        ├── road.js       # Road generating, border drawing, and rendering
        ├── ga.js         # Genetic Algorithm selection, crossover, and mutation managers
        ├── visualizer.js # Neural network active graph and progress line chart drawer
        └── main.js       # Core animation loop, page navigators, and event handlers
```

---

## 🛠️ How to Run

1.  Clone this repository or navigate to its directory.
2.  Launch a local web server (e.g., using VS Code Live Server on port `5500`, or via Python: `python3 -m http.server 8000`).
3.  Open your browser to `http://127.0.0.1:5500` or the corresponding port.

---

## 🎮 How to Use

### 1. Training Mode
1.  Navigate to **Training Mode** from the top navbar.
2.  Select your target **Track** and customize the **Mutation Rate** (default is 15%).
3.  Select a Seed Weight Mode:
    *   **Random**: Cars start with completely randomized brains.
    *   **Import Model**: Upload an existing JSON model to use as the base for the population's mutations.
4.  Click **🚀 Start Training** to begin. The simulation will run generations of 100 cars automatically.
5.  Watch the live active brain and max fitness charts update. At any time, pause or click **📥 Export Best Model** to save progress.
6.  Once any car successfully reaches the **Finish line**, the simulation will alert you, download the success model, and automatically load it into **Testing Mode**!

### 2. Testing Mode
1.  Navigate to **Testing Mode**.
2.  Click **📥 Import Saved JSON Model** and upload a previously trained/exported JSON model (if not already autoloaded from a successful training run).
3.  Choose a **Test Track** and click **🏎️ Launch Evaluation**.
4.  Observe the live velocity telemetry and control actuators as the car autonomously navigates the track.
