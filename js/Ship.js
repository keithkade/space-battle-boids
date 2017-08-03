// Since .clone() doesn't copy custom props, so this is how we extend obj class
function AugmentShip(ship){
  ship.velocity = new THREE.Vector3(0,0,0);

  var geometry = new THREE.Geometry();
  ship.points = [];
  geometry.vertices = ship.points;

  var material = new THREE.LineBasicMaterial( { color : 0xce00ff } );
  material.linewidth = 20;
  ship.tail = new THREE.Line( geometry, material );  
  scene.add(ship.tail);

  ship.updateTail = function(){
    this.points.push(ship.position.clone());
    
    if (this.points.length > 200){
      this.points.shift();
    }
    
    this.tail.geometry = new THREE.Geometry();
    this.tail.geometry.vertices = this.points;  
  };
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
      AugmentShip(this.target);
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
