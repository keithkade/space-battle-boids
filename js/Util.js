let Util = {};

Util.getRandom = function(min, max) {
  return Math.random() * (max - min) + min;
};

/************* THREE.js boilerplate *************/

let panelWidth = 300;
if (window.innerWidth < 700){ //so it can look ok on mobile
    panelWidth = 0;
}
let SCENE_WIDTH = window.innerWidth - panelWidth; //430 is width of options panel
let SCENE_HEIGHT = window.innerHeight - 5; //Three js makes the canvas a few pixels too big so the minus five fixes that 

let FIELD_OF_VIEW = 45;
let ASPECT = SCENE_WIDTH / SCENE_HEIGHT;
let NEAR = 0.1;
let FAR = 10000;

let Boiler = {};

/** create the renderer and add it to the scene */
Boiler.initRenderer = function(){
  let renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0x1c1c1c, 1); 
  renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
  renderer.sortObjects = false; //helps. doesn't fix transparency issues fully though
  document.getElementById('webgl-container').appendChild(renderer.domElement);
  return renderer;
};

/** create the camera and add it to the scene */
Boiler.initCamera = function(){    
  let camera = new THREE.PerspectiveCamera( FIELD_OF_VIEW, ASPECT, NEAR, FAR);
  scene.add(camera);        
  return camera;
};
    
/** create the point light and add it to the scene */
Boiler.initLight = function(){
  let pointLight = new THREE.PointLight(0xFFFFFF); // white light
  pointLight.position.set (10, 10, 300);

  scene.add(pointLight);
  return pointLight;
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

  scene.add(axes);
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
