//Soft Body Experiment

//Softbody Properties
let nSpokes = 10;
let nNodes = 10;
let maxRadius = 500;
let nMass = 10;
let springFce = 1;

//Soft Body
let spokes = [];
let center = [];

//Graphics
var c;

//Time rec
let thisTime = 0;
let lastTime = 0;
let time = 0;

function setup() {

  //Graphics
  createCanvas(windowWidth, windowHeight);

  //Time
  var now = new Date();
  lastTime = now.getTime();

  //Body setup
  initBody();
}

function draw() {
  background(255);

  //Time
  var now = new Date();
  thisTime = now.getTime();
  time = thisTime - lastTime;

  sumForces();

  //Draw Body
  push();
  translate(windowWidth/2, windowHeight/2);
  drawBody();
  pop();

  lastTime = thisTime;
}

function initBody() {
  let theta = (TWO_PI)/nSpokes;
  let rad = 0;

  for (let i=0; i<nSpokes; i++) {
    let spoke = [];
    for (let j=0; j<nNodes; j++) {
      rad = j/nNodes*maxRadius;
      let x = rad*cos(i*theta);
      let y = -rad*sin(i*theta);
      let n = new Node(x,y);
      spoke[j] = n;
    }
    spokes[i] = spoke;
  }
}

function drawBody() {
  c = color(0, 126, 255, 102);
  noStroke();
  fill(c);

  beginShape();
  for (let i=0; i<nSpokes; i++) {
    s = spokes[i][nNodes-1];
    p = s.getPos();
    vertex(p[0],p[1]);
  }
  endShape(CLOSE);

  /*
  for (let i=0; i<spokes.length; i++) {
    let s = spokes[i];
    for (let j=0; j<spokes[0].length; j++) {
      let n = s[j];
      console.log(n);
      n.displayNode();
    }
  }
  */
}

function sumForces() {
  for (let i=0; i<spokes.length; i++) {
    for (let j=0; j<spokes[0].length; j++) {
      let f = calcForce(spokes[i][j]);
      if (i+1>spokes.length) {

      }
      if (i-1>0) {

      }
      if (j+1>spokes[i].length) {

      }
      if (j-1>0) {

      }
    }
  }
}

function calcForceN(n1, n2, r) {
  let x = n1.getPos()[0];
  let y = n1.getPos()[1];

  let xP = n2.getPos()[0];
  let yP = n2.getPos()[1];

  let dist = sqrt(sq(yP-y)+sq(xP-x));
  let idealTheta = TWO_PI/nNodes;
  let idealDist = 2 * r * sin(idealTheta/2);

  let force = ((dist-idealDist)/idealDist) * springFce;
  let theta =
}

function calcForceF(n1, n2, r) {
  let x = n1.getPos()[0];
  let y = n1.getPos()[1];

  let xP = n2.getPos()[0];
  let yP = n2.getPos()[1];

  let dist = sqrt(sq(yP-y)+sq(xP-x));
  let idealTheta = TWO_PI/nNodes;
  let idealDist = 2 * r * sin(idealTheta/2);

  let force = ((dist-idealDist)/idealDist) * springFce;
  let theta =
}

class Node {

  constructor(x,y) {
    this.pos = [x,y];
    this.vel = [0,0];
    this.acc = [0,0];
    this.fce = [0,0];
    this.nFce = [0,0];
  }
}

Node.prototype.updateNode = function() {
  this.updateFce();
  this.updateAcc();
  this.updateVel();
  this.updatePos();
}

Node.prototype.updatePos = function() {
  this.pos[0] += this.vel[0] * time;
  this.pos[1] += this.vel[1] * time;
}

Node.prototype.updateVel = function() {
  this.vel[0] += this.acc[0] * time;
  this.vel[1] += this.acc[1] * time;
}

Node.prototype.updateAcc = function() {
  this.acc[0] += this.fce[0]/nMass;
  this.acc[1] += this.fce[1]/nMass;
}

Node.prototype.updateFce = function() {
  this.fce[0] += this.nFce[0];
  this.fce[1] += this.nFce[1];
}

Node.prototype.addFce = function() {
  this.nFce[0] += fx;
  this.nFce[1] += fy;
}

Node.prototype.displayNode = function(){
  fill(0);
  circle(this.pos[0], this.pos[1], 15);
}

Node.prototype.getPos = function() {
  return this.pos;
}
