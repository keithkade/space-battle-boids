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
var squads = []; 
const squadCount = 3;
const squadSize = 4;

// The overall state is a massive array. Contains positions and velocities
var overallState;
var nextState;  
let objectCount = squadCount * squadSize;

window.onload = function(){
  scene = new THREE.Scene();
  renderer = Boiler.initRenderer();
  camera = Boiler.initCamera();
  light = Boiler.initLight();
  axes = Boiler.initAxes();

  //change what the camera is looking at and add our controls
  camera.position.set(20, 20, 30);
  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  initMotion();
};

/** TODO */
function initMotion(){
  
  var promises = [];
  for (let i = 0; i < squadCount; i++) {
    promises.push(new ShipSquad([0, i*5, 7], [0, i*5, 0]).init());
  }
  
  Promise.all(promises).then(function() {
    
    for (let i = 0; i < squadCount; i++){
      let squad = arguments[0][i];
      squads.push(squad);
      scene.add(squad.ships[0]);
      scene.add(squad.ships[1]);
      scene.add(squad.ships[2]);
      scene.add(squad.ships[3]);
    }
    
    overallState = new Array(objectCount * 2);
    nextState = new Array(objectCount * 2);
   
    for (let i = 0; i < objectCount * 2; i++){
      overallState[i] = new THREE.Vector3(0,0,0);
      nextState[i] = new THREE.Vector3(0,0,0);
    }
    
    // initialize positions and velocities
    for (let i = 0; i < objectCount; i++){
      let squadIndex = Math.floor(i/squadSize);
      let shipIndex = i % squadSize;
      overallState[i].copy(squads[squadIndex].ships[shipIndex].position);
      overallState[i + objectCount].copy(squads[squadIndex].ships[shipIndex].velocity);
    }
    
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();

    window.clearTimeout(simTimeout);
    simulate();
    render();
  }, function(err) {});  
}

// gets the derivative of a state. plus external forces
function F(state){
       
  //for all the ships apply physics
  for (var i=0; i < objectCount; i++){

    let squadIndex = Math.floor(i/squadSize);
    let shipIndex = i % squadSize;
    
    //LEADER - follows target
    if (shipIndex == 1){
      let leader = squads[squadIndex].leader;
      let target = squads[squadIndex].target;
      let direction = target.position.clone().sub(leader.position).clone().normalize();
      let magnitude = state[i + objectCount].length();
      
      leader.lookAt(target.position);
      state[i + objectCount].copy(direction.multiplyScalar(magnitude));      
    }
    
    //next timestep's position is this timestep's velocity
    nextState[i].copy(state[i + objectCount]);

    var acceleration = new THREE.Vector3(0,0,0);

    // TODO calculate accelleration based on flocking behavior
    nextState[i + objectCount].copy(acceleration);
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

  for (let i = 0; i < squadCount; i++) {
    for (let j = 0; j < squadSize; j++) {
      squads[i].ships[j].position.copy(overallState[squadSize * i + j]);
    }
  }
  
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