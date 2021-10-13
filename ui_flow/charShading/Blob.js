//Node Spring Method

'use strict';

class Blob {

  constructor(kfs, nF, x, y, c) {
    //Graphics
    this.cArr = [color('#84B8FD'), color('#FFC907')]

    this.keyFrames = kfs;
    this.nFrames = nF;
    this.cX = x;
    this.cY = y;
    if (c == 1) {
      this.cX += 10;
      this.cY += 10;
    }
    this.bColor = this.cArr[c];

    // an array for the nodes
    this.nodes = [];
    this.keyNodes = [];
    this.keyCurr = [];

    // an array for the springs
    this.springs = [];

    //KeyFrameArray
    //this.keyFrames = [];
    this.switched = false;
    this.prevTarget = 0;

    //node Properties
    this.nSpokes = 30;
    this.nNodes = 10;
    this.maxRadius = 40;

    // dragged node
    this.selectedNodes = [];
    this.selectedNode = null;
    this.nodeDiameter = 16;
    //let anchors = [];

    //Gifs
    this.listToEnco = [];
    //this.cX = 0;
    //this.cY = 0;
    this.nW = 1000;
    this.nH = 0;

    //this.nFrames = 0;

    //Time
    this.time = 0;
    this.fps = 10;
    this.frames = 0;

    this.key;

    //Setup Meshes
    this.initNodesAndSprings();
  };

  drawBlob() {
    //Draw Functions
    this.updateMesh();
    this.drawMesh();
    this.drawKfP();
  }

  drawKfP() {
    for (let k of this.keyFrames) {
      for (let i = 1; i < k.length; i++) {
        fill('red');
        circle(k[i][2], k[i][3], 10);
      }
    }
  }

  updateMesh() {

    this.applyFrames();

    for (let i = 0; i < this.keyCurr.length; i += 2) {
      this.keyCurr[i][1].update();
      this.keyCurr[i + 1][1].update();

      let uX = this.keyCurr[i][1].get();
      let uY = this.keyCurr[i + 1][1].get();

      this.nodes[this.keyCurr[i][0]].track(uX, uY);
    }

    // let all nodes repel each other
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].attractNodes(this.nodes);
    }
    // apply spring forces
    for (var i = 0; i < this.springs.length; i++) {
      this.springs[i].update();
    }

    // apply velocity vector and update position
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].update();
    }
  }

  inputKeyFrames(kfs, nF, x, y, c) {
    this.keyFrames = kfs;
    this.nFrames = nF;
    this.cX = x;
    this.cY = y;
    if (c == 1) {
      this.cX += 10;
      this.cY += 10;
    }
    this.bColor = this.cArr[c];
    print(c)
  }

  applyFrames() {
    let frame = frames % this.nFrames + 1;
    this.nextKeyFrames(frame);
  }

  nextKeyFrames(frame) {
    if (this.prevTarget != frame) {
      this.switched = false;
      this.prevTarget = frame;
    }

    for (var i = 0; i < this.keyFrames.length; i++) {
      if (this.switched == false) {
        if (this.keyFrames[i][0] == frame) {

          //Clear between frames
          this.key = [];
          this.keyNodes = [];
          this.keyCurr = [];

          //Fill between Keyframes
          let next = i + 1;
          if (next >= this.keyFrames.length) {
            next = 0;
          }

          for (let j = 1; j < this.keyFrames[next].length; j++) {
            this.key.push(this.keyFrames[next][j]);
          }

          let c = 0;
          for (let k of this.key) {

            let nNum = k[0] * this.nNodes + k[1];

            //Keynodes
            let sfXP = new SoftFloat(k[2]);
            let sfYP = new SoftFloat(k[3]);

            let nX, nY = this.nodes[nNum].getPos();

            let sfX = new SoftFloat(nX);
            let sfY = new SoftFloat(nY);

            //Targets
            sfX.setTarget(sfXP.get());
            sfY.setTarget(sfYP.get());

            //currKeys
            this.keyCurr.push([nNum, sfX]);
            this.keyCurr.push([nNum, sfY]);

            this.keyNodes.push([nNum, sfXP]);
            this.keyNodes.push([nNum, sfYP]);
            c += 2;
          }

          this.switched = true;
          return;
        }
      }
    }
  }

  drawMesh() {
    //Draw Outline
    fill(this.bColor);
    noStroke();
    smooth();
    beginShape();
    for (let i = 10; i < this.nodes.length; i += this.nNodes) {
      curveVertex(this.nodes[i].x, this.nodes[i].y);
    }
    endShape(CLOSE);

    // draw nodes
    stroke(0, 130, 164);
    strokeWeight(2);
    for (var i = 0; i < this.springs.length; i++) {
      line(this.springs[i].fromNode.x, this.springs[i].fromNode.y, this.springs[i].toNode.x, this.springs[i].toNode.y);
    }

    // draw nodes
    noStroke();
    for (var i = 0; i < this.nodes.length; i++) {
      fill(255);
      ellipse(this.nodes[i].x, this.nodes[i].y, this.nodeDiameter, this.nodeDiameter);
      fill(0);
      ellipse(this.nodes[i].x, this.nodes[i].y, this.nodeDiameter - 4, this.nodeDiameter - 4);
    }
  }

  initNodesAndSprings() {

    let spokes = [];

    let theta = TWO_PI / this.nSpokes;
    let rad = 0;

    for (let i = 0; i < this.nSpokes; i++) {
      let spoke = []
      for (let j = 0; j < this.nNodes; j++) {
        rad = (j + 1) / this.nNodes * this.maxRadius;
        let x = rad * cos(i * theta) + this.cX;
        let y = -rad * sin(i * theta) + this.cY;
        let n = new Node(x, y);
        spoke[j] = n;
      }
      spokes[i] = spoke;
    }

    let cn = new Node(this.cX, this.cY);
    this.nodes.push(cn);

    for (let i = 0; i < spokes.length; i++) {
      for (let j = 0; j < spokes[i].length; j++) {

        let rLen = this.maxRadius / (this.nNodes);

        if (j == 0) {
          var newSpring = new Spring(spokes[i][j], cn);
          newSpring.length = rLen;
          newSpring.stiffness = 0.5;
          this.springs.push(newSpring);
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
              sLength = 2 * tan(theta / 2) * rLen * (j + 1);
              sStiffness = 0.5;
            }

            var newSpring = new Spring(spokes[i][j], spokes[sI][nI]);
            newSpring.length = sLength;
            newSpring.stiffness = sStiffness;
            this.springs.push(newSpring);
          }
        }
      }
    }

    for (let s of spokes) {
      for (let n of s) {
        this.nodes.push(n);
      }
    }
  }
}
