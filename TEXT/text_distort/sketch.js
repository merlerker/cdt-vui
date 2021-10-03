//Sketch script

let font;
let fSize; // font size
let msg;

let pts = [];
let bounds;

//Preload Font
function preload() {
  // preload OTF font file
  font = loadFont('./assets/Roboto-Bold.ttf');
}

function setup() {

  createCanvas(windowWidth, windowHeight);

  fSize = 256;
  textFont(font);
  textSize(fSize);
  msg = 'point';

  let x = 0;
  let y = 0;

  bounds = font.textBounds(msg, 0, 0, fSize);

  // split word by letter, then turn into points
  for (let i=0; i<msg.length; i++) {
    let m = msg[i];
    // position letter in the next spot, get points
    const arr = font.textToPoints(m, x, y, fSize);
    pts.push(arr);
    x += textWidth(m); // shift forward one letter

    print("letter: ", m);
    let letter_bounds = font.textBounds(m, 0, 0, fSize);
    print("textW: ", textWidth(m));
    print("bounds: ", (letter_bounds.x + letter_bounds.w + letter_bounds.advance));

  }
  console.log(pts); // { x, y, path angle }
}

function draw() {
  stroke(255);
  strokeWeight(2);
  noFill();

  background(0);

  let x = width/2;
  let y = height/2;

  //Drawing Each Letter
  push();
  translate(x,y);

  // Shape outlines
  // for (let letter of pts) {
  //   beginShape();
  //   for (let pt of letter) {
  //     let letter_y = pt.y;
  //     if (pt.y < (-fSize/4)) {
  //       print(pt.y);
  //       letter_y -= 100;
  //     }
  //     vertex(pt.x, letter_y);
  //   }
  //   endShape(CLOSE);
  // }

  // Vertical lines
  for (let letter of pts) {
    beginShape();
    for (let pt of letter) {
      let letter_y = pt.y;

      letter_x = pt.x;
      // only distort the top
      if (pt.y < (-fSize/4)) {
        // sin wave
        // letter_y = pt.y - sin(10 * pt.x / bounds.w) * width / 30;
        
        // position y points according to gaussian func
        letter_y = pt.y - gaussian(pt.x);
      }
      line(letter_x, 0, letter_x, letter_y);
    }
    endShape(CLOSE);
  }
  pop();
}

function mousePressed() {
  print(mouseX, mouseY);
}

// gaussian function
// default values set for curve peak, height, and std_dev
function gaussian(x, center, height, std_dev) {
  let peak_xc = center || (map(mouseX, 0, width, 0, bounds.w));
  let curve_h = height || 100;
  let curve_sd = std_dev || 100;

  return curve_h*Math.E**(-1* (x - peak_xc)**2 / (2* curve_sd**2));
}