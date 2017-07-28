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

const ShipSquad = {};

ShipSquad.init = (onload) => {

  this.ships = [];
  
  Ship.init(ship => {
    this.ships[0] = ship;
    this.ships[1] = ship.clone();
    this.ships[2] = ship.clone();
    onload(this);
  });

};