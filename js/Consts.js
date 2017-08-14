const STARTS = [
  new THREE.Vector3( 0, 0, 20 ),
  new THREE.Vector3( 40, 10, 40 ),
  new THREE.Vector3( -100, -40, -40 ),
];

const CURVES = [
  new THREE.CurvePath(), 
  new THREE.CurvePath(),
  new THREE.CurvePath(),
];

const LOOPTIMES = [
  40, 
  60,
  100,
];

const POINTS = [
  [STARTS[0],
   new THREE.Vector3( -20, 40, 60 ),
   new THREE.Vector3( -20, 40, -20 ),
   STARTS[0]],
  [STARTS[1],
   new THREE.Vector3( -40, 70, 0 ),
   new THREE.Vector3( 100, 70, 0 ),
   STARTS[1]],
  [STARTS[2],
   new THREE.Vector3( -380, -50, -400 ),
   new THREE.Vector3( -420, -20, -80 ),
   STARTS[2]]
];

//////////////////////////////////////////////// Loop 1
CURVES[0].add(new THREE.QuadraticBezierCurve3(
	POINTS[0][0],
    new THREE.Vector3( -5, 0, 80 ),
	POINTS[0][1]
));

CURVES[0].add(new THREE.QuadraticBezierCurve3(
	POINTS[0][1],
    new THREE.Vector3( -40, 120, 20 ),
	POINTS[0][2]
));

CURVES[0].add(new THREE.QuadraticBezierCurve3(
	POINTS[0][2],
    new THREE.Vector3( -5, 0, -40 ),
	POINTS[0][3]
));

//////////////////////////////////////////////// Loop 2
CURVES[1].add(new THREE.QuadraticBezierCurve3(
	POINTS[1][0],
	new THREE.Vector3( -80, 10, 30 ),
	POINTS[1][1]
));

CURVES[1].add(new THREE.QuadraticBezierCurve3(
	POINTS[1][1],
	new THREE.Vector3( 40, 200, -40 ),
	POINTS[1][2]
));

CURVES[1].add(new THREE.QuadraticBezierCurve3(
	POINTS[1][2],
	new THREE.Vector3( 120, 10, 30 ),
	POINTS[1][3]
));

//////////////////////////////////////////////// Loop 3
CURVES[2].add(new THREE.QuadraticBezierCurve3(
	POINTS[2][0],
	new THREE.Vector3( -80, -70, -480 ),
	POINTS[2][1]
));

CURVES[2].add(new THREE.QuadraticBezierCurve3(
	POINTS[2][1],
	new THREE.Vector3( -580, -30, -280 ),
	POINTS[2][2]
));

CURVES[2].add(new THREE.QuadraticBezierCurve3(
	POINTS[2][2],
	new THREE.Vector3( -120, -10, 230 ),
	POINTS[2][3]
));

const LEADERS = [
  STARTS[0],
  STARTS[1],
  STARTS[2],
];