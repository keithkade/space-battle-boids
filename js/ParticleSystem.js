function ParticleSystem(r,g,b){
  this.particleLifespan = 10;
  this.index = 0;
  this.max = 2000;
  this.particlesAttr = new Array(this.max);
  this.position = new THREE.Vector3();  
  this.clock = clock;

  this.vertices = new Float32Array(this.max * 3);
  this.colors = new Float32Array(this.max * 4);

  for (let i = 0; i < this.max; i++) {
    this.vertices[i * 3 + 0] = 0;
    this.vertices[i * 3 + 1] = 0;
    this.vertices[i * 3 + 2] = 0;
    this.colors[i * 4 + 0] = r;
    this.colors[i * 4 + 1] = g;
    this.colors[i * 4 + 2] = b;
    this.colors[i * 4 + 3] = 1;
    this.particlesAttr[i] = {};
  }

  let pMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vertexShaderParticle').text,
    fragmentShader: document.getElementById('fragmentShaderParticle').text,
    transparent: true
  });

  this.geometry = new THREE.BufferGeometry();
  this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
  this.geometry.addAttribute('color', new THREE.BufferAttribute(this.colors, 4));
  this.geometry.attributes.position.needsUpdate = true;
  this.geometry.attributes.color.needsUpdate = true;
  
  // .frustrumCulled = false doesn't seem to work, so set bounding sphere to be max possible
  this.geometry.computeBoundingSphere();
  this.geometry.boundingSphere.radius = Number.MAX_VALUE;
  
  this.gaussian = gaussian(0, 0.008);

  this.particleSystem = new THREE.Points(this.geometry, pMaterial);
  scene.add(this.particleSystem);  
}

/** turn on the next 'count' particles in our array based on the current index */ 
ParticleSystem.prototype.generate = function(count){    
  for (let i=0; i < count; i++){
    this.index++;
    if (this.index >= this.max) {
      this.index = 0;
    }
    this.setParticle(this.index, this.position);
  }
};


// move outside func to save time garbage collecting
let particlePos = new THREE.Vector3();

/** move the particle at the given index to the new position */
ParticleSystem.prototype.setParticle = function(index, pos){  
  particlePos.set(
    pos.x + this.gaussian.ppf(Math.random()), 
    pos.y + this.gaussian.ppf(Math.random()),
    pos.z + this.gaussian.ppf(Math.random())
  );
  this.vertices[index * 3 + 0] = particlePos.x;
  this.vertices[index * 3 + 1] = particlePos.y;
  this.vertices[index * 3 + 2] = particlePos.z;

  // max distance from center ~ 0.8660254037844386
  let distanceFromCenter = pos.distanceTo(particlePos);
  let distanceFactor = distanceFromCenter / 1;
  //make center pixels whiter
  let newColor = 0.7 - distanceFactor;
  this.colors[index * 4 + 0] = Math.max(newColor, this.colors[index * 4 + 0]);
  this.colors[index * 4 + 1] = Math.max(newColor, this.colors[index * 4 + 1]);
  this.colors[index * 4 + 2] = Math.max(newColor, this.colors[index * 4 + 2]);
  
  // alpha
  this.colors[index * 4 + 3] = 1 - distanceFactor;  
};
