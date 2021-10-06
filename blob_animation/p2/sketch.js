//Node Spring Method

'use strict';

var sketch = function(p) {
  // an array for the nodes
  var nodes = [];
  var keyNodes = [];
  var keyCurr = [];

  // an array for the springs
  var springs = [];

  //KeyFrameArray
  var keyFrames = [];
  var switched = false;
  var prevTarget = 0;

  //node Properties
  let nSpokes = 20;
  let nNodes = 10;
  let maxRadius = 80;

  //Graphics
  let c1 = p.color('#84B8FD');

  // dragged node
  var selectedNodes = [];
  var selectedNode = null;
  var nodeDiameter = 16;
  //let anchors = [];

  //Gifs
  var listToEnco = [];
  var cX = 0;
  var cY = 0;
  var nW = 1000;
  var nH = 0;

  //Time
  var time = 0;
  var fps = 10;
  var frames = 0;

  var key;

  p.preload = function() {
    for (var i = 0; i < 28; i++) {
      listToEnco[i] = p.loadImage("./assets/" + (i + 1) + ".png");
    }
  }

  p.setup = function() {

    //Canvas + Graphics Setup
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(255);
    p.noStroke();

    //Setup Meshes
    initNodesAndSprings();
    gifResize();
    loadKeyFrames();
  };

  p.draw = function() {

    p.background(255);
    //p.ellipse(p.windowWidth,p.windowHeight,10, 10);

    //Draw Functions
    updateMesh();
    drawMesh();
    drawChar(p.windowWidth / 2, p.windowHeight / 2);
  }

  var drawChar = function(x, y) {

    //AdvanceFrames
    if (time % fps == 0) {
      frames += 1;
    }

    //ImageProperties
    let fIndex = frames % listToEnco.length;
    cX = x - nW / 2;
    cY = y - nH / 2;

    p.image(listToEnco[fIndex], cX, cY);
    time++;
  }

  var updateMesh = function() {

    applyFrames();

    for (let i = 0; i < keyCurr.length; i += 2) {
      keyCurr[i][1].update();
      keyCurr[i+1][1].update();

      let uX = keyCurr[i][1].get();
      let uY = keyCurr[i+1][1].get();

      nodes[keyCurr[i][0]].track(uX,uY);
    }

    // let all nodes repel each other
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].attractNodes(nodes);
    }
    // apply spring forces
    for (var i = 0; i < springs.length; i++) {
      springs[i].update();
    }

    // apply velocity vector and update position
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].update();
    }
  }

  var gifResize = function() {
    for (let img of listToEnco) {
      img.resize(1000, 0);
      nH = img.height;
    }
  }

  var loadKeyFrames = function() {
    let rX = p.windowWidth - 1000 / 2;
    let rY = p.windowHeight - 600 / 2;
    keyFrames = [
      [1, [15, 9, rX - 500, rY - 75],
        [5, 9, rX - 500, rY - 500],
      ],
      [10, [0, 9, rX - 75, rY],
        [10, 9, rX - 600, rY],
      ]
    ];
  }

  var applyFrames = function() {

    let frame = frames % listToEnco.length + 1;

    nextKeyFrames(frame);
  }

  var nextKeyFrames = function(frame) {

    if (prevTarget != frame) {
      switched = false;
      prevTarget = frame;
    }

    for (var i = 0; i < keyFrames.length; i++) {
      if (switched == false) {
        if (keyFrames[i][0] == frame) {

          //Clear between frames
          key = [];
          keyNodes = [];
          keyCurr = [];

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
            console.log(k);
            let nNum = k[0] * nNodes + k[1];

            //Keynodes
            let sfXP = new SoftFloat(k[2]);
            let sfYP = new SoftFloat(k[3]);

            let nX, nY = nodes[nNum].getPos();
            console.log(nodes[nNum]);

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

            console.log(keyCurr);
            console.log('div')
            console.log(keyNodes);
            c += 2;
          }

          switched = true;
          return;
        }
      }
    }
  }

  var drawMesh = function() {
    //Draw Outline
    p.fill(c1);
    p.smooth();
    p.beginShape();
    for (let i = 10; i < nodes.length; i += nNodes) {
      p.curveVertex(nodes[i].x, nodes[i].y);
    }
    p.endShape(p.CLOSE);

    // draw nodes
    p.stroke(0, 130, 164);
    p.strokeWeight(2);
    for (var i = 0; i < springs.length; i++) {
      p.line(springs[i].fromNode.x, springs[i].fromNode.y, springs[i].toNode.x, springs[i].toNode.y);
    }

    // draw nodes
    p.noStroke();
    for (var i = 0; i < nodes.length; i++) {
      p.fill(255);
      p.ellipse(nodes[i].x, nodes[i].y, nodeDiameter, nodeDiameter);
      p.fill(0);
      p.ellipse(nodes[i].x, nodes[i].y, nodeDiameter - 4, nodeDiameter - 4);
    }
  }

  var initNodesAndSprings = function() {

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

var myp5 = new p5(sketch);
