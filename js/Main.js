/** 
 *   @author: Kade Keith
 */

// Globals
let scene, renderer, camera, light, axes, clock;

const H = 0.016;            // Step time in seconds
const H_MILLI = H * 1000;   // Step time In milliseconds

//flocking tuning constants
const K_A = 2;       //collision avoidance
const K_V = 0.5;     //velocity matching
const K_C = 0.2;     //centering

//perterb ships occasionally for more interesting flights
const squadNoiseFactor = 100;
const leadNoiseFactor = 100;

let simTimeout;
let squads = []; 
const squadCount = 1;
const squadSize = 3;
const objectCount = squadCount * squadSize;

// The overall state is a massive array. Contains positions and velocities
let overallState, nextState;  

//TODO move to be a member of ship? 
let curve;
let loopTime = 60;

window.onload = function(){
  scene = new THREE.Scene();
  renderer = Boiler.initRenderer();
  camera = Boiler.initCamera();
  light = Boiler.initLight();
  axes = Boiler.initAxes();

  //change what the camera is looking at and add our controls
  camera.position.set(20, 20, 30);
  let controls = new THREE.OrbitControls(camera, renderer.domElement);

  // TODO move me
  curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3( 0, 0, 20 ),
    new THREE.Vector3( -150, 40, 760 ),
    new THREE.Vector3( -10, 40, -720 ),
    new THREE.Vector3( 0, 0, 20 )
  );

  var geometry = new THREE.Geometry();
  let points = curve.getPoints(50);
  geometry.vertices = points;

  var material = new THREE.LineBasicMaterial( { color : 0xffffff } );

  // Create the final object to add to the scene
  var curveObject = new THREE.Line( geometry, material );

  scene.add(curveObject);
  
  initMotion();
};

function initMotion(){
  
  let promises = [];
  for (let i = 0; i < squadCount; i++) {
    promises.push(new ShipSquad([0, i*5, 15], [0, i*5, 0]).init());
  }
  
  Promise.all(promises).then(function() {
    
    for (let i = 0; i < squadCount; i++){
      let squad = arguments[0][i];
      squads.push(squad);
      for (let j = 0; j < squadSize; j++){
        scene.add(squad.ships[j]);
      }
      scene.add(squad.target);
    }
    
    overallState = new Array(objectCount * 2);
    nextState = new Array(objectCount * 2);
      
    // initialize positions and velocities
    for (let i = 0; i < objectCount; i++){
      let squadIndex = Math.floor(i/squadSize);
      let shipIndex = i % squadSize;
      overallState[i] = squads[squadIndex].ships[shipIndex].position.clone();
      overallState[i + objectCount] = squads[squadIndex].ships[shipIndex].velocity.clone();
      nextState[i] = overallState[i].clone();
      nextState[i + objectCount] = overallState[i + objectCount].clone();
    }
    
    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();

    window.clearTimeout(simTimeout);
    simulate();
    render();
  }, function(err) {});  
}

function addState(state1, state2){
  for (let i = 0; i < state1.length; i++){
    state1[i].add(state2[i]);
  }
}

function stateMultScalar(state, scalar){
  for (let i = 0; i < state.length; i++){
    state[i].multiplyScalar(scalar);
  }
}

let iter = 0;
let zoomCount = 0;
// gets the derivative of a state. plus external forces
function F(state){
  
  iter++;
  
  //for all the ships apply physics
  for (let i=0; i < objectCount; i++){
        
    let squadIndex = Math.floor(i/squadSize);
    let shipIndex = i % squadSize;

    //derivatives position is this timestep's velocity
    nextState[i].copy(state[i + objectCount]);
    
    let acceleration = new THREE.Vector3(0,0,0);

    // flocking doesn't apply to leaders
    if (shipIndex === 0){
      continue; 
    }
    
    for (let k = 0; k < squadSize; k++){
      
      if (k === shipIndex){
        continue;
      }
      
      let j = squadIndex + k;
          
      let dist = state[i].distanceTo(state[j]);
      
      //collision avoidance         
      let avoidance = state[j].clone().sub(state[i]).normalize().multiplyScalar(-1 * K_A / dist);
      acceleration.add(avoidance);
      
      //Velocity matching
      let velocityMatch = state[j + objectCount].clone().sub(state[i + objectCount]).multiplyScalar(K_V);
      acceleration.add(velocityMatch);
      
      //centering
      acceleration.add(state[j].clone().sub(state[i]).multiplyScalar(K_C));
    }
    
    // introduce noise to keep things interesting        
    if (iter % 400 === 0){
      if ((shipIndex + zoomCount) % 2 === 0){
        zoomCount++;
        iter++;
        acceleration.add(
          new THREE.Vector3(
            Util.getRandom(-squadNoiseFactor,squadNoiseFactor), 
            Util.getRandom(-squadNoiseFactor,squadNoiseFactor), 
            Util.getRandom(-squadNoiseFactor,squadNoiseFactor)
          )
        );
      }
    }
   
    
    nextState[i + objectCount].copy(acceleration);
  }
  return nextState;
}

/** the main simulation loop. recursive */ 
function simulate(){ 
  let timestep = H;

  //euler integration
  let deriv = F(overallState);
  stateMultScalar(deriv, H);
  addState(overallState, deriv);

  for (let i=0; i < squadCount; i++){
      let target = squads[i].target;
      let curTime = clock.getElapsedTime();
      let frac = (curTime % loopTime) / loopTime;
      let point= curve.getPointAt(frac);
      target.lookAt(point);
      target.velocity = point.clone().sub(target.position).divideScalar(H);
      target.position.copy(point);
  }
  
  for (let i=0; i < objectCount; i++){
        
    let squadIndex = Math.floor(i/squadSize);
    let shipIndex = i % squadSize;

    let target = squads[squadIndex].target;
    let leader = squads[squadIndex].leader;

    if (shipIndex === 0){ // manually match leader's velocity with target
      
      let vel = target.position.clone().sub(leader.position).clone().normalize();
      let magnitude = target.velocity.length(); 
      
      vel.multiplyScalar(magnitude);
      
      // Don't let the leader actually catch up to the target
      /* */
      let distance = target.position.distanceTo(leader.position);
      if (distance < 20){
        vel.multiplyScalar(0.5);
        if (distance < 10) {
          vel.multiplyScalar(0.5);
        }
      }
      // maybe add noise
    
      overallState[i + objectCount].copy(vel);      
    }
    
    // update leader and squad based on state
    squads[squadIndex].ships[shipIndex].lookAt(target.position);
    squads[squadIndex].ships[shipIndex].position.copy(overallState[i]);
    squads[squadIndex].ships[shipIndex].velocity.copy(overallState[i + objectCount]);
  }

  
  let waitTime = H_MILLI - clock.getDelta(); 
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