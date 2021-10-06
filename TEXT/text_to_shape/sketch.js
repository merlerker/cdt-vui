// Font vars
let font;
let fSize;
let msg;

// Position vars
let pts; // Nested array: 1st level is syllables, 2nd level is pts for each letter in the syllable
let stress_xc; // x positions of stress centers

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
  msg = 'anatomy';

  [pts, stress_xc] = wordToPoints(msg);
}

function draw() {
  stroke(255);
  strokeWeight(2);
  noFill();

  background(0);

  let x = width/2;
  let y = height/2;
  drawWordPts(pts,x,y);
}

function mousePressed() {
  print(mouseX, mouseY);
}

// gaussian function
// default values set for curve peak, height, and std_dev
function gaussian(x, center, height, std_dev) {
  let peak_xc = center || mouseX-width/2;
  // let peak_xc = center || (map(mouseX-width/2, 0, width, 0, textWidth(msg))); // instead of textWidth(msg) can use bounds.w
  let curve_h = height || 100;
  let curve_sd = std_dev || 100;

  return curve_h*Math.E**(-1* (x - peak_xc)**2 / (2* curve_sd**2));
}

// RiTa only gives syllables with phonemes, so we have our own syllable function
// https://stackoverflow.com/questions/49403285/splitting-word-into-syllables-in-javascript/49407494
const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
function syllabify(words) {
  return words.match(syllableRegex);
}


/**
 * Returns points and stress positions for given word, relative to (0,0).
 *
 * @param {string} word The word to parse into points and stressed syllables.
 * @return {number[][][]} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable, 3rd level is each pt for that letter
 * @return {number[]} stress_positions Array of x positions of stresses (center of syllable)
 */
function wordToPoints(word) {
  let word_pts = [];
  let stress_positions = [];

  let syllables = syllabify(word);
  let stresses = RiTa.stresses(word).split('/');

  // Calculate positions relative to (0,0) -- we will translate later
  let x = 0;
  let y = 0;

  // 1. Iterate through syllables
  for (let i=0; i<syllables.length; i++) {
    let syllable = syllables[i];
    let stressed = !!parseInt(stresses[i]); // or Boolean(parseInt(stresses[i]))

    let syl_start_x = x; // This syllable's starting x position
    let syl_pts=[]; // Pts array for this syllable

    // 2. Iterate through letters, saving points
    for (let j=0; j<syllable.length; j++) {
      let m = syllable[j];
      let letter_pts = font.textToPoints(m, x, y, fSize);
      syl_pts.push(letter_pts);
      x += textWidth(m); // Shift forward to place the next letter in its position

      // check difference between textW and bounds function
      // let letter_bounds = font.textBounds(m, 0, 0, fSize);
      // print("textW: ", textWidth(m));
      // print("bounds: ", (letter_bounds.x + letter_bounds.w + letter_bounds.advance));

    }

    let syl_width = x - syl_start_x;
    word_pts.push(syl_pts); // Save this syllable's letter pts

    // If this syllable is stressed, save the center position
    if (stressed) {
      print("stressed syllable: ", syllable);
      stress_positions.push(syl_start_x + syl_width/2);
    }

  }

  return [word_pts, stress_positions];
}


/**
 * Draws word given array of points and starting (x,y)
 *
 * @param {number[][][]} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable, 3rd level is each pt for that letter
 * @param {number} x Bottom-left x
 * @param {number} y Bottom-left y
 */
function drawWordPts(word_pts,x,y) {
  //Drawing Each Letter
  push();
  translate(x,y);

  // 1. Iterate through syllables
  for (let syllable of word_pts) {
    // 2. Iterate through letters
    for (let letter of syllable) {
      beginShape();
      // 3. Iterate through points
      for (let pt of letter) {
        let letter_y = pt.y;
        let letter_x = pt.x;

        // only distort the top 1/4 of the letter
        if (pt.y < (-fSize/4)) {
          // taking into account all stress centers
          // compute total gaussian effect on each point
          let gaussian_total = 0;
          for (xc of stress_xc) {
            gaussian_total += gaussian(pt.x, center=xc);
          }
          letter_y = pt.y - gaussian_total;

          // position y points according to gaussian func
        }
        line(letter_x, 0, letter_x, letter_y);
      }
      endShape(CLOSE);
    }
  }
  pop();
}
