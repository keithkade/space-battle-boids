const Ship = {};

Ship.init = (onload) => {

  var loader = new THREE.OBJLoader();

  // load a resource
  loader.load(
    // resource URL
    'assets/Arwing_001.obj',
    // Function when resource is loaded
    function ( object ) {
      onload(object);
    }
  );
};