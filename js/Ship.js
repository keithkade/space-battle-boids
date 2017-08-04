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

function ShipSquad(targetPos, squadPos, curve, loopTime) {
  this.ships = [];
  this.targetPos = targetPos;
  this.squadPos = squadPos;
    
  this.curve = curve;
  this.loopTime = loopTime;
  
  this.pews = new Set();
  
  // for visual clarity. remove later
  var geometry = new THREE.Geometry();
  let points = curve.getPoints(100);
  geometry.vertices = points;
  var material = new THREE.LineBasicMaterial( { color : 0xffffff, opacity: 0.3, transparent: true } );
  var curveObject = new THREE.Line( geometry, material );
  scene.add(curveObject);
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

ShipSquad.prototype.firePew = function (ship){
  var material = new THREE.LineBasicMaterial({
	color: 0xfff733
  });

  var direction = ship.position.clone().sub(this.target.position);
  
  var geometry = new THREE.Geometry();
  
  geometry.vertices.push(
      ship.position,
      ship.position.clone().add(direction.normalize().multiplyScalar(2))
  );

  var line = new THREE.Line( geometry, material );
  scene.add( line );
  
  line.timeRemaining = 5;
  line.velocity = direction.normalize().clone().multiplyScalar(-20);
    
  this.pews.add(line);
};
