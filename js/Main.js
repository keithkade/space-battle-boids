/** 
 *   @author: Kade Keith
 */

// Globals
var scene;
var renderer;
var camera;
var light;
var axes;
var doc = document; //shorthand

var clock;

//variables that the user sets
var H = 0.016;          // Step time in seconds
var H_MILLI = H * 1000;        // Step time In milliseconds
var initialX = new THREE.Vector3(0,0,0);  // Position
var initialV = new THREE.Vector3(0,0,0);  // Velocity

//flocking tuning constants
var K_A = 0.5;       //collision avoidance
var K_V = 0.5;       //velocity matching
var K_C = 0.001;     //centering

var simTimeout;
var ship; 

// The overall state is a massive array. Contains positions and velocities
var overallState;
var nextState; // 

window.onload = function(){
  scene = new THREE.Scene();
  renderer = Boiler.initRenderer();
  camera = Boiler.initCamera();
  light = Boiler.initLight();
  axes = Boiler.initAxes();

  //change what the camera is looking at and add our controls
  camera.position.set(100, 100, 800);
  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  initMotion();
};

/** TODO */
function initMotion(){

  // TODO 

  Ship.init((s) => {
    ship = s;
    scene.add(s);

    let objectCount = 1;

    overallState = new Array(objectCount * 2);
    nextState = new Array(objectCount * 2);
    for (var l = 0; l < objectCount * 2; l++){
        overallState[l] = new THREE.Vector3(0,0,0);
        nextState[l] = new THREE.Vector3(0,0,0);
    }

    overallState[0] = new THREE.Vector3(1,1,0);
    overallState[1] = new THREE.Vector3(1,0,0);

    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();

    window.clearTimeout(simTimeout);
    simulate();
    render();
  });
}

// gets the derivative of a state. plus external forces
function F(state){
       
  //for all the ships apply physics
  for (var i=0; i < 1; i++){

    //next timestep's position is this timestep's velocity
    nextState[i].copy(state[i + 1]);

    var acceleration = new THREE.Vector3(0,0,0);

    // TODO calculate accelleration based on flocking behavior
    nextState[i + 1].copy(acceleration);
  }
  return nextState;
}

function addState(state1, state2){
  for (var i = 0; i < state1.length; i++){
    state1[i].add(state2[i]);
  }
}

function stateMultScalar(state, scalar){
  for (var i = 0; i < state.length; i++){
    state[i].multiplyScalar(scalar);
  }
}

/** the main simulation loop. recursive */ 
function simulate(){ 
  var timestep = H;

  //euler integration
  var deriv = F(overallState);
  stateMultScalar(deriv, H);
  addState(overallState, deriv);

  ship.position.copy(overallState[0]);

  var waitTime = H_MILLI - clock.getDelta(); 
  if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
      console.log("simulation getting behind and slowing down!");
  }
  simTimeout = setTimeout(simulate, waitTime);
}

/** rendering loop */
function render() {	
  renderer.render(scene, camera); //draw it
  requestAnimationFrame(render);  //redraw whenever the browser refreshes
}