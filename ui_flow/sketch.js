// See how Q does state machine here: https://editor.p5js.org/qshim/sketches/JR8KHFUVs
//  // make everything invisible
// for(let i=0; i<video_names.length; i++){
//   vids[i].style('display', 'none');
//  }
//  //make only vids[counter] visible
//  vids[counter].style('display', 'initial');

// State machine model
const STATES = {'INTRO':0, 'HELLO':8, 'SHELF':1, 'READING':2, 'HELP':3, 'WORD_CHILD':4, 'WORD_VUI':5, 'DEFINE':6, 'STATS':7};
let animations = {};
let state = STATES['INTRO'];
let page_num = 0; // page number for reading
let state_timer;

// VUI model
let hesitation_timer; // time since last word was recognized
let mostrecentword=""; // last spoken word
const YES_UTTERANCE = ["yes", "yeah", "ya", "uh-huh","okay","ok","yep","yeppers"];
const NO_UTTERANCE = ["no"];

let font;
let fSize; // font size

//Variables for p5.js speech
let listener;

//Preload Font
function preload() {
  // preload OTF font file
  font = loadFont('./assets/Roboto-Bold.ttf');

  loadStateGIF('INTRO', "assets/GIFS/loading.gif");
  loadStateGIF('HELLO', "assets/GIFS/hello_goodbye.gif");

}

function setup() {

  createCanvas(windowWidth, windowHeight);

  fSize = 80;
  textFont(font);
  textSize(fSize);

  listener = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
  listener.continuous = true; // do continuous recognition
  listener.interimResults = true; // allow partial recognition (faster, less accurate)
  listener.start();

  state_timer = new Timer();
  hesitation_timer = new Timer();
}

function draw() {
  background(255);

  switch(state) {
    case STATES['INTRO']:
      animations[state].show();
      if (state_timer.elapsed(2.5)) {
        animations[state].hide();
        state_timer.start();
        state = STATES['HELLO'];
      }
      break;

    case STATES['HELLO']:
      animations[state].show();
      if (state_timer.elapsed(2)) {
        animations[state].hide();
        state_timer.start();
        state = STATES['SHELF'];
      }
      break;

    case STATES['SHELF']:
      text("SHELF", width/2,height/2);
      if (mouseIsPressed) {
        state = STATES['READING'];
        hesitation_timer.start();
      }
      break;

    case STATES['READING']:
      text("READING", width/2,height/2);
      print(hesitation_timer.currentTime());
      // No words have been read for 8 seconds
      if (hesitation_timer.elapsed(8)) {
        state = STATES['HELP'];
        hesitation_timer.start();
      }
      break;

    case STATES['HELP']:
      if (hesitation_timer.elapsed(16)) {
        state = STATES['WORD_CHILD'];
        hesitation_timer.start();
      }
      else if (hesitation_timer.elapsed(8)) {
        text("r u there", width/2,height/2);
      }
      else {
        text("do you need help?", width/2,height/2);
      }
      if (YES_UTTERANCE.includes(mostrecentword.toLowerCase())) {
        state = STATES['WORD_CHILD'];
        hesitation_timer.start();
      }
      break;

    case STATES['WORD_CHILD']:
      // Child isn't reading so VUI helps
      if (hesitation_timer.elapsed(8)) {
        state = STATES['WORD_VUI'];
        hesitation_timer.start();
      }
      else {
        text("WORD_CHILD", width/2,height/2);
      }
      break;

    case STATES['WORD_VUI']:
      text("WORD_VUI", width/2,height/2);
      break;

    case STATES['DEFINE']:
      break;

    case STATES['STATS']:
      break;
  }
}

function parseResult() {
  // recognition system will often append words into phrases.
  // so hack here is to only use the last word:
  mostrecentword = listener.resultString.split(' ').pop();
  var resultstring = listener.resultString;
  
  print(resultstring);
  print(mostrecentword);
  hesitation_timer.start();
}

function loadStateGIF(state_name, gif_path, gif_x, gif_y, gif_w, gif_h) {
  let x = gif_x || width/2;
  let y = gif_y || height/2;
  let w = gif_w || 400;
  let h = gif_h || 400;
  animations[STATES[state_name]] = createImg(gif_path).hide();
  animations[STATES[state_name]].position(x,y);
  animations[STATES[state_name]].size(w,h);
}