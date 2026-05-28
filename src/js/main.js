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
let trainingPopulationSize = 100;
const trainingSpeedOptions = [1, 2, 5, 10];
let trainingSpeedIndex = 0;
let trainingSpeedMultiplier = trainingSpeedOptions[trainingSpeedIndex];

// TESTING VARS
let testingCar = null;
let testingRoad = null;
let testingIsRunning = false;
let testingAnimId = null;
let importedTestingBrain = null;
let testingStartTime = 0;
let testingElapsedMs = 0;
let testingTimerFinalized = true;

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
const populationSizeInput = document.getElementById("pop-size");
const mutationRateSlider = document.getElementById("mutation-rate");
const mutationValSpan = document.getElementById("mutation-val");
const seedModeRadio = document.getElementsByName("seed-mode");
const importTrainingContainer = document.getElementById("import-training-container");
const importTrainingFile = document.getElementById("import-training-file");
const importTrainingFilename = document.getElementById("import-training-filename");

const runTrainingBtn = document.getElementById("run-training-btn");
const pauseTrainingBtn = document.getElementById("pause-training-btn");
const trainingSpeedBtn = document.getElementById("training-speed-btn");
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
const testStatElapsed = document.getElementById("test-stat-elapsed");
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
window.addEventListener("resize", resizeAndRedrawActivePage);

function resizeCanvases() {
  // Setup sizing for simulation canvases based on their wrappers
  [trainingCanvas, testingCanvas].forEach(canvas => {
    if (canvas && canvas.parentElement) {
      const wrapperRect = canvas.parentElement.getBoundingClientRect();
      canvas.width = 400; // Fixed virtual width for standard physics & rendering coordination
      canvas.height = Math.max(
        1,
        Math.round(wrapperRect.height || canvas.parentElement.clientHeight || 480)
      );
    }
  });

  // Visualizer canvases
  [networkCanvas, chartCanvas, testingNetworkCanvas].forEach(canvas => {
    if (canvas && canvas.parentElement) {
      const wrapperRect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(
        1,
        Math.round(wrapperRect.width || canvas.parentElement.clientWidth || 300)
      );
      canvas.height = Math.max(
        1,
        Math.round(wrapperRect.height || canvas.parentElement.clientHeight || 240)
      );
    }
  });
}

function resizeAndRedrawActivePage() {
  resizeCanvases();
  redrawActivePage();
}

function resizeAndRedrawAfterLayout() {
  requestAnimationFrame(resizeAndRedrawActivePage);
}

function redrawActivePage() {
  if (trainingPage.classList.contains("active") && trainingBestCar && trainingRoad) {
    drawTrainingFrame();
  }
  if (testingPage.classList.contains("active") && testingCar && testingRoad) {
    drawTestingFrame();
  }
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
      resizeAndRedrawAfterLayout();
    } else if (pageId === "testing") {
      testingPage.classList.add("active");
      testingNavBtn.classList.add("active");
      resizeCanvases();
      initTestingSimulation();
      resizeAndRedrawAfterLayout();
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
  // Population size control
  populationSizeInput.addEventListener("input", (e) => {
    const parsedValue = Number.parseInt(e.target.value, 10);
    const normalizedValue = Number.isFinite(parsedValue) ? Math.min(500, Math.max(10, parsedValue)) : 100;
    trainingPopulationSize = normalizedValue;
    e.target.value = String(normalizedValue);

    if (trainingGA && !trainingIsRunning) {
      initTrainingSimulation();
    }
  });

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
  trainingSpeedBtn.addEventListener("click", cycleTrainingSpeed);
  resetTrainingBtn.addEventListener("click", resetTraining);
  exportTrainingBtn.addEventListener("click", exportBestTrainingModel);
}

function cycleTrainingSpeed() {
  trainingSpeedIndex = (trainingSpeedIndex + 1) % trainingSpeedOptions.length;
  trainingSpeedMultiplier = trainingSpeedOptions[trainingSpeedIndex];
  trainingSpeedBtn.textContent = `⏩ Speed: ${trainingSpeedMultiplier}x`;
}

function initTrainingSimulation() {
  cancelAnimationFrame(trainingAnimId);
  trainingIsRunning = false;

  const roadId = roadSelectTraining.value;
  const roadData = roadsData.find(r => r.id === roadId) || roadsData[0];
  trainingRoad = new Road(roadData);

  trainingPopulationSize = Number.parseInt(populationSizeInput.value, 10) || 100;
  trainingGA = new GeneticAlgorithm(trainingPopulationSize, mutationRateSlider.value / 100);
  
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
  populationSizeInput.disabled = trainingIsRunning;

  drawTrainingFrame();
}

function startTraining() {
  if (trainingIsRunning) return;
  trainingIsRunning = true;
  populationSizeInput.disabled = true;
  runTrainingBtn.classList.add("hidden");
  pauseTrainingBtn.classList.remove("hidden");
  animateTraining();
}

function pauseTraining() {
  if (!trainingIsRunning) return;
  trainingIsRunning = false;
  populationSizeInput.disabled = false;
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
  for (let i = 0; i < trainingSpeedMultiplier && trainingIsRunning; i++) {
    updateTrainingSimulation();
  }

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

  if (distToFinish < 50) {
    trainingBestCar.finished = true;
    pauseTraining();
    
    // Auto-export / Switch to testing mode immediately
    alert(`Success! Car reached the finish line in generation ${trainingGA.generation}! Exporting model and switching to testing mode.`);
    
    const exportedBrain = NeuralNetwork.clone(trainingBestCar.brain);
    const brainJson = JSON.stringify(exportedBrain);
    downloadJSON(brainJson, `best_model_gen_${trainingGA.generation}.json`);

    // Preload testing brain automatically
    importedTestingBrain = exportedBrain;
    importTestingFilename.textContent = `best_model_gen_${trainingGA.generation}.json (Autoloaded)`;
    roadSelectTesting.value = roadSelectTraining.value;
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
  testingCar = new Car(testingRoad.startPoint.x, testingRoad.startPoint.y, 30, 50, "AI");
  if (importedTestingBrain) {
    testingCar.brain = NeuralNetwork.clone(importedTestingBrain);
  }

  // Setup UI defaults
  testStatSpeed.textContent = "0.0 km/h";
  testStatElapsed.textContent = "0.00s";
  testStatControls.textContent = "THR: 0% | BRK: 0% | STR: 0°";
  testStatStatus.textContent = "Standby (Ready)";
  testStatStatus.style.color = "";
  testingStartTime = 0;
  testingElapsedMs = 0;
  testingTimerFinalized = true;

  runTestingBtn.classList.remove("hidden");
  stopTestingBtn.classList.add("hidden");

  drawTestingFrame();
}

function startTesting() {
  if (testingIsRunning) return;
  if (testingCar.damaged || testingCar.finished) {
    testingCar.reset()
  }

  testingIsRunning = true;
  testingStartTime = performance.now();
  testingElapsedMs = 0;
  testingTimerFinalized = false;
  testStatElapsed.textContent = formatElapsedTime(testingElapsedMs);
  runTestingBtn.classList.add("hidden");
  stopTestingBtn.classList.remove("hidden");
  testStatStatus.textContent = "Evaluating...";
  testStatStatus.style.color = "";
  animateTesting();
}

function stopTesting() {
  if (!testingIsRunning) return;
  finalizeTestingTimer();
  testingIsRunning = false;
  runTestingBtn.classList.remove("hidden");
  stopTestingBtn.classList.add("hidden");
  cancelAnimationFrame(testingAnimId);
  if (!testingCar.finished && !testingCar.damaged) {
    testStatStatus.textContent = "Evaluation Stopped";
    testStatStatus.style.color = "";
  }
}

function animateTesting() {
  if (!testingIsRunning) return;
  updateTestingTimer();

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
    if (distToFinish < 50) {
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

function updateTestingTimer() {
  if (testingTimerFinalized) return;
  testingElapsedMs = performance.now() - testingStartTime;
  testStatElapsed.textContent = formatElapsedTime(testingElapsedMs);
}

function finalizeTestingTimer() {
  if (testingTimerFinalized) return;
  updateTestingTimer();
  testingTimerFinalized = true;
}

function formatElapsedTime(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
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
