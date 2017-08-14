// Since .clone() doesn't copy custom props, so this is how we extend obj class
function AugmentShip(ship){
  ship.velocity = new THREE.Vector3(0,0,0);

  ship.initTail = function(r,g,b){
    this.particleSystem = new ParticleSystem(r,g,b);
  };
  
  ship.updateTail = function(){
    this.particleSystem.position.copy(ship.position).sub(ship.velocity.normalize());
    this.particleSystem.generate(18);
  
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
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

  // for visual clarity. while debugging
//  var geometry = new THREE.Geometry();
//  let points = curve.getPoints(100);
//  geometry.vertices = points;
//  var material = new THREE.LineBasicMaterial( { color : 0xffffff, opacity: 0.3, transparent: true } );
//  var curveObject = new THREE.Line( geometry, material );
//  scene.add(curveObject);
}

ShipSquad.prototype.init = function() {
  //share initialize glow materials and geometry only once
  this.glowMaterial = new THREE.ShaderMaterial( {
    uniforms: { 
        viewVector: { type: "v3", value: camera.position }
    },
    vertexShader:   document.getElementById( 'vertexShaderPew'   ).textContent,
    fragmentShader: document.getElementById( 'fragmentShaderPew' ).textContent,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  this.glowGeom = new THREE.CylinderGeometry(0.2, 0.2, 2.1);
  var modifier = new THREE.SubdivisionModifier(4);
  modifier.modify(this.glowGeom); 
  
  return new Promise(function (fulfill, reject) {
    new ShipFactory().then(ship => {

      for (let i = 0; i < 3; i++){
        this.ships[i] = ship.clone();
        AugmentShip(this.ships[i]);
      }

      this.target = ship.clone();
      AugmentShip(this.target);

      //main ship color
      ship.children[0].material.color.r = 0.8;
      ship.children[0].material.color.g = 0.8;
      ship.children[0].material.color.b = 1;
      
      this.target.children[0].material = this.target.children[0].material.clone();
      
      //target color
      this.target.children[0].material.color.r = 0.6;
      this.target.children[0].material.color.g = 0.2;
      this.target.children[0].material.color.b = 0.2;
      
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

      this.target.initTail(1,0,0);
      for (let i = 0; i < 3; i++){
        this.ships[i].initTail(0,0,1);
      }
      
      fulfill(this);
    });
  }.bind(this));
};

ShipSquad.prototype.firePew = function (ship){

  let material = new THREE.LineBasicMaterial({color: 0xadffd0 });
  let direction = ship.position.clone().sub(this.target.position).normalize();
  
  let geometry = new THREE.Geometry();
  let head = direction.clone().multiplyScalar(2);
  geometry.vertices.push(
    new THREE.Vector3(0,0,0),
    head
  );

  let line = new THREE.Line( geometry, material );
  line.position.copy(ship.position);
  
  let glow = new THREE.Mesh( this.glowGeom.clone(), this.glowMaterial.clone() );
  
  // thx - http://stemkoski.blogspot.com/2013/07/shaders-in-threejs-glow-and-halo.html
    
  // align the glow with the lazer  
  glow.lookAt(direction);
  glow.rotateX(1.5708);
  glow.position.sub(head.clone().multiplyScalar(-0.5));

  line.add(glow);
  line.glow = glow;
  scene.add(line);

  line.timeRemaining = 7;
  line.velocity = direction.normalize().clone().multiplyScalar(-30);
  this.pews.add(line);
};