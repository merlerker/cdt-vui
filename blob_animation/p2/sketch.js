//Node Spring Method

'use strict';

var sketch = function(p) {
  // an array for the nodes
  var nodes = [];

  //node Properties
  let nSpokes = 20;
  let nNodes = 10;
  let maxRadius = 400;

  // an array for the springs
  var springs = [];

  //Graphics
  let c1 = p.color('#84B8FD');

  // dragged node
  var selectedNode = null;
  var nodeDiameter = 16;
  let anchors = [];

  //gifLoading

  // var gif_loadImg, gif_createImg;

  /*
  p.preload = function() {
    gif_loadImg = p.loadImage("./assets/vui_states.gif");
    gif_createImg = p.createImg("./assets/vui_states.gif");
  }
  */

  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(255);
    p.noStroke();

    initNodesAndSprings();
  };

  p.draw = function() {

    p.background(255);

    //gif
    /*
    p.image(gif_loadImg, 50, 50);
    gif_createImg.size(200);
    gif_createImg.position(p.windowWidth / 2, p.windowHeight / 2);
    */

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

    if (selectedNode != null) {
      selectedNode.x = p.mouseX;
      selectedNode.y = p.mouseY;
    }

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

  var addAnchor = function(i,j) {
    let anchor = [i,j];
    anchors.push(anchor);
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
    console.log(springs);
  }

  p.mousePressed = function() {
    // Ignore anything greater than this distance
    var maxDist = 20;
    for (var i = 0; i < nodes.length; i++) {
      var checkNode = nodes[i];
      var d = p.dist(p.mouseX, p.mouseY, checkNode.x, checkNode.y);
      if (d < maxDist) {
        selectedNode = checkNode;
        maxDist = d;
      }
    }
  };

  p.mouseReleased = function() {
    if (selectedNode != null) {
      selectedNode = null;
    }
  };

  p.keyPressed = function() {
    if (p.key == 's' || p.key == 'S') p.saveCanvas(gd.timestamp(), 'png');

    if (key == 'r' || key == 'R') {
      p.background(255);
      initNodesAndSprings();
    }
  };

}

var myp5 = new p5(sketch);
