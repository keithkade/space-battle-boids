// Since .clone() doesn't copy custom props, so this is how we extend obj class
function AugmentShip(ship){
  ship.velocity = new THREE.Vector3(0,0,0);

  // TODO rotate model so lookat makes sense
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
      
      for (let i = 0; i < 4; i++){
        this.ships[i] = ship.clone();
        AugmentShip(this.ships[i]);
      }
            
      this.target = this.ships[0];
      this.leader = this.ships[1];
      
      this.target.velocity = new THREE.Vector3(1, 0, 1);
      this.leader.velocity = new THREE.Vector3(0, 1, 0);
      this.ships[2].velocity = new THREE.Vector3(0, 0, 0);
      this.ships[3].velocity = new THREE.Vector3(0, 0, 0);

      this.target.position.copy(this.targetPos);
      this.leader.position.copy(this.squadPos);
      this.ships[2].position.copy(this.squadPos.clone());
      this.ships[2].position.x = this.ships[2].position.x - 2;
      
      this.ships[3].position.copy(this.squadPos.clone());
      this.ships[3].position.x = this.ships[3].position.x + 2;
    
      fulfill(this);
    });
  }.bind(this));
};