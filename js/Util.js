let Util = {};

Util.getRandom = function(min, max) {
  return Math.random() * (max - min) + min;
};

/************* THREE.js boilerplate *************/

let SCENE_WIDTH = window.innerWidth; 
let SCENE_HEIGHT = window.innerHeight;

let FIELD_OF_VIEW = 45;
let ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
let NEAR = 0.1;
let FAR = 10000;

let Boiler = {};

/** create the renderer and add it to the scene */
Boiler.initRenderer = function(){
  let renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x050505, 1); 
  //renderer.setClearColor(0xcbcbcb, 1); 
  renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
  document.getElementById('webgl-container').appendChild(renderer.domElement);
  return renderer;
};

/** create the camera and add it to the scene */
Boiler.initCamera = function(){    
  let camera = new THREE.PerspectiveCamera( FIELD_OF_VIEW, ASPECT, NEAR, FAR);
  scene.add(camera);        
  return camera;
};
    
/** starry background */
Boiler.initScenery = function(){
  // main light
  let light = new THREE.PointLight(0xFFFFFF, 0.8); // white light
  light.position.set(0, 500, 200);
  scene.add(light);
  
  var texture = new THREE.TextureLoader().load("assets/space.png");  
  var geometry = new THREE.SphereGeometry(2000,32,32);
  var material = new THREE.MeshBasicMaterial();
  material.side = THREE.DoubleSide;
  material.map = texture;

  var space = new THREE.Mesh(geometry, material);    
  scene.add(space);
  
  // death star
  var planetTexture = new THREE.TextureLoader().load("assets/deathStar.jpg");  
  var planetGeom = new THREE.SphereGeometry(300, 32, 32);
  var planetMaterial = new THREE.MeshPhongMaterial( {color: 0x9097ba} );
  planetMaterial.map = planetTexture;
  var planet = new THREE.Mesh( planetGeom, planetMaterial );
  planet.position.set(-300, -300, -150);
  scene.add( planet );
  
  // make planet a source of light as well
  let pointLight = new THREE.PointLight(0xfcffe6, 0.8); // white light
  pointLight.position.set(-300, -300, -150);
  scene.add(pointLight);
  
  //cruiser 
  new THREE.OBJLoader().load('assets/cruiser.obj', (cruiser) => {
    //cruiser
    cruiser.scale.set(9,9,9);
    cruiser.position.set(40,40,-50);
    cruiser.lookAt(new THREE.Vector3(60,60,50));
    
    let shipTexture = new THREE.TextureLoader().load("assets/cruiser.jpg");
    shipTexture.wrapS = THREE.RepeatWrapping;
    shipTexture.wrapT = THREE.RepeatWrapping;
    shipTexture.repeat.set( 6, 2 );    
    
    cruiser.children[0].material.map = shipTexture;
    cruiser.children[1].material.map = shipTexture;
    cruiser.children[1].material.color.r = 0.8;
    cruiser.children[1].material.color.g = 0.9;
    cruiser.children[1].material.color.b = 1;
    scene.add(cruiser);
  });
  
  var sunTexture = new THREE.TextureLoader().load("assets/sun.jpg");  
  var sunGeom = new THREE.SphereGeometry(40, 32, 32);
  var sunMaterial = new THREE.MeshBasicMaterial( {
    color: 0xffffff, 
    transparent: true,
    opacity: 0.7,
    map: sunTexture
  });
  var sun = new THREE.Mesh( sunGeom.clone(), sunMaterial.clone() );
  sun.position.set(200, 400, -1400);

  //share initialize glow materials and geometry only once
  let sunGlowMaterial = new THREE.ShaderMaterial( {
    uniforms: { 
        viewVector: { type: "v3", value: camera.position }
    },
    vertexShader:   document.getElementById( 'vertexShaderSun'   ).textContent,
    fragmentShader: document.getElementById( 'fragmentShaderSun' ).textContent,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  let sunGlowGeom = new THREE.SphereGeometry(80, 32, 32);
  let sunGlow = new THREE.Mesh( sunGlowGeom.clone(), sunGlowMaterial.clone() );
  sun.add(sunGlow);
  sun.glow = sunGlow;
  scene.add(sun);

  let sun2 = new THREE.Mesh( sunGeom.clone(), sunMaterial.clone() );
  var sun2Texture = new THREE.TextureLoader().load("assets/sun.jpg");  
  sun2.material.map = sun2Texture;
  let sunGlow2 = new THREE.Mesh( sunGlowGeom.clone(), sunGlowMaterial.clone() );
  sun2.glow = sunGlow2;
  sun2.add(sunGlow2);
  sun2.position.set(50, 300, -1000);
  scene.add(sun2);

  return [sun, sun2];
};

/** draw x, y and z axes */
Boiler.initAxes = function(){
  let length = 100;
  let axes = new THREE.Object3D();

  //lines
  axes.add(Boiler.initLine(new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0), 0xff0000)); // X 
  axes.add(Boiler.initLine(new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0), 0x00ff00)); // Y
  axes.add(Boiler.initLine(new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length), 0x0000ff)); // Z

  //labels
  axes.add(Boiler.initLabel('X','#ff0000', [25, 0, 0]));
  axes.add(Boiler.initLabel('Y','#00ff00', [0, 25, 0]));
  axes.add(Boiler.initLabel('Z','#0000ff', [0, 0, 25]));

  return axes;
};

/** Create a line that goes between the two points of the given color*/
Boiler.initLine = function(v1, v2, col){
  let material = new THREE.LineBasicMaterial({ color: col });
  let geometry = new THREE.Geometry();
  geometry.vertices.push(v1);
  geometry.vertices.push(v2);
  var line = new THREE.Line(geometry, material);
  return line;
};

Boiler.toggleAxes = function(elem){
  if (elem.checked){
    scene.add(axes);
  }
  else {
    scene.remove(axes);
  }
};

/** Creates a canvas with the given text then renders that as a sprite. Original: http://stackoverflow.com/questions/14103986/canvas-and-spritematerial */
Boiler.initLabel = function(text, color, coords){

  let canvas = document.createElement('canvas');
  let size = 300;
  canvas.width = size;
  canvas.height = size;

  let context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.fillStyle = color;
  context.font = '90px Helvetica';
  context.fillText(text, size/2, size/2);

  let amap = new THREE.Texture(canvas);
  amap.needsUpdate = true;
  amap.minFilter = THREE.LinearFilter;

  let mat = new THREE.SpriteMaterial({
    map: amap,
    color: 0xffffff     
  });

  let sprite = new THREE.Sprite(mat);
  sprite.scale.set( 10, 10, 1 ); 
  sprite.position.set(coords[0], coords[1], coords[2]);
  return sprite;  

};

Boiler.drawPoint = function(x){
  let material = new THREE.SpriteMaterial( {
    color: 0x333333
  });

  let sprite = new THREE.Sprite(material);
  sprite.scale.set( 5, 5, 1 ); 
  sprite.position.set(x.x, x.y, x.z);
  scene.add(sprite);
};
