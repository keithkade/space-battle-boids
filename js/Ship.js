// Since .clone() doesn't copy custom props, so this is how we extend obj class
function AugmentShip(ship){
  ship.velocity = new THREE.Vector3(0,0,0);

  // TODO have this geometry be updated every frame to create "tail"
  var geometry = new THREE.Geometry();
  let points = [];
  geometry.vertices = points;

  var material = new THREE.LineBasicMaterial( { color : 0xffffff } );
  var curveObject = new THREE.Line( geometry, material );  
  scene.add(curveObject);
  
}

function ShipFactory() {
  return new Promise(function (fulfill, reject) {
    new THREE.OBJLoader().load('assets/ship.obj', (ship) => { 
      fulfill(ship); 
    });
  });
}

function ShipSquad(targetPos, squadPos) {
  this.ships = [];
  this.targetPos = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
  this.squadPos = new THREE.Vector3(squadPos[0], squadPos[1], squadPos[2]);
}

ShipSquad.prototype.init = function() {  
  return new Promise(function (fulfill, reject) {
    new ShipFactory().then(ship => {
      
      for (let i = 0; i < 3; i++){
        this.ships[i] = ship.clone();
        AugmentShip(this.ships[i]);
      }
            
      this.target = ship.clone();
      this.leader = this.ships[0];
      
      this.target.velocity = new THREE.Vector3(Util.getRandom(-2,2), 0, 1);
      this.leader.velocity = new THREE.Vector3(0, 1, 0);
      this.ships[1].velocity = new THREE.Vector3(0, Util.getRandom(-2,2), 0);
      this.ships[2].velocity = new THREE.Vector3(0, Util.getRandom(-2,2), 0);

      this.target.position.copy(this.targetPos);
      this.leader.position.copy(this.squadPos);
      this.ships[1].position.copy(this.squadPos.clone());
      this.ships[1].position.setX(this.ships[1].position.x - 2);
      
      this.ships[2].position.copy(this.squadPos.clone());
      this.ships[2].position.setX(this.ships[2].position.x + 2);
    
      fulfill(this);
    });
  }.bind(this));
};
