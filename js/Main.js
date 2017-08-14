/**
 *   @author: Kade Keith
 */

// Globals
let scene, renderer, camera, suns, axes, clock;

const H = 0.016;            // Step time in seconds
const H_MILLI = H * 1000;   // Step time In milliseconds

//flocking tuning constants
const K_A = 2;       //collision avoidance
const K_V = 0.5;     //velocity matching
const K_C = 0.2;     //centering

//perterb ships occasionally for more interesting flights
const squadNoiseFactor = 150;
const leadNoiseFactor = 100;

let simTimeout;
let squads = [];
const SQ_COUNT = 4;
const SQ_SIZE = 3;
const OBJECT_COUNT = SQ_COUNT * SQ_SIZE;

// The overall state is a massive array. Contains positions and velocities
let overallState, nextState;

window.onload = function(){
  scene = new THREE.Scene();
  renderer = Boiler.initRenderer();
  camera = Boiler.initCamera();
  axes = Boiler.initAxes();
  suns = Boiler.initScenery();
  
  //change what the camera is looking at and add our controls
  camera.position.set(-10, 10, 70);
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  initMotion();
  camera.lookAt(new THREE.Vector3(-10, 5, 0));
};

function initMotion(){
  clock = new THREE.Clock();
  clock.start();
  clock.getDelta();
  
  // Generate all of the squads
  let promises = [];
  for (let i = 0; i < SQ_COUNT; i++) {
    promises.push(new ShipSquad(LEADERS[i], CURVES[i], LOOPTIMES[i]).init());
  }

  Promise.all(promises).then(function() {

    for (let i = 0; i < SQ_COUNT; i++){
      let squad = arguments[0][i];
      squads.push(squad);
      for (let j = 0; j < SQ_SIZE; j++){
        scene.add(squad.ships[j]);
      }
      scene.add(squad.target);
    }

    overallState = new Array(OBJECT_COUNT * 2);
    nextState = new Array(OBJECT_COUNT * 2);

    // initialize positions and velocities
    for (let i = 0; i < OBJECT_COUNT; i++){
      let squadIndex = Math.floor(i/SQ_SIZE);
      let shipIndex = i % SQ_SIZE;
      overallState[i] = squads[squadIndex].ships[shipIndex].position.clone();
      overallState[i + OBJECT_COUNT] = squads[squadIndex].ships[shipIndex].velocity.clone();
      nextState[i] = overallState[i].clone();
      nextState[i + OBJECT_COUNT] = overallState[i + OBJECT_COUNT].clone();
    }

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
let acceleration = new THREE.Vector3(0,0,0);

// gets the derivative of a state. plus external forces
function F(state){

  iter++;

  //for all the ships apply physics
  for (let i=0; i < OBJECT_COUNT; i++){

    let squadIndex = Math.floor(i/SQ_SIZE);
    let shipIndex = i % SQ_SIZE;

    //derivatives position is this timestep's velocity
    nextState[i].copy(state[i + OBJECT_COUNT]);

    acceleration.set(0,0,0);

    // flocking doesn't apply to leaders
    if (shipIndex === 0){
      continue;
    }

    for (let k = 0; k < SQ_SIZE; k++){

      if (k === shipIndex){
        continue;
      }

      let j = squadIndex * SQ_SIZE + k;

      let dist = state[i].distanceTo(state[j]);

      //collision avoidance
      let avoidance = state[j].clone().sub(state[i]).normalize().multiplyScalar(-1 * K_A / dist);
      acceleration.add(avoidance);

      //Velocity matching
      let velocityMatch = state[j + OBJECT_COUNT].clone().sub(state[i + OBJECT_COUNT]).multiplyScalar(K_V);
      acceleration.add(velocityMatch);

      //centering
      acceleration.add(state[j].clone().sub(state[i]).multiplyScalar(K_C));
    }

    // introduce noise to keep things interesting
    if (iter % 200 === 0){
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


    nextState[i + OBJECT_COUNT].copy(acceleration);
  }
  return nextState;
}

let point = new THREE.Vector3(0,0,0);
/** the main simulation loop. recursive */
function simulate(){
  let timestep = H;

  for (let i = 0; i < suns.length; i++){
    suns[i].glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, suns[i].glow.getWorldPosition());
  }

  //euler integration
  let deriv = F(overallState);
  stateMultScalar(deriv, H);
  addState(overallState, deriv);

  for (let i=0; i < SQ_COUNT; i++){
      let target = squads[i].target;
      let curTime = clock.getElapsedTime();
      let frac = (curTime % squads[i].loopTime) / squads[i].loopTime;
      point.copy(squads[i].curve.getPointAt(frac));
      target.lookAt(point);
      target.updateTail();
      target.velocity.copy(point).sub(target.position).divideScalar(H);
      target.position.copy(point);

      for (let pew of squads[i].pews){
        pew.position.add(pew.velocity.clone().multiplyScalar(H));
        pew.glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, pew.glow.getWorldPosition() );
        pew.timeRemaining -= H;

        if (pew.timeRemaining < 0){
          scene.remove(pew);
          pew.geometry.dispose();
          pew.glow.geometry.dispose();
          pew.material.dispose();
          pew.glow.material.dispose();
          squads[i].pews.delete(pew);
        }
      }
  }

  for (let i=0; i < OBJECT_COUNT; i++){

    let squadIndex = Math.floor(i/SQ_SIZE);
    let shipIndex = i % SQ_SIZE;
    let ship = squads[squadIndex].ships[shipIndex];

    let target = squads[squadIndex].target;
    let leader = squads[squadIndex].leader;

    if (shipIndex === 0){ // manually match leader's velocity with target

      let vel = target.position.clone().sub(leader.position).clone().normalize();
      let magnitude = target.velocity.length();

      vel.multiplyScalar(magnitude);

      // Don't let the leader actually catch up to the target
      let distance = target.position.distanceTo(leader.position);
      if (distance < 20){
        vel.multiplyScalar(0.5);
        if (distance < 10) {
          vel.multiplyScalar(0.5);
        }
      }
      // maybe add noise
      overallState[i + OBJECT_COUNT].copy(vel);
    }

    ship.updateTail();

    if (Util.getRandom(0,300) > 298){
      squads[squadIndex].firePew(ship);
    }

    // update leader and squad based on state
    ship.lookAt(target.position);
    ship.position.copy(overallState[i]);
    ship.velocity.copy(overallState[i + OBJECT_COUNT]);
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
