// printing speech timing to see if we can space text based on speed it is spoken at

// use callbacks for speechstart / speechend to see if you can get the timing for each word
// https://github.com/IDMNYU/p5.js-speech/blob/master/examples/03callbacks.html
// moveable type: https://awarua.github.io/creative-coding/tutorials/tut06/


let listener;
let speaker; // speech synth

let speech_start_time, speech_end_time;
let spoken_text;
let duration;
let results_dict = {};

let font;
let points;
let bounds;

function preload() {
  font = loadFont('./assets/Avenir.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  listener = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
  listener.continuous = true; // do continuous recognition
  listener.interimResults = true; // allow partial recognition (faster, less accurate)
  listener.onStart = speechStarted;
  listener.onResult = speechEnded;
  // listener.onSpeechStart = speechStarted;
	// listener.onSpeechEnd = speechEnded;

  speaker = new p5.Speech();
  
  spoken_text = 'secret';
  
  listener.start();
  
   points = font.textToPoints(
    spoken_text, 0, 0, 100, {
      sampleFactor: 1,
      simplifyThreshold: 0
    });

  bounds = font.textBounds(
    spoken_text, 0, 0, 200);

  cursor(CROSS);
  fill(255, 127);
  noStroke();
}

function draw() {
  background(0);
  
  stroke(51);
  line(width / 2, 0, width / 2, height);
  line(0, height / 2, width, height / 2);
  noStroke();
  
  //let centerDist = dist(mouseX, mouseY, width / 2, height / 2);
  let centerDist = width / 50;

  let transparency = map(centerDist, 0, width / 2, 200, 50);
  transparency = constrain(transparency, 50, 200);
  fill(255, transparency);
  
  let jiggle = map(centerDist, 0, width, 1, 300);
 

   points = font.textToPoints(
    spoken_text, 0, 0, 100, {
      sampleFactor: 1.5,
      simplifyThreshold: 0

  //bounds = font.textBounds(spoken_text, 0, 0, 200);
    
  //translate((width - abs(bounds.w)) / 2, 
  //          (height + abs(bounds.h)) / 2);
  
  //for (let i = 0; i < points.length; i++) {
  //  let p = points[i];
  //  ellipse(p.x, p.y, 5, 5);
  //  //ellipse(p.x + jiggle * randomGaussian(), 
  //  //  p.y + jiggle * randomGaussian(), 5, 5);
  //}
  
  //beginShape();
  //translate(-bounds.x * width / bounds.w, -bounds.y * height / bounds.h );
  // translate(-bounds.x * width / bounds.w + 150, -bounds.y * height / bounds.h - (height - bounds.h)/2);
  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    ellipse(
      p.x * width / bounds.w + (width / 30)*1,
      p.y * height / bounds.h + bounds.h*4, 10
    );
  }
  //endShape(CLOSE);

}

function parseResult() {
    // recognition system will often append words into phrases.
    // so hack here is to only use the last word:
    var mostrecentword = listener.resultString.split(' ').pop();
    var resultstring = listener.resultString;

    // print(listener.resultJSON['timeStamp']);
    print(listener.resultConfidence);
    
    spoken_text = resultstring;
    print(resultstring);
    print(mostrecentword);
  }

function speechStarted() {
  speech_start_time = millis();
  print("Speech start: ", speech_start_time);
}

function speechEnded() {
  parseResult();
  
  if (listener.resultConfidence > .8) {
    speech_end_time = millis();
    print("Speech end: ", speech_end_time);
    duration = speech_start_time - speech_end_time;
    speech_start_time = speech_end_time;
  }
}
