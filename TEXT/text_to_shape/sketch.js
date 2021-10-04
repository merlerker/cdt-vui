// Font vars
let font;
let fSize;
let msg;

// Position vars
let pts; // Nested array: 1st level is syllables, 2nd level is pts for each letter in the syllable
let stress_xc; // x positions of stress centers

let scribble;
let scribble_pts = [];
let scribble_seed = 1; // random seed for scribble
let yoff = 0.0; // position for sin wave

//Preload Font
function preload() {
  // preload OTF font file
  font = loadFont('./assets/Didot-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  scribble = new Scribble();
  scribble.roughness = 1.5;
	scribble.bowing = 15;  
	scribble.maxOffset = 1; //jitteriness
	strokeWeight( 2 );

  fSize = 256;
  textFont(font);
  textSize(fSize);
  msg = 'physicality';

  pts = wordToScribblePts(msg);

  // pts = wordToStressPts(msg);
}

function draw() {
  randomSeed( scribble_seed );

  stroke(0);
  strokeWeight(2);
  noFill();

  background('#F8F5F4');

  let x = width/2 - textWidth(msg)/2;
  let y = height/2;

  drawScribbleWord(pts,x,y);
  scribble_seed+=.18;
  // drawWord(pts,x,y); // draw points as given

}

function mousePressed() {
  print(mouseX, mouseY);
}

// gaussian function
// default values set for curve peak, height, and std_dev
function gaussian(x, center, height, std_dev) {
  let peak_xc = center || mouseX-width/2;
  // let peak_xc = center || (map(mouseX-width/2, 0, width, 0, textWidth(msg))); // instead of textWidth(msg) can use bounds.w
  let curve_h = height || 600;
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
 * Reference: https://mitsuyawatanabe.medium.com/draw-characters-of-pseudo-handwriting-lines-with-p5-js-9c35a67c97d
 *
 * @param {string} word The word to parse into points and stressed syllables.
 * @return {number[][][]} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable, 3rd level is each pt for that letter
 */
function wordToScribblePts(word) {
  let word_pts = [];
  let stress_positions = [];
  let bounds_lst = []; // bounds per letter
  let cx_lst = []; // cx per letter
  let cy_lst = []; // cy per letter

  let syllables = syllabify(word);
  let stresses = RiTa.stresses(word).split('/');

  // Calculate positions relative to (0,0) -- we will translate later
  let x = 0;
  let y = 0;

  // 1. Iterate through syllables
  for (let [i, syllable]  of syllables.entries()) {
    let stressed = !!parseInt(stresses[i]); // or Boolean(parseInt(stresses[i]))
 
    let syl_start_x = x; // This syllable's starting x position
    let syl_pts=[]; // Pts array for this syllable
    let syl_bounds = [];
    let syl_cx = [];
    let syl_cy = [];
    
    // 2. Iterate through letters, saving points
    for (let j=0; j<syllable.length; j++) {
      let m = syllable[j];
      let letter_pts = font.textToPoints(m, x, y, fSize, {
        sampleFactor: 0.3,
        simplifyThreshold: 0
      });
      let bounds = font.textBounds(m, 0, 0, fSize);
      let letter_w = bounds.w + bounds.x + bounds.advance;
      
      syl_pts.push(letter_pts);
      syl_bounds.push(bounds);
      syl_cx.push(x + letter_w/2);
      syl_cy.push(bounds.h/2);

      x += letter_w; // Shift forward to place the next letter in its position
    }

    let syl_width = x - syl_start_x;
    word_pts.push(syl_pts); // Save this syllable's letter pts
    bounds_lst.push(syl_bounds);
    cx_lst.push(syl_cx);
    cy_lst.push(syl_cy);

    // If this syllable is stressed, save the center position
    if (stressed) {
      print("stressed syllable: ", syllable);
      stress_positions.push(syl_start_x + syl_width/2);
    }
  }

  // Add effect from stressed syllables and build scribble vectors
  let scribble_pts = [];
  // 1. Iterate through syllables
  for (let [i,syllable] of word_pts.entries()) {
    let syl_bounds = bounds_lst[i];
    let syl_cx = cx_lst[i];
    let syl_cy = cy_lst[i]; 
    // 2. Iterate through letters
    for (let [j,letter] of syllable.entries()) {
      let x_pts = []; // list of all x
      let y_pts = []; // list of all y
      let bounds = syl_bounds[j];
      let cx = syl_cx[j];
      let cy = syl_cy[j];

      let min_y = 0; // keep track of highest (smallest) y position after gaussian distortion

      // 3. Iterate through points
      for (let pt of letter) {
        // only distort the top 1/4 of the letter
        if (pt.y < (-fSize/4)) {
          // taking into account all stress centers
          // compute total gaussian effect on each point
          let gaussian_total = 0;
          for (xc of stress_positions) {
            gaussian_total += gaussian(pt.x, center=xc);
          }
          pt.y -= gaussian_total; // position y points according to gaussian func
          pt.y = map(pt.y, -fSize/4 - gaussian_total, -fSize - gaussian_total, -fSize/4, -fSize - gaussian_total); // map points to distribute the gaussian "lift"
          if (pt.y < min_y) { min_y = pt.y; }
        }

        cy = min_y/2; // update cy with distorted letters

        x_pts.push(pt.x);
        y_pts.push(pt.y);
      }

      const vector = {
        xCoords: x_pts,
        yCoords: y_pts,
        bounds: bounds,
        centerX: cx,
        centerY: cy,
        weight: 4 // weight of scribble
      }
  
      scribble_pts.push(vector)
    }
  }

  return scribble_pts;
}

/**
 * Draws word with scribble fill given array of points and starting (x,y)
 *
 * @param {Dictionary[]} word_pts Array of dictionaries (one for each letter) where entres are xCoords, yCoords, bounds, centerX, centerY, weight
 * @param {number} x Bottom-left x
 * @param {number} y Bottom-left y
 */
function drawScribbleWord(word_pts,x,y) {
  const gap = 4.5; // gap between scribbles

  push();
  translate(x,y);

	for (let vec of word_pts) {
     const theta = Math.PI/8; // angle of scribbles
		//  const theta = Math.atan2(mouseY - vec.yCoords[0], -1 * (mouseX - vec.centerX));
		 angle = theta * (180 / Math.PI) + 90;
		 strokeWeight( vec.weight );

     xCoords = [];
     yCoords = [];
     for (let [i,x] of vec.xCoords.entries()) {
        y = vec.yCoords[i];
        pt = [x,y];
        center = [vec.centerX, vec.centerY];
        let wave_pt = wavePt(center, pt);
        xCoords.push(wave_pt[0]);
        yCoords.push(wave_pt[1]);
     }

     if (scribble) {
      scribble.scribbleFilling( xCoords, yCoords , gap, angle );
    }
		//  if (scribble) {
		// 	 scribble.scribbleFilling( vec.xCoords, vec.yCoords , gap, angle );
    //  }
	}

  pop();
}

/**
 * Returns points for given word, relative to (0,0) and distorted with stresses.
 *
 * @param {string} word The word to parse into points and stressed syllables.
 * @return {number[][][]} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable, 3rd level is each pt for that letter
 */
 function wordToStressPts(word) {
  let word_pts = [];
  let stress_positions = [];

  let syllables = syllabify(word);
  let stresses = RiTa.stresses(word).split('/');

  // Calculate positions relative to (0,0) -- we will translate later
  let x = 0;
  let y = 0;

  // 1. Iterate through syllables
  for (let [i, syllable]  of syllables.entries()) {
    let syl_pts=[]; // Pts array for this syllable

    // If this syllable is stressed, save the center position
    let stressed = !!parseInt(stresses[i]); // or Boolean(parseInt(stresses[i]))
    if (stressed) {
      print("stressed syllable: ", syllable);
      let bounds = font.textBounds(syllable, x, 0, fSize);
      let syl_w = bounds.w + bounds.advance;
      let syl_xc = x + syl_w/2; // x-center of syllable
      stress_positions.push(syl_xc);
    }
    
    // 2. Iterate through letters, saving points
    for (let j=0; j<syllable.length; j++) {
      let m = syllable[j];
      let letter_pts = font.textToPoints(m, x, y, fSize);
      let bounds = font.textBounds(m, 0, 0, fSize);
      let letter_w = bounds.w + bounds.x + bounds.advance;
      // let letter_w = textWidth(m); // Alternative way of measuring letter width
      syl_pts.push(letter_pts);

      x += letter_w; // Shift forward to place the next letter in its position
    }

    word_pts.push(syl_pts); // Save this syllable's letter pts
  }

  // Add distortion effect from all stressed syllables
  // 1. Iterate through syllables
  for (let syllable of word_pts) {
    // 2. Iterate through letters
    for (let letter of syllable) {
      // 3. Iterate through points
      for (let pt of letter) {
        // only distort the top 3/4 of the letter
        if (pt.y < (-fSize/4)) {
          // taking into account all stress centers
          // compute total gaussian effect on each point
          let gaussian_total = 0;
          let gaussian_max = gaussian(stress_positions[0], center=stress_positions[0]);
          for (xc of stress_positions) {
            gaussian_total += gaussian(pt.x, center=xc);
          }
          pt.y -= gaussian_total; // position y points according to gaussian func
          pt.y = map(pt.y, -fSize/4 - gaussian_total, -fSize - gaussian_total, -fSize/4, -fSize - gaussian_total); // map points to distribute the gaussian "lift"
        }
      }
    }
  }

  return word_pts;
}

/**
 * Draws word given array of points and starting (x,y)
 *
 * @param {number[][][]} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable, 3rd level is each pt for that letter
 * @param {number} x Bottom-left x
 * @param {number} y Bottom-left y
 */
 function drawWord(word_pts,x,y) {
  //Drawing Each Letter
  push();
  translate(x,y);

  // 1. Iterate through syllables
  for (let syllable of word_pts) {
    // 2. Iterate through letters
    for (let letter of syllable) {
      // 3. Iterate through points
      for (let pt of letter) {
        // line(pt.x, 0, pt.x, pt.y);
        ellipse(pt.x,pt.y,5,5);
      }
    }
  }
  pop();

}

function wavePt(center, pt) {
  // get the angle from A to B, where each is an array [x,y]
  function getAngle(A, B) {
    // move A to 0,0
    // we could also push to A as our center
    let translated_x = B[0] - A[0];
    let translated_y = B[1] - A[1];
    return Math.atan2(translated_y, translated_x);
  }

  // get the distance from A to B, where each is an array [x,y]
  function getDistance(A, B) {
    return Math.sqrt((A[0]-B[0])**2 + (A[1]-B[1])**2);
  }

  let angle = getAngle(center, pt);
  
  let magnitude = 10;
  let offset = map(sin(angle*100 + yoff*2), -1, 1, -magnitude, magnitude); // distort w sin curve on edge
  
  let r = getDistance(center, pt) + offset;
  return [r * cos(angle), r * sin(angle)];
}