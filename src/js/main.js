// GLOBAL APPLICATION CONTROLLER
let roadsData = [];
let selectedRoad = null;

// TRAINING VARS
let trainingGA = null;
let trainingCars = [];
let trainingBestCar = null;
let trainingRoad = null;
let trainingHistory = []; // stores max fitness per generation
let trainingIsRunning = false;
let trainingAnimId = null;
let importedTrainingBrain = null;

// TESTING VARS
let testingCar = null;
let testingRoad = null;
let testingIsRunning = false;
let testingAnimId = null;
let importedTestingBrain = null;

// DOM ELEMENTS - NAVIGATION
const homePage = document.getElementById("home-page");
const trainingPage = document.getElementById("training-page");
const testingPage = document.getElementById("testing-page");

const homeNavBtn = document.getElementById("home-nav-btn");
const trainingNavBtn = document.getElementById("training-nav-btn");
const testingNavBtn = document.getElementById("testing-nav-btn");
const logoBtn = document.getElementById("logo-btn");

const startTrainingBtn = document.getElementById("start-training-btn");
const startTestingBtn = document.getElementById("start-testing-btn");

// DOM ELEMENTS - TRAINING CONTROL PANEL
const roadSelectTraining = document.getElementById("road-select-training");
const mutationRateSlider = document.getElementById("mutation-rate");
const mutationValSpan = document.getElementById("mutation-val");
const seedModeRadio = document.getElementsByName("seed-mode");
const importTrainingContainer = document.getElementById("import-training-container");
const importTrainingFile = document.getElementById("import-training-file");
const importTrainingFilename = document.getElementById("import-training-filename");

const runTrainingBtn = document.getElementById("run-training-btn");
const pauseTrainingBtn = document.getElementById("pause-training-btn");
const resetTrainingBtn = document.getElementById("reset-training-btn");
const exportTrainingBtn = document.getElementById("export-training-btn");

// DOM ELEMENTS - TRAINING STATS
const statGen = document.getElementById("stat-gen");
const statAlive = document.getElementById("stat-alive");
const statFitness = document.getElementById("stat-fitness");
const statDistance = document.getElementById("stat-distance");

// DOM ELEMENTS - CANVAS
const trainingCanvas = document.getElementById("training-canvas");
const networkCanvas = document.getElementById("network-canvas");
const chartCanvas = document.getElementById("chart-canvas");

const testingCanvas = document.getElementById("testing-canvas");
const testingNetworkCanvas = document.getElementById("testing-network-canvas");

// DOM ELEMENTS - TESTING CONTROL PANEL
const importTestingFile = document.getElementById("import-testing-file");
const importTestingFilename = document.getElementById("import-testing-filename");
const roadSelectTesting = document.getElementById("road-select-testing");
const runTestingBtn = document.getElementById("run-testing-btn");
const stopTestingBtn = document.getElementById("stop-testing-btn");

// DOM ELEMENTS - TESTING STATS
const testStatSpeed = document.getElementById("test-stat-speed");
const testStatControls = document.getElementById("test-stat-controls");
const testStatStatus = document.getElementById("test-stat-status");

// INITIALIZATION
window.addEventListener("DOMContentLoaded", async () => {
  // Load road data from JSON
  try {
    const response = await fetch("src/data/roads.json");
    roadsData = await response.json();
    populateRoadSelectors();
  } catch (err) {
    console.error("Failed to load roads.json, using local fallback", err);
    roadsData = getFallbackRoads();
    populateRoadSelectors();
  }

  setupNavigation();
  setupTrainingEventListeners();
  setupTestingEventListeners();
  resizeCanvases();
});

// RESIZE CANVASES ON WINDOW CHANGE
window.addEventListener("resize", resizeCanvases);

function resizeCanvases() {
  // Setup sizing for simulation canvases based on their wrappers
  [trainingCanvas, testingCanvas].forEach(canvas => {
    if (canvas && canvas.parentElement) {
      canvas.width = 400; // Fixed virtual width for standard physics & rendering coordination
      canvas.height = canvas.parentElement.clientHeight;
    }
  });

  // Visualizer canvases
  [networkCanvas, chartCanvas, testingNetworkCanvas].forEach(canvas => {
    if (canvas && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
  });
}

// NAVIGATION CONTROLLERS
function setupNavigation() {
  const navTo = (pageId) => {
    // Pause active runs
    pauseTraining();
    stopTesting();

    // Reset styles
    [homePage, trainingPage, testingPage].forEach(p => p.classList.remove("active"));
    [homeNavBtn, trainingNavBtn, testingNavBtn].forEach(b => b.classList.remove("active"));

    // Set active
    if (pageId === "home") {
      homePage.classList.add("active");
      homeNavBtn.classList.add("active");
    } else if (pageId === "training") {
      trainingPage.classList.add("active");
      trainingNavBtn.classList.add("active");
      resizeCanvases();
      initTrainingSimulation();
    } else if (pageId === "testing") {
      testingPage.classList.add("active");
      testingNavBtn.classList.add("active");
      resizeCanvases();
      initTestingSimulation();
    }
  };

  logoBtn.addEventListener("click", () => navTo("home"));
  homeNavBtn.addEventListener("click", () => navTo("home"));
  trainingNavBtn.addEventListener("click", () => navTo("training"));
  testingNavBtn.addEventListener("click", () => navTo("testing"));

  startTrainingBtn.addEventListener("click", () => navTo("training"));
  startTestingBtn.addEventListener("click", () => navTo("testing"));
}

// POPULATE ROAD OPTIONS IN DROPDOWNS
function populateRoadSelectors() {
  [roadSelectTraining, roadSelectTesting].forEach(select => {
    if (!select) return;
    select.innerHTML = "";
    roadsData.forEach(road => {
      const option = document.createElement("option");
      option.value = road.id;
      option.textContent = road.name;
      select.appendChild(option);
    });
  });
}

// --- TRAINING MODE LOGIC ---

function setupTrainingEventListeners() {
  // Mutation Slider
  mutationRateSlider.addEventListener("input", (e) => {
    mutationValSpan.textContent = `${e.target.value}%`;
    if (trainingGA) {
      trainingGA.mutationRate = e.target.value / 100;
    }
  });

  // Seed Mode toggle
  seedModeRadio.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "import") {
        importTrainingContainer.classList.remove("hidden");
      } else {
        importTrainingContainer.classList.add("hidden");
        importedTrainingBrain = null;
        importTrainingFilename.textContent = "No model loaded";
      }
    });
  });

  // Import file picker
  importTrainingFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          importedTrainingBrain = JSON.parse(event.target.result);
          importTrainingFilename.textContent = file.name;
        } catch (err) {
          alert("Invalid JSON model file structure.");
          importedTrainingBrain = null;
          importTrainingFilename.textContent = "Error loading file";
        }
      };
      reader.readAsText(file);
    }
  });

  // Road select change
  roadSelectTraining.addEventListener("change", () => {
    initTrainingSimulation();
  });

  // Control Buttons
  runTrainingBtn.addEventListener("click", startTraining);
  pauseTrainingBtn.addEventListener("click", pauseTraining);
  resetTrainingBtn.addEventListener("click", resetTraining);
  exportTrainingBtn.addEventListener("click", exportBestTrainingModel);
}

function initTrainingSimulation() {
  cancelAnimationFrame(trainingAnimId);
  trainingIsRunning = false;

  const roadId = roadSelectTraining.value;
  const roadData = roadsData.find(r => r.id === roadId) || roadsData[0];
  trainingRoad = new Road(roadData);

  trainingGA = new GeneticAlgorithm(100, mutationRateSlider.value / 100);
  
  // Base start location on the road's start point
  trainingCars = trainingGA.generatePopulation(
    trainingRoad.startPoint.x,
    trainingRoad.startPoint.y,
    importedTrainingBrain
  );

  trainingBestCar = trainingCars[0];
  
  // Reset Stats UI
  statGen.textContent = trainingGA.generation;
  statAlive.textContent = `${trainingCars.length}/${trainingGA.populationSize}`;
  statFitness.textContent = "0";
  statDistance.textContent = "0m";

  // Hide/Show correct buttons
  runTrainingBtn.classList.remove("hidden");
  pauseTrainingBtn.classList.add("hidden");
  exportTrainingBtn.disabled = true;

  drawTrainingFrame();
}

function startTraining() {
  if (trainingIsRunning) return;
  trainingIsRunning = true;
  runTrainingBtn.classList.add("hidden");
  pauseTrainingBtn.classList.remove("hidden");
  animateTraining();
}

function pauseTraining() {
  if (!trainingIsRunning) return;
  trainingIsRunning = false;
  runTrainingBtn.classList.remove("hidden");
  pauseTrainingBtn.classList.add("hidden");
  cancelAnimationFrame(trainingAnimId);
}

function resetTraining() {
  pauseTraining();
  trainingHistory = [];
  initTrainingSimulation();
}

function animateTraining() {
  if (!trainingIsRunning) return;

  // Update simulation
  updateTrainingSimulation();

  // Draw simulation
  drawTrainingFrame();

  trainingAnimId = requestAnimationFrame(animateTraining);
}

function updateTrainingSimulation() {
  let aliveCount = 0;
  
  for (let i = 0; i < trainingCars.length; i++) {
    trainingCars[i].update(
      trainingRoad.borders,
      trainingRoad.endPoint,
      trainingRoad.waypoints
    );
    if (!trainingCars[i].damaged) {
      aliveCount++;
    }
  }

  // Find the current best car (farthest progress/highest fitness)
  trainingBestCar = trainingCars.reduce(
    (best, current) => current.fitness > best.fitness ? current : best,
    trainingCars[0]
  );

  // Update Stats UI
  statGen.textContent = trainingGA.generation;
  statAlive.textContent = `${aliveCount}/${trainingCars.length}`;
  statFitness.textContent = Math.round(trainingBestCar.fitness);
  statDistance.textContent = `${Math.round(Math.max(0, trainingBestCar.distanceTraveled / 10))}m`;

  // Enable exporting when we have progress
  exportTrainingBtn.disabled = false;

  // CHECK IF ANY CAR REACHED POINT B (FINISH)
  const distToFinish = Math.hypot(
    trainingBestCar.x - trainingRoad.endPoint.x,
    trainingBestCar.y - trainingRoad.endPoint.y
  );

  if (distToFinish < 40) {
    trainingBestCar.finished = true;
    pauseTraining();
    
    // Auto-export / Switch to testing mode immediately
    alert(`Success! Car reached the finish line in generation ${trainingGA.generation}! Exporting model and switching to testing mode.`);
    
    const brainJson = JSON.stringify(trainingBestCar.brain);
    downloadJSON(brainJson, `best_model_gen_${trainingGA.generation}.json`);

    // Preload testing brain automatically
    importedTestingBrain = trainingBestCar.brain;
    importTestingFilename.textContent = `best_model_gen_${trainingGA.generation}.json (Autoloaded)`;
    roadSelectTesting.disabled = false;
    runTestingBtn.disabled = false;

    // Direct user to testing page
    testingNavBtn.click();
    return;
  }

  // GENERATION TRANSITION (If everyone is dead or taking too much time)
  const allDead = trainingCars.every(car => car.damaged);
  const generationTimeLimit = 1500; // frame limit per generation to avoid infinite loops of stuck cars
  const forceNextGen = trainingCars[0].timeAlive > generationTimeLimit;

  if (allDead || forceNextGen) {
    // Record best fitness for graph history
    trainingHistory.push(trainingBestCar.fitness);
    
    // Evolve!
    const results = trainingGA.nextGeneration(
      trainingCars,
      trainingRoad.startPoint.x,
      trainingRoad.startPoint.y
    );

    trainingCars = results.newCars;
    trainingBestCar = trainingCars[0];
  }
}

function drawTrainingFrame() {
  const ctx = trainingCanvas.getContext("2d");
  
  // Draw Road and Cars on main simulation viewport
  ctx.clearRect(0, 0, trainingCanvas.width, trainingCanvas.height);

  ctx.save();
  // Camera following best car: Translate context relative to y coordinate of the best car
  ctx.translate(-trainingBestCar.x + trainingCanvas.width * 0.5, -trainingBestCar.y + trainingCanvas.height * 0.7);

  // Draw Road
  trainingRoad.draw(ctx);

  // Draw other cars semi-transparently
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < trainingCars.length; i++) {
    if (trainingCars[i] !== trainingBestCar) {
      trainingCars[i].draw(ctx, "#00bc8c");
    }
  }
  
  // Draw Best Car fully opaque and with active sensor rays visible
  ctx.globalAlpha = 1.0;
  trainingBestCar.draw(ctx, "#ff007f", true);

  ctx.restore();

  // Draw Neural Network Visualizer
  const netCtx = networkCanvas.getContext("2d");
  Visualizer.drawNetwork(netCtx, trainingBestCar.brain);

  // Draw Learning Chart
  Visualizer.drawChart(chartCanvas, trainingHistory);
}

function exportBestTrainingModel() {
  if (!trainingBestCar) return;
  const jsonStr = JSON.stringify(trainingBestCar.brain);
  downloadJSON(jsonStr, `best_model_gen_${trainingGA.generation}.json`);
}

function downloadJSON(content, fileName) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: "application/json" });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

// --- TESTING MODE LOGIC ---

function setupTestingEventListeners() {
  // Import Saved Model file picker
  importTestingFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          importedTestingBrain = JSON.parse(event.target.result);
          importTestingFilename.textContent = file.name;
          
          // Enable controls now that model is loaded
          roadSelectTesting.disabled = false;
          runTestingBtn.disabled = false;
          initTestingSimulation();
        } catch (err) {
          alert("Invalid JSON model file structure.");
          importedTestingBrain = null;
          importTestingFilename.textContent = "Error importing file";
          roadSelectTesting.disabled = true;
          runTestingBtn.disabled = true;
        }
      };
      reader.readAsText(file);
    }
  });

  // Road select change
  roadSelectTesting.addEventListener("change", () => {
    initTestingSimulation();
  });

  // Action Buttons
  runTestingBtn.addEventListener("click", startTesting);
  stopTestingBtn.addEventListener("click", stopTesting);
}

function initTestingSimulation() {
  cancelAnimationFrame(testingAnimId);
  testingIsRunning = false;

  const roadId = roadSelectTesting.value;
  const roadData = roadsData.find(r => r.id === roadId) || roadsData[0];
  testingRoad = new Road(roadData);

  // Setup single testing car from loaded brain
  testingCar = new Car(testingRoad.startPoint.x, testingRoad.startPoint.y, 30, 50, "AI", 4); // Testing car can go faster for performance display!
  if (importedTestingBrain) {
    testingCar.brain = importedTestingBrain;
  }

  // Setup UI defaults
  testStatSpeed.textContent = "0.0 km/h";
  testStatControls.textContent = "THR: 0% | BRK: 0% | STR: 0°";
  testStatStatus.textContent = "Standby (Ready)";

  runTestingBtn.classList.remove("hidden");
  stopTestingBtn.classList.add("hidden");

  drawTestingFrame();
}

function startTesting() {
  if (testingIsRunning) return;
  if (testingCar.damaged) {
    testingCar.reset()
  }

  testingIsRunning = true;
  runTestingBtn.classList.add("hidden");
  stopTestingBtn.classList.remove("hidden");
  testStatStatus.textContent = "Evaluating...";
  animateTesting();
}

function stopTesting() {
  if (!testingIsRunning) return;
  testingIsRunning = false;
  runTestingBtn.classList.remove("hidden");
  stopTestingBtn.classList.add("hidden");
  cancelAnimationFrame(testingAnimId);
  testStatStatus.textContent = "Evaluation Stopped";
}

function animateTesting() {
  if (!testingIsRunning) return;

  // Update
  testingCar.update(
    testingRoad.borders,
    testingRoad.endPoint,
    testingRoad.waypoints
  );

  // Update live metrics on Dashboard
  const kph = (testingCar.speed * 12).toFixed(1); // Mapped visual scale
  testStatSpeed.textContent = `${kph} km/h`;
  testStatControls.textContent = `THR: ${Math.round(testingCar.controls.throttle * 100)}% | BRK: ${Math.round(testingCar.controls.brake * 100)}% | STR: ${Math.round(testingCar.controls.steering * 45)}°`;

  // Assess status (crashed, finished, driving)
  if (testingCar.damaged) {
    testStatStatus.textContent = "💥 CRASHED! (Off-Track)";
    testStatStatus.style.color = "#dc3545";
    stopTesting();
  } else {
    const distToFinish = Math.hypot(
      testingCar.x - testingRoad.endPoint.x,
      testingCar.y - testingRoad.endPoint.y
    );
    if (distToFinish < 40) {
      testStatStatus.textContent = "🏆 SUCCESS! Arrived safely at Point B.";
      testStatStatus.style.color = "#28a745";
      testingCar.finished = true;
      stopTesting();
    }
  }

  // Draw
  drawTestingFrame();

  testingAnimId = requestAnimationFrame(animateTesting);
}

function drawTestingFrame() {
  const ctx = testingCanvas.getContext("2d");
  ctx.clearRect(0, 0, testingCanvas.width, testingCanvas.height);

  ctx.save();
  // Camera follow testing car
  ctx.translate(-testingCar.x + testingCanvas.width * 0.5, -testingCar.y + testingCanvas.height * 0.7);

  testingRoad.draw(ctx);
  testingCar.draw(ctx, "#375a7f", true);

  ctx.restore();

  // Update telemetry NN
  const netCtx = testingNetworkCanvas.getContext("2d");
  Visualizer.drawNetwork(netCtx, testingCar.brain);
}

// FALLBACK ROADS SETUP (In case Fetch roads.json fails during local access)
function getFallbackRoads() {
  return [
    {
      "id": "straight_road",
      "name": "Straight Highway",
      "description": "A simple straight road to test basic throttle and speed control.",
      "startPoint": { "x": 100, "y": 2800 },
      "endPoint": { "x": 100, "y": 200 },
      "width": 150,
      "waypoints": [
        { "x": 100, "y": 2800 },
        { "x": 100, "y": 2500 },
        { "x": 100, "y": 2000 },
        { "x": 100, "y": 1500 },
        { "x": 100, "y": 1000 },
        { "x": 100, "y": 500 },
        { "x": 100, "y": 200 }
      ]
    },
    {
      "id": "curvy_road",
      "name": "S-Curve Circuit",
      "description": "An S-shaped road designed to test basic steering control.",
      "startPoint": { "x": 100, "y": 2800 },
      "endPoint": { "x": 800, "y": 200 },
      "width": 150,
      "waypoints": [
        { "x": 100, "y": 2800 },
        { "x": 100, "y": 2400 },
        { "x": 200, "y": 2000 },
        { "x": 400, "y": 1800 },
        { "x": 600, "y": 1600 },
        { "x": 700, "y": 1200 },
        { "x": 500, "y": 800 },
        { "x": 300, "y": 600 },
        { "x": 400, "y": 300 },
        { "x": 800, "y": 200 }
      ]
    },
    {
      "id": "complex_road",
      "name": "Grand Prix Challenge",
      "description": "A complex circuit with sharp turns, hairpins, and straightaways.",
      "startPoint": { "x": 100, "y": 2800 },
      "endPoint": { "x": 900, "y": 500 },
      "width": 140,
      "waypoints": [
        { "x": 100, "y": 2800 },
        { "x": 100, "y": 2300 },
        { "x": 250, "y": 2100 },
        { "x": 500, "y": 2100 },
        { "x": 650, "y": 1900 },
        { "x": 500, "y": 1600 },
        { "x": 200, "y": 1500 },
        { "x": 100, "y": 1200 },
        { "x": 200, "y": 900 },
        { "x": 500, "y": 900 },
        { "x": 750, "y": 700 },
        { "x": 900, "y": 500 }
      ]
    }
  ];
}
