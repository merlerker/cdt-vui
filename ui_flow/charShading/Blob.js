//Node Spring Method

'use strict';

var Blob = function(p) {
  // an array for the nodes
  this.nodes = [];
  this.keyNodes = [];
  this.keyCurr = [];

  // an array for the springs
  this.springs = [];

  //KeyFrameArray
  this.keyFrames = [];
  this.switched = false;
  this.prevTarget = 0;

  //node Properties
  this.nSpokes = 20;
  this.nNodes = 10;
  this.maxRadius = 80;

  //Graphics
  this.c1 = color('#84B8FD');

  // dragged node
  this.selectedNodes = [];
  this.selectedNode = null;
  this.nodeDiameter = 16;
  //let anchors = [];

  //Gifs
  this.listToEnco = [];
  this.cX = 0;
  this.cY = 0;
  this.nW = 1000;
  this.nH = 0;

  this.nFrames;

  //Time
  this.time = 0;
  this.fps = 10;
  this.frames = 0;

  this.key;

  this.setup = function() {

    //Canvas + Graphics Setup
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(255);
    p.noStroke();

    //Setup Meshes
    this.initNodesAndSprings();
  };

  this.draw = function() {

    p.background(255);

    //Draw Functions
    this.updateMesh();
    this.drawMesh();
  }

  this.updateMesh = function() {

    this.applyFrames();

    for (let i = 0; i < keyCurr.length; i += 2) {
      this.keyCurr[i][1].update();
      this.keyCurr[i+1][1].update();

      let uX = keyCurr[i][1].get();
      let uY = keyCurr[i+1][1].get();

      this.nodes[keyCurr[i][0]].track(uX,uY);
    }

    // let all nodes repel each other
    for (var i = 0; i < nodes.length; i++) {
      this.nodes[i].attractNodes(nodes);
    }
    // apply spring forces
    for (var i = 0; i < springs.length; i++) {
      this.springs[i].update();
    }

    // apply velocity vector and update position
    for (var i = 0; i < nodes.length; i++) {
        this.nodes[i].update();
    }
  }

  this.inputKeyFrames = function(kfs, nF) {
    this.keyFrames = kfs;
    this.nFrames = nF;
  }

  this.applyFrames = function() {

    let frame = frames % nFrames + 1;

    this.nextKeyFrames(frame);
  }

  this.nextKeyFrames = function(frame) {

    if (prevTarget != frame) {
      this.switched = false;
      this.prevTarget = frame;
    }

    for (var i = 0; i < keyFrames.length; i++) {
      if (switched == false) {
        if (keyFrames[i][0] == frame) {

          //Clear between frames
          this.key = [];
          this.keyNodes = [];
          this.keyCurr = [];

          //Fill between Keyframes
          let next = i + 1;
          if (next >= keyFrames.length) {
            next = 0;
          }

          for (let j = 1; j < keyFrames[next].length; j++) {
            key.push(keyFrames[next][j]);
          }

          let c = 0;
          for (let k of key) {

            let nNum = k[0] * nNodes + k[1];

            //Keynodes
            let sfXP = new SoftFloat(k[2]);
            let sfYP = new SoftFloat(k[3]);

            let nX, nY = nodes[nNum].getPos();

            let sfX = new SoftFloat(nX);
            let sfY = new SoftFloat(nY);

            //Targets
            sfX.setTarget(sfXP.get());
            sfY.setTarget(sfYP.get());

            //currKeys
            keyCurr.push([nNum, sfX]);
            keyCurr.push([nNum, sfY]);

            keyNodes.push([nNum, sfXP]);
            keyNodes.push([nNum, sfYP]);
            c += 2;
          }

          switched = true;
          return;
        }
      }
    }
  }

  this.drawMesh = function() {
    //Draw Outline
    p.fill(c1);
    p.smooth();
    p.beginShape();
    for (let i = 10; i < nodes.length; i += nNodes) {
      p.curveVertex(nodes[i].x, nodes[i].y);
    }
    p.endShape(p.CLOSE);
  }

  this.initNodesAndSprings = function() {

    let spokes = [];

    let cx = p.windowWidth / 2;
    let cy = p.windowHeight / 2;

    let theta = p.TWO_PI / nSpokes;
    let rad = 0;

    for (let i = 0; i < nSpokes; i++) {
      let spoke = []
      for (let j = 0; j < nNodes; j++) {
        rad = (j + 1) / nNodes * maxRadius;
        let x = rad * p.cos(i * theta) + cx;
        let y = -rad * p.sin(i * theta) + cy;
        let n = new Node(x, y);
        spoke[j] = n;
      }
      spokes[i] = spoke;
    }

    let cn = new Node(cx, cy);
    nodes.push(cn);

    for (let i = 0; i < spokes.length; i++) {
      for (let j = 0; j < spokes[i].length; j++) {

        let rLen = maxRadius / (nNodes);

        if (j == 0) {
          var newSpring = new Spring(spokes[i][j], cn);
          newSpring.length = rLen;
          newSpring.stiffness = 0.5;
          springs.push(newSpring);
        }
        for (let h = 0; h < 2; h++) {
          for (let v = 0; v < 2; v++) {
            let sI = i + h;
            let nI = j + v;

            let sLength = 0;
            let sStiffness = 0;

            if (i + h >= spokes.length) {
              sI = 0;
            }
            if (j + v >= spokes[i].length) {
              continue;
            }
            if (h == v) {
              continue;
            }

            if (h == 0) {
              sLength = rLen;
              sStiffness = 0.5;
            } else {
              sLength = 2 * p.tan(theta / 2) * rLen * (j + 1);
              sStiffness = 0.5;
            }

            var newSpring = new Spring(spokes[i][j], spokes[sI][nI]);
            newSpring.length = sLength;
            newSpring.stiffness = sStiffness;
            springs.push(newSpring);
          }
        }
      }
    }

    for (let s of spokes) {
      for (let n of s) {
        nodes.push(n);
      }
    }
  }
}
