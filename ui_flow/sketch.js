// See how Q does state machine here: https://editor.p5js.org/qshim/sketches/JR8KHFUVs
//  // make everything invisible
// for(let i=0; i<video_names.length; i++){
//   vids[i].style('display', 'none');
//  }
//  //make only vids[counter] visible
//  vids[counter].style('display', 'initial');

// State machine model
const STATES = {
  'INTRO': 0,
  'HELLO': 8,
  'SHELF': 1,
  'READING': 2,
  'HELP': 3,
  'WORD_CHILD': 4,
  'WORD_VUI': 5,
  'DEFINE': 6,
  'STATS': 7
};

let animations = {}; // dict where key is the state number, value is a GIF
let screens = {}; // dict where key is the state number, value is a PNG
let blobs = [];

let lastState = -1;
let state = STATES['INTRO'];
let page_num = 0; // page number for reading
let state_timer;

// VUI model
let hesitation_timer; // time since last word was recognized
let mostrecentword = ""; // last spoken word
const YES_UTTERANCE = ["yes", "yeah", "ya", "uh-huh", "okay", "ok", "yep", "yeppers"];
const NO_UTTERANCE = ["no"];

let vx;
let vy;

let time = 0;
let fps = 30;
let frames = 0;
let rsFactor = 0;

let animState = 'loading';

let files = ['celebrate', 'encourage', 'hello_goodbye', 'help', 'listen', 'loading', 'read', 'teach'];
let fNums = {
  'celebrate': 6,
  'encourage': 6,
  'hello_goodbye': 6,
  'help': 5,
  'listen': 10,
  'loading': 21,
  'read': 8,
  'teach': 6,
  'celebrate-help': 7,
  'help-read': 7,
  'help-teach': 4,
  'listen-celebrate': 7,
  'listen-encourage': 6,
  'listen-help': 7,
  'loading-hello': 51,
  'read-listen': 6,
  'teach-celebrate': 5,
  'teach-help': 6
};
let allKeyFrames = {};
let keyTxt = {};

// Variables for word-focus view
let playing = false;
let playhead;
let current_word = "rumbled"; // word we are reading
let X_SHIFT, Y_SHIFT;
let undistorted_pts; // Nested array (syllables, letters, pts) for undistorted pts
let pts; // Nested array (syllables, letters, pts) for gaussian distorted pts
let stress_xc; // x positions of stress centers
let word_w;

let font;
let fSize; // font size

//Variables for p5.js speech
let listener;
let speaker;

//Preload Font
function preload() {
  // preload OTF font file
  font = loadFont('./assets/Roboto-Bold.ttf');

  for (let vstate of files) {
    let path = "assets/PNGS/" + vstate + "/";
    loadStateAni(vstate, path, fNums[vstate]);
  }

  loadStateBg('SHELF', "assets/SCREENS/Library.png")
  loadStateBg('READING', "assets/SCREENS/Reading.png")
  loadStateBg('HELP', "assets/SCREENS/Reading.png")
  loadStateBg('WORD_CHILD', "assets/SCREENS/Syllables.png")
  loadStateBg('WORD_VUI', "assets/SCREENS/Syllables.png")
  loadStateBg('DEFINE', "assets/SCREENS/Syllables.png")
  loadStateBg('STATS', "assets/SCREENS/Dashboard.png")

  loadTxtFrames();
}

function setup() {

  createCanvas(1366, 1024); //iPad

  fSize = 256;
  textFont(font);
  textSize(fSize);

  listener = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
  listener.continuous = true; // do continuous recognition
  listener.interimResults = true; // allow partial recognition (faster, less accurate)
  listener.onEnd = restart;
  listener.start();

  speaker = new p5.Speech();

  state_timer = new Timer();
  hesitation_timer = new Timer();

  loadBlobFrames();
  initBlobs('loading');
}

function draw() {
  background(255);

  showCurrentImg(screens);
  updateBlobs();
  drawVUI(animState);

  switch (state) {

    case STATES['INTRO']:
      if (lastState != state) {
        assignBlobs('loading');
        animState = 'loading';
      }
      if (state_timer.elapsed(5)) {
        state_timer.start();
        state = STATES['HELLO'];
      }
      lastState = STATES['INTRO'];
      break;

    case STATES['HELLO']:
      if (lastState != state) {
        assignBlobs('hello_goodbye');
        animState = 'hello_goodbye';
      }
      if (state_timer.elapsed(10)) {
        state_timer.start();
        state = STATES['SHELF'];
      }
      lastState = STATES['HELLO'];
      break;

    case STATES['SHELF']:

      if (lastState != state) {
        assignBlobs('read');
        animState = 'read';
      }
      if (mouseIsPressed) {
        state = STATES['READING'];
        hesitation_timer.start();
      }
      lastState = STATES['SHELF'];
      break;

    case STATES['READING']:

      if (lastState != state) {
        assignBlobs('help');
        animState = 'help';
      }

      // No words have been read for 5 seconds
      if (hesitation_timer.elapsed(10)) {
        state = STATES['HELP'];
        hesitation_timer.start();
      }
      lastState = STATES['READING'];
      break;

    case STATES['HELP']:
      if (lastState != state) {
        assignBlobs('listen');
        animState = 'listen';
      }
      if (hesitation_timer.elapsed(16)) {
        state = STATES['WORD_CHILD'];
        hesitation_timer.start();

        // get the current word as points
        [undistorted_pts, pts, stress_xc, word_w] = wordToStressPts(current_word);
        // center the word
        X_SHIFT = width / 2 - textWidth(current_word) / 2;
        Y_SHIFT = 2 * height / 3; // baseline
        playhead = X_SHIFT; // set playhead to left side of word
      } else if (hesitation_timer.elapsed(5)) {
        subtitle("r u there (say \"yes\")");
      } else {
        subtitle("do you need help? (say \"yes\")");
      }
      if (YES_UTTERANCE.includes(mostrecentword.toLowerCase())) {
        state = STATES['WORD_CHILD'];
        hesitation_timer.start();

        // get the current word as points
        [undistorted_pts, pts, stress_xc, word_w] = wordToStressPts(current_word);
        // center the word
        X_SHIFT = width / 2 - textWidth(current_word) / 2;
        Y_SHIFT = 2 * height / 3; // baseline
        playhead = X_SHIFT; // set playhead to left side of word
      }
      lastState = STATES['HELP'];
      break;

    case STATES['WORD_CHILD']:
      if (lastState != state) {
        assignBlobs('listen');
        animState = 'listen';
      }
      // TODO: change to break into syllables
      subtitle("TODO: break into syllables. if you don't read for 5s, VUI will help!");
      drawWord(X_SHIFT, Y_SHIFT); // draw points as given

      // Child isn't reading so VUI helps
      if (hesitation_timer.elapsed(5)) {
        speaker.speak(current_word);
        state = STATES['WORD_VUI'];
        playing = true; // play the current word out loud
        hesitation_timer.start();
      } else {
        // text("WORD_CHILD", width/2,height/2);
      }
      lastState = STATES['WORD_CHILD'];
      break;

    case STATES['WORD_VUI']:
      if (lastState != state) {
        assignBlobs('listen');
        animState = 'listen';
      }
      subtitle("end of the prototype for now");

      // TODO: fix logic so it just plays once, then plays again on clicks
      if (playing) {
        // speaker.speak(current_word); // play the current word out loud
      }
      updateStressPts(playhead); // add syllable stresses up to given x position
      drawWord(X_SHIFT, Y_SHIFT); // draw points as given

      // we haven't hit the end of the word
      if (playhead < (X_SHIFT + word_w)) {
        playhead += 20;
      }
      // when we hit the end of the word, stop playing the current word (only play once)
      // override with mousePressed
      else {
        playing = false;
      }
      lastState = STATES['WORD_VUI'];
      break;

    case STATES['DEFINE']:
      if (lastState != state) {
        assignBlobs('listen');
        animState = 'listen';
      }
      lastState = STATES['DEFINE'];
      break;

    case STATES['STATS']:
      if (lastState != state) {
        assignBlobs('listen');
        animState = 'listen';
      }
      lastState = STATES['STATS'];
      break;
  }
}

//blobs

function defaultBlobs() {
  for (let b of blobs) {
    b.inputKeyFrames();
  }
}

function assignBlobs(anim) {

  let mx = vx + animations[anim].width / 2;
  let my = vy;

  let num = 2;
  for (let i = 0; i < blobs.length; i++) {
    blobs[i].inputKeyFrames(allKeyFrames[anim], fNums[anim], vx, vy, i % 2);
    print("assignBlobs" + i%2)
  }
}

function initBlobs(anim) {
  let mx = vx + animations[anim].width / 2;
  let my = vy;

  let num = 2;
  for (let i = 0; i < num; i++) {
    let b = new Blob(allKeyFrames[anim], fNums[anim], vx, vy, i % 2);
    //b.inputKeyFrames(allKeyFrames[anim], fNums[anim], vx, vy, i % 2);
    blobs.push(b);
    console.log(blobs);
  }
}

function updateBlobs() {
  for (let b of blobs) {
    b.drawBlob();
  }
}

function loadTxtFrames() {
  let dir = './assets/blobKeys/';

  for (let i = 0; i < files.length; i++) {
    let raw = loadStrings(dir + files[i] + '.txt');
    keyTxt[files[i]] = raw;
  }
}

function loadBlobFrames() {
  for (let [key, value] of Object.entries(keyTxt)) {
    let processed = parseKeyFrames(value);
    allKeyFrames[key] = processed;
  }
}

function parseKeyFrames(raw) {
  raw.pop();

  let kfs = []; //Return

  let outNodes = raw.length;
  incr = 30 / outNodes;

  let count = 0;

  let last = -1; //Last Frame
  let nKey = []; //Nodes for this Frame

  for (let r = 0; r < raw.length; r++) {
    let nu = split(raw[r], ',');

    if (last != nu[0]) {
      if (last = -1) { //First Case Exception
        last = nu[0];
      }

      kfs.push(nKey);

      nKey = [];
      nKey.push(nu[0]);
    }
    nKey.push([round(count), 9, vx + nu[1] / rsFactor, vy + nu[2] / rsFactor]);
    count += incr;
  }
  kfs.shift();
  return kfs;
}

function moveVUIChar(state, x, y) {
  animations[state].position(x, y);
}

//Next

function parseResult() {
  // recognition system will often append words into phrases.
  // so hack here is to only use the last word:
  mostrecentword = listener.resultString.split(' ').pop();
  var resultstring = listener.resultString;

  hesitation_timer.start();
}

// once the record ends or an error happens, start() again. this should keep it going
function restart() {
  listener.start();
}

function drawVUI(anim) {

  //AdvanceFrames
  if (time % fps == 0) {
    frames += 1;
  }

  //ImageProperties
  let fIndex = frames % fNums[anim];
  cX = vx - animations[anim][0].width / 2;
  cY = vy - animations[anim][0].height / 2;

  image(animations[anim][fIndex], cX, cY);
  time++;
}

function loadStateAni(state_name, img_path, num, gif_x, gif_y, gif_w, gif_h) {
  let x = gif_x || width / 2;
  let y = gif_y || height / 2;
  let w = gif_w || 400;
  let h = gif_h || 400;

  let imgArr = [];
  for (let j = 1; j < num + 1; j++) {
    let nImg = loadImage(img_path + j + '.png', nImg => {
      nImg.resize(w, 0);
      rsFactor = nImg.width / w;
    });
    imgArr.push(nImg);
  }
  animations[state_name] = imgArr;
  vx = windowWidth / 2
  vy = windowHeight / 2;
}

function loadStateBg(state_name, img_path) {
  screens[STATES[state_name]] = loadImage(img_path);
}

function hideAll(img_dict) {
  for (let [state, img] of Object.entries(img_dict)) {
    img.hide();
  }
}

function showCurrentAni(img_dict) {
  if (state in img_dict) {
    img_dict[state].show();
  }
}

function showCurrentImg(img_dict) {
  if (state in img_dict) {
    image(img_dict[state], 0, 0);
  }
}

function mousePressed() {

  if (state == STATES['WORD_VUI']) {
    playing = true;
  }
}

// gaussian function
// default values set for curve peak, height, and std_dev
function gaussian(x, center, height, std_dev) {
  let peak_xc = center || mouseX - width / 2;
  // let peak_xc = center || (map(mouseX-width/2, 0, width, 0, textWidth(msg))); // instead of textWidth(msg) can use bounds.w
  let curve_h = height || 600;
  let curve_sd = std_dev || 100;

  return curve_h * Math.E ** (-1 * (x - peak_xc) ** 2 / (2 * curve_sd ** 2));
}

// RiTa only gives syllables with phonemes, so we have our own syllable function
// https://stackoverflow.com/questions/49403285/splitting-word-into-syllables-in-javascript/49407494
const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;

function syllabify(words) {
  return words.match(syllableRegex);
}

/**
 * Returns points for given word, relative to (0,0) and distorted with stresses.
 *
 * @param {string} word The word to parse into points and stressed syllables.
 * @return {number[][][]{}} word_pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable,
 *                          3rd level is each pt for that letter, and 4th level is a dict at each point {x: SoftFloat, y: SoftFloat}
 * @return {number[]} stress_positions Array of x-centers of stressed syllables
 * @return {number} x the width of the word
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
  for (let [i, syllable] of syllables.entries()) {
    let syl_pts = []; // Pts array for this syllable

    // If this syllable is stressed, save the center position
    let stressed = !!parseInt(stresses[i]); // or Boolean(parseInt(stresses[i]))
    if (stressed) {
      // print("stressed syllable: ", syllable);
      let bounds = font.textBounds(syllable, x, 0, fSize);
      let syl_w = bounds.w + bounds.advance;
      let syl_xc = x + syl_w / 2; // x-center of syllable
      stress_positions.push(syl_xc);
    }

    // 2. Iterate through letters, saving points
    for (let j = 0; j < syllable.length; j++) {
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

  // Add distortion effect from all stressed syllables, and convert to SoftFloats
  let word_sf = [];
  // 1. Iterate through syllables
  for (let syllable of word_pts) {
    let syl_sf = [];
    // 2. Iterate through letters
    for (let letter of syllable) {
      let letter_sf = []; // SoftFloat points array for this letter
      // 3. Iterate through points
      for (let pt of letter) {
        let pt_sf = {};

        // if (pt.x + X_SHIFT < mouseX) {
        //   // only distort the top 3/4 of the letter
        //   if (pt.y < (-fSize/4)) {
        //     // taking into account all stress centers
        //     // compute total gaussian effect on each point
        //     let gaussian_total = 0;
        //     let gaussian_max = gaussian(stress_positions[0], center=stress_positions[0]);
        //     for (xc of stress_positions) {
        //       gaussian_total += gaussian(pt.x, center=xc);
        //     }
        //     pt.y -= gaussian_total; // position y points according to gaussian func
        //     pt.y = map(pt.y, -fSize/4 - gaussian_total, -fSize - gaussian_total, -fSize/4, -fSize - gaussian_total); // map points to distribute the gaussian "lift"
        //   }
        // }

        // 4. Turn point dict entries into SoftFloats
        pt_sf.x = new SoftFloat(pt.x);
        pt_sf.y = new SoftFloat(pt.y);
        letter_sf.push(pt_sf);
      }
      syl_sf.push(letter_sf);
    }
    word_sf.push(syl_sf);
  }

  // return [word_sf,stress_positions];
  return [word_pts, word_sf, stress_positions, x];
}

/**
 * Updates points for given word, using both SoftFloat transitions and stress distortion..
 *
 * @param {number} x_pos The x position up to which to do Gaussian distortion
 * @global {number[][][]{}} pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable,
 *                          3rd level is each pt for that letter, and 4th level is a dict at each point {x: SoftFloat, y: SoftFloat}
 * @global {number[]} stress_xc Array of x-centers of stressed syllables
 */
function updateStressPts(x_pos) {
  // Add distortion effect from all stressed syllables
  // 1. Iterate through syllables
  for (let [i, syllable] of undistorted_pts.entries()) {
    // 2. Iterate through letters
    for (let [j, letter] of syllable.entries()) {
      // 3. Iterate through points
      for (let [k, pt] of letter.entries()) {
        pts[i][j][k].y.update(); // update SoftFloat for the distorted version of this point
        let adjusted_y = pt.y; // gaussian adjusted y value

        // Set new SoftFloat for y according to gaussian adjustment and mouseX position
        if (pt.x + X_SHIFT < x_pos) {
          // only distort the top 3/4 of the letter
          if (pt.y < (-fSize / 4)) {
            // taking into account all stress centers
            // compute total gaussian effect on each point
            let gaussian_total = 0;
            let gaussian_max = gaussian(stress_xc[0], center = stress_xc[0]);
            for (xc of stress_xc) {
              gaussian_total += gaussian(pt.x, center = xc);
            }
            adjusted_y -= gaussian_total; // position y points according to gaussian func
            // map points to distribute the gaussian "lift"
            adjusted_y = map(adjusted_y, -fSize / 4 - gaussian_total, -fSize - gaussian_total, -fSize / 4, -fSize - gaussian_total);
          }
        }
        pts[i][j][k].y.setTarget(adjusted_y);

      }
    }
  }
}

/**
 * Draws word given array of points and starting (x,y)
 *
 * @global {number[][][]{}} pts Nested array where 1st level is syllables, 2nd level is each letter in that syllable,
 *                          3rd level is each pt for that letter, and 4th level is a dict at each point {x: SoftFloat, y: SoftFloat}
 * @param {number} x Bottom-left x
 * @param {number} y Bottom-left y
 */
function drawWord(x, y) {

  //Drawing Each Letter
  push();
  translate(x, y);

  // 1. Iterate through syllables
  for (let syllable of pts) {
    // 2. Iterate through letters
    for (let letter of syllable) {
      beginShape();
      // 3. Iterate through points
      for (let pt of letter) {
        // stroke(0);
        // line(pt.x, 0, pt.x, pt.y);

        // fill(0);
        // noStroke();
        // ellipse(pt.x,pt.y,5,5);

        fill(255);
        noStroke();
        vertex(pt.x.get(), pt.y.get());
      }
      endShape();
    }
  }
  pop();
}

function subtitle(txt) {
  textSize(24);
  textAlign(CENTER);
  text(txt, width / 2, 7 * height / 8);
  textSize(fSize);
  textAlign(LEFT);
}
