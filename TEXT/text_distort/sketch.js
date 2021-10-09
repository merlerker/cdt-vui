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
  msg = 'syl';

  let x = 0;
  let y = 0;

  bounds = font.textBounds(msg, 0, 0, fSize);

  // split word by letter, then turn into points
  for (let i=0; i<msg.length; i++) {
    let m = msg[i];
    // position letter in the next spot, get points
    const arr = font.textToPoints(m, x, y, fSize, {
      sampleFactor: 0.2,
      simplifyThreshold: 0
    });
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
  randomSeed(2);

  stroke(0);
  strokeWeight(1);
  noFill();

  background(255);

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
        let gaussian_total = gaussian(pt.x);
        letter_y = pt.y - gaussian_total;

        // uncomment to continuously map the gaussian height
        letter_y = map(letter_y, -fSize/4 - gaussian_total, -fSize - gaussian_total, -fSize/4, -fSize - gaussian_total);
      }

      //scribbly
      let y=0;
      let prev_x = letter_x;
      let segments = random(1,10);
      for (let segment=0; segment<segments; segment++) {
        let next_y = y+ random(1,letter_y-y);
        let next_x = letter_x + random(-5,5);
        line(prev_x,y, next_x, next_y);
        prev_x = next_x;
        y = next_y;
      }

      //regular
      // line(letter_x, 0, letter_x, letter_y);
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
  let curve_h = height || 500;
  let curve_sd = std_dev || 100;

  return curve_h*Math.E**(-1* (x - peak_xc)**2 / (2* curve_sd**2));
}