// Since .clone() doesn't copy custom props, so this is how we extend obj class
function AugmentShip(ship){
  ship.velocity = new THREE.Vector3(0,0,0);

  ship.initTail = function(){
    var geometry = new THREE.Geometry();
    let vertexArray = [];
    for (let i = 0; i < 200; i ++){
      vertexArray.push(ship.position.clone());
    }
    geometry.vertices = vertexArray;

    var material = new THREE.LineBasicMaterial( { color : 0xce00ff } );
    material.linewidth = 3; //doesn't work on most recent chrome
    ship.tail = new THREE.Line( geometry, material );
    scene.add(ship.tail);
  };
  
  ship.updateTail = function(){
    for (let i = 199; i > 0; i--){
      this.tail.geometry.vertices[i].copy(this.tail.geometry.vertices[i-1]);
    }
    this.tail.geometry.vertices[0].copy(ship.position);
    this.tail.geometry.verticesNeedUpdate = true;
    this.tail.geometry.computeBoundingSphere();
  };
}

function ShipFactory() {
  return new Promise(function (fulfill, reject) {
    new THREE.OBJLoader().load('assets/ship.obj', (ship) => {
      fulfill(ship);
    });
  });
}

function ShipSquad(squadPos, curve, loopTime) {
  this.ships = [];
  this.targetPos = squadPos.clone();
  this.squadPos = squadPos.clone();

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

      this.target.initTail();
      for (let i = 0; i < 3; i++){
        this.ships[i].initTail();
      }
      
      fulfill(this);
    });
  }.bind(this));
};

ShipSquad.prototype.firePew = function (ship){

  let canvas = document.createElement('canvas');
  let size = 300;
  canvas.width = size;
  canvas.height = size;
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  var uniforms = {
    texture1: { type: "t", value: new THREE.CanvasTexture(canvas) }
  };
  
  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById('vertexshader').text,
    fragmentShader: document.getElementById('fragmentshader').text
  });

  var direction = ship.position.clone().sub(this.target.position);

  var geometry = new THREE.Geometry();

  geometry.vertices.push(
    ship.position,
    ship.position.clone().add(direction.normalize().multiplyScalar(30))
  );

  var vertices = geometry.vertices;
  var buffergeometry = new THREE.BufferGeometry();
  var position = new THREE.Float32BufferAttribute( vertices.length * 3, 3 ).copyVector3sArray( vertices );
  buffergeometry.addAttribute( 'position', position );
  var a_texcoord = new THREE.Float32BufferAttribute(vertices.length * 2, 2).copyVector2sArray(
    [ new THREE.Vector2(0.0, 0.0), new THREE.Vector2(1.0, 1.0) ]  
  );
  buffergeometry.addAttribute( 'a_texcoord', a_texcoord );
 
  var line = new THREE.Line( buffergeometry, material );
  scene.add( line );

  line.timeRemaining = 5;
  line.velocity = direction.normalize().clone().multiplyScalar(0);

  this.pews.add(line);
};
