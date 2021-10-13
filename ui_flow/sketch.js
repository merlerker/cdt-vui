// See how Q does state machine here: https://editor.p5js.org/qshim/sketches/JR8KHFUVs
//  // make everything invisible
// for(let i=0; i<video_names.length; i++){
//   vids[i].style('display', 'none');
//  }
//  //make only vids[counter] visible
//  vids[counter].style('display', 'initial');

// State machine model
const SCREEN_STATES = ['loading','library','reading','word focus','dashboard'];
let screens = {}; // dict where key is the state number, value is a PNG
let state_timer;
let screen_state = 'loading';

let page_num = 0; // page number for reading

// VUI model
// datastructures for states and animations
const VUI_STATES = {'loading': 21, 'read': 8, 'listen': 10, 'encourage': 6, 'celebrate': 6, 'teach': 7, 'help': 5, 'hello-goodbye': 6}; // also default
let state_animations = {}; // dict where key is the state string, value is a p5.play Animation
const VUI_TRANSITIONS = {'TEACH TO CELEBRATE': 5, 'READ TO LISTEN': 6, 'LISTEN TO CELEBRATE': 7, 'LISTEN TO HELP': 7, 'LISTEN TO ENCOURAGE': 6, 'LOADING TO HELLO': 50, 'CELEBRATE TO HELP': 7, 'HELP TO TEACH': 4, 'HELP TO READ': 7, 'TEACH TO HELP': 6, 'READ TO TEACH':4, 'TEACH TO LISTEN':6};
const REVERSE_TRANSITIONS = {'ENCOURAGE TO LISTEN': 'LISTEN TO ENCOURAGE'}
let transition_animations = {}; // dict where key is the state string, value is a p5.play Animation
let blob_images = {}; // dict where key is the state string, value is a p5.Image

const VUI_X = 1200;
const VUI_Y = 850;
// status
let current_animation;
let vui_state = 'loading';
let transitioning = false;
let hesitation_timer; // time since last word was recognized

// Variables for reading words
const WORD_STATES = ['syllables','emphasis','full'];
let book_words = ['chug', 'chug', 'chug', 'puff', 'puff', 'puff', 'ding-dong', 'ding-dong', 'the', 'little', 'train', 'rumbled', 'over', 'the', 'tracks', 'she', 'was', 'a', 'happy', 'little', 'train'];
let word_idx = 0; // index of word we are reading

// Variables for word-focus view
let current_syllable = -1;
let playing = false;
let playhead;
let x_shift, y_shift;
let undistorted_pts; // Nested array (syllables, letters, pts) for undistorted pts
let pts; // Nested array (syllables, letters, pts) for gaussian distorted pts
let stress_xc; // x positions of stress centers
let word_w;

let font, bookFont;
let fSize; // font size

//Variables for p5.js speech
let listener;
let speaker;
let mostrecentword=""; // last spoken word
let repeatwordcount=0; // number of times the word has been repeated
let rec_timer; // timer for when we last recognized a word
let highlight_x=298;
let do_speak=false;
let pause_rec=false; // pause speech recognition
const YES_UTTERANCE = ["yes", "yeah", "ya", "uh-huh","okay","ok","yep","yeppers"];
const NO_UTTERANCE = ["no"];

// Variables for mic input
let mic;
let vol;

//Preload Font
function preload() {
  // preload OTF font file
  // font = loadFont('./assets/Roboto-Bold.ttf');
  font = loadFont('./assets/Sofia Pro Regular.otf');
  // font = 'sofia-pro';
  bookFont = 'ten-oldstyle';

  // load vui states
  for (const [s,count] of Object.entries(VUI_STATES)) {
    if (count > 0) {
      state_animations[s] = loadAnimation(`assets/PNGS/${s}/vui_states_0.png`, `assets/PNGS/${s}/vui_states_${count-1}.png`);
      state_animations[s].frameDelay = 10;

      blob_images[s] = loadImage(`assets/PNGS/blobs/${s}.png`);
    }
    // add a default VUI state
    if (s == 'listen') {
      state_animations['default'] = loadAnimation(`assets/PNGS/${s}/vui_states_0.png`, `assets/PNGS/${s}/vui_states_${count-1}.png`);
      state_animations['default'].frameDelay = 10;

      blob_images['default'] = loadImage(`assets/PNGS/blobs/${s}.png`);
    }
  }

  // load transitions
  for (const [t,count] of Object.entries(VUI_TRANSITIONS)) {
    if (count > 0) {
      transition_animations[t] = loadAnimation(`assets/PNGS/TRANSITIONS/${t}/vui_states_0.png`, `assets/PNGS/TRANSITIONS/${t}/vui_states_${count-1}.png`);
      transition_animations[t].frameDelay = 10;
      transition_animations[t].looping = false;
    }
  }
  for (const [t,reverse_t] of Object.entries(REVERSE_TRANSITIONS)) {
    let count = VUI_TRANSITIONS[reverse_t];
    if (count > 0) {
      transition_animations[t] = loadAnimation(`assets/PNGS/TRANSITIONS/${reverse_t}/vui_states_${count-1}.png`,`assets/PNGS/TRANSITIONS/${reverse_t}/vui_states_0.png`);
      transition_animations[t].frameDelay = 10;
      transition_animations[t].looping = false;
    }
  }

  // load screens
  for (const ss of SCREEN_STATES) {
    screens[ss] = loadImage(`assets/SCREENS/${ss}.png`);
  }
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
  speaker.onStart = pauseSpeechRec;
  speaker.onEnd = resumeSpeechRec;

  mic = new p5.AudioIn();
  mic.start();

  state_timer = new Timer();
  hesitation_timer = new Timer();
  rec_timer = new Timer();

  current_animation = transition_animations['LOADING TO HELLO'];
  // current_animation = transition_animations['ENCOURAGE TO LISTEN'];
  // vui_state = 'help';
  // current_animation = state_animations[vui_state];
}

function draw() {
  background(255);
  imageMode(CENTER);

  // show the current screen
  if (screen_state in screens) {
    image(screens[screen_state],width/2,height/2);
  }

  if (screen_state != 'loading') {
    image(blob_images[vui_state], VUI_X, VUI_Y, 350,350);
    // animation(current_animation, width*(7/8), height*(7/8));
    animation(current_animation, VUI_X, VUI_Y, 350,350);
  }

  switch(screen_state) {
    case 'loading':

      switch(current_animation) {
        case transition_animations['LOADING TO HELLO']:
          image(blob_images[vui_state], width/2, height/2 + 20, 861,861);
          animation(current_animation, width/2, height/2);
          // reached the end of the animation
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            vui_state = 'hello-goodbye';
            current_animation = state_animations[vui_state];
            state_timer.start()
          }
          break;
        case state_animations['hello-goodbye']:
          image(blob_images[vui_state], width/2, height/2 + 20, 861,861);
          animation(current_animation, width/2, height/2 + 20, 861,861);
          if (state_timer.elapsed(2) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            screen_state = 'library';
            vui_state = 'default';
            current_animation = state_animations[vui_state];
            speaker.speak("choose a book");
          }
          break;
      }
      break;

    case 'library':
      // subtitle("choose a book");
      if (mouseIsPressed) {
        screen_state = 'reading';
        vui_state = 'listen';
        current_animation = state_animations[vui_state];
        hesitation_timer.start();
      }
      break;

    case 'reading':      
      highlightWord();
      // print(hesitation_timer.currentTime());
      
      switch(current_animation) {
        case state_animations['listen']:
          // second round of no response
          if (hesitation_timer.elapsed(9) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            transitioning = true;
            current_animation = transition_animations['LISTEN TO HELP'];
          }
          else if (hesitation_timer.elapsed(8) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            transitioning = true;
            current_animation = transition_animations['LISTEN TO ENCOURAGE'];
          }
          break;
        case transition_animations['LISTEN TO ENCOURAGE']:
          // transition complete, go to encourage
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'encourage';
            current_animation = state_animations[vui_state];
            state_timer.start();
          }
          break;
        case state_animations['encourage']:
          if (state_timer.elapsed(4) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            current_animation = transition_animations['ENCOURAGE TO LISTEN'];
          }
          break;
        case transition_animations['ENCOURAGE TO LISTEN']:
          // transition complete, go to listen
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'listen';
            current_animation = state_animations[vui_state];
          }
          break;
        case transition_animations['LISTEN TO HELP']:
          // transition complete, go to listen
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'help';
            current_animation = state_animations[vui_state];
            speaker.speak("do you need help? just say yes if you do!");
            state_timer.start();
          }
          break;
        case state_animations['help']:
          // subtitle("do you need help? just say yes if you do!");
          if (YES_UTTERANCE.includes(mostrecentword)) {
            // get the current word as points
            [undistorted_pts,pts,stress_xc,word_w] = wordToStressPts(book_words[word_idx]);
            // center the word
            x_shift = width/2 - textWidth(book_words[word_idx])/2;
            y_shift = 460; // baseline
            playhead = x_shift; // set playhead to left side of word
            state_timer.start();
            current_animation = transition_animations['HELP TO READ'];

            do_speak = true;
            screen_state = 'word focus';
          }
          break;
      }
      
      break;

    case 'word focus':
      drawWord(x_shift,y_shift); // draw points as given

      if (state_timer.isAt(1) && do_speak && (current_animation == transition_animations['HELP TO READ'])) {
        playing = true; // play the current word out loud
        speaker.speak(book_words[word_idx]); // play the current word out loud
        do_speak = false;
      }
      // Word status
      if (playing) {
        updateStressPts(playhead); // add syllable stresses up to given x position
        // we haven't hit the end of the word
        if (playhead < (x_shift + word_w)) {
          playhead += 20;
        }
        // when we hit the end of the word, stop playing the current word (only play once)
        // override with mousePressed
        else {
          playing = false;
          // current_animation = transition_animations['READ TO LISTEN'];
        }
      }
      // not playing
      else {
        
      }

      // VUI status
      switch(current_animation) {
        case transition_animations['HELP TO READ']:
          // transition complete, go to listen
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'read';
            current_animation = state_animations[vui_state];
            state_timer.start()
          }
          break;
        case state_animations['read']:
          if (state_timer.elapsed(2) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            current_animation = transition_animations['READ TO TEACH'];
            do_speak = true;
          }
          break;
        case transition_animations['READ TO TEACH']:
            // subtitle("now you try");
            if (do_speak) {
              speaker.speak("now you try")
              do_speak = false;
            }
            if (current_animation.getFrame() == current_animation.getLastFrame()) {
              transitioning = false;
              vui_state = 'teach';
              current_animation = state_animations[vui_state];
              state_timer.start()
            }
            break;
        case state_animations['teach']:
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            current_animation = transition_animations['TEACH TO LISTEN'];
          }
          break;
        case transition_animations['TEACH TO LISTEN']:
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'listen';
            current_animation = state_animations[vui_state];
            current_syllable = 0;
            state_timer.start()
          }
          break;
        case state_animations['listen']:
          vol = mic.getLevel();

          if ((vol > .005) & state_timer.elapsed(1)) {
              current_syllable++;
              state_timer.start();
          }

          // we've read all the syllables
          if ((current_syllable >= pts.length) & (current_animation.getFrame() == current_animation.getLastFrame())) {
            current_animation = transition_animations['LISTEN TO CELEBRATE'];
          }
          break;
        case transition_animations['LISTEN TO CELEBRATE']:
          if (current_animation.getFrame() == current_animation.getLastFrame()) {
            transitioning = false;
            vui_state = 'celebrate';
            current_animation = state_animations[vui_state];
            speaker.speak("hooray")
            state_timer.start()
          }
          break;
        case state_animations['celebrate']:
          // subtitle("hooray")
          // if (state_timer.elapsed(2) & (current_animation.getFrame() == current_animation.getLastFrame())) {
          //   screen_state = 'reading2'
          // }
          break;
      }
      break;

    case SCREEN_STATES['DEFINE']:
      break;

    case SCREEN_STATES['STATS']:
      break;
  }
}

function parseResult() {
  if (!pause_rec) {
    if (rec_timer.elapsed(1)) {
      var resultstring = listener.resultString;
      var result_lst = resultstring.split(' ');
      var mostrecentwords = result_lst.slice(-2, result_lst.length);

      // recognition system will often append words into phrases.
      // so hack here is to only use the last word:
      var lastword = result_lst[result_lst.length-1];
      
      // repeat words
      if (lastword == mostrecentword) {
        repeatwordcount++;
      }
      else {
        repeatwordcount = 0;
      }

      mostrecentword=lastword.toLowerCase();
      if (mostrecentword == 'dong') {
        mostrecentword = 'ding-dong';
      }
      if (mostrecentword == book_words[word_idx]) {
        hesitation_timer.start();
      }
      print(mostrecentword);
      rec_timer.start();
    }
    else {
      mostrecentword="";
    }
  }
}

// once the record ends or an error happens, start() again. this should keep it going
function restart() {
  listener.start();
}

function highlightWord() {
  var word_y = 832; // baseline y
  // line 2
  if (word_idx>8) {
    word_y = 882;
  }
  // reposition x if we're on line 2
  if (word_idx==9) {
    highlight_x = 256;
  }

  textSize(31);
  textFont(bookFont);
  var word_w = textWidth(book_words[word_idx] + " ");
  textFont(font);
  textSize(fSize);

  stroke('#E7C4FC');
  strokeWeight(5);
  noFill();
  line(highlight_x,word_y,highlight_x+word_w,word_y);

  // use first 3 letters for looser match
  if (mostrecentword.slice(0,3) == book_words[word_idx].slice(0,3)) {
      highlight_x+=word_w;
      word_idx++;
  }
}

function loadStateAni(state_name, gif_path, gif_x, gif_y, gif_w, gif_h) {
  let x = gif_x || width/2;
  let y = gif_y || height/2;
  let w = gif_w || 400;
  let h = gif_h || 400;
  state_animations[SCREEN_STATES[state_name]] = createImg(gif_path).hide();
  state_animations[SCREEN_STATES[state_name]].position(x,y);
  state_animations[SCREEN_STATES[state_name]].size(w,h);
}


function hideAll(img_dict) {
  for (let [state, img] of Object.entries(img_dict)) {
    img.hide();
  }
}

function showCurrentAni(img_dict) {
  // if (state in img_dict) {
  //   img_dict[state].show();
  // }
}

function mousePressed() {
  print(mouseX, mouseY);

  if (screen_state == SCREEN_STATES['WORD_VUI']) {
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

        // if (pt.x + x_shift < mouseX) {
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
        if (pt.x + x_shift < x_pos) {
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
  for (let [i, syllable] of pts.entries()) {
    fill(0);
    noStroke();
    // not the current syllable, so draw lighter
    if ((current_syllable>=0) && (current_syllable != i)) {
      fill(0,0,0,150);
    }
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

function pauseSpeechRec() {
  pause_rec=true;
}

function resumeSpeechRec() {
  pause_rec=false;
}