//Sketch script

//textToPoints var

let font;
let fSize; // font size
let msg; // text to write
let pts = []; // store path data

//Variables for p5.js speech
var rec = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
rec.continuous = true; // do continuous recognition
rec.interimResults = true; // allow partial recognition (faster, less accurate)

//Variables for rita
let word, features;
let syl, str, spl; 
let xWidth = [];

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

  let xSF = 0;
  let count = 0;
  for (let m of msg) {
    const arr = font.textToPoints(m, x, y, fSize);
    pts.push(arr);
    x += textWidth(m);
    xSF += textWidth(m);
    xWidth[count] = xSF;
  }
  console.log(pts); // { x, y, path angle }

  stroke(255);
  strokeWeight(2);
  noFill();

  rec.start();
}

function parseResult() {

  pts = [];

  // recognition system will often append words into phrases.
  // so hack here is to only use the last word:
  word = rec.resultString.split(' ').pop();
  features = RiTa.analyze(word);

  //change Message
  msg = word;

  let x = 0;
  let y = 0;
  for (let m of msg) {
    const arr = font.textToPoints(m, x, y, fSize);
    pts.push(arr);
    x += textWidth(m);
  }

  syl = features.syllables.split('/');
  str = features.stresses.split('/');
  spl = syllabify(word);

  console.log(word); //For Bug Fixing!
  console.log(syl);
  console.log(str);
  console.log(spl);
}

function draw() {
  let count = 0;
  let divs = letPerSyl();
  let prevX = 0;

  background(0);

  //Drawing Each Letter
  push();
  translate(60, height * 5 / 8);

  for (let pt of pts) {
    beginShape();
    for (let p of pt) {
      let sl = between(count, divs);
      let slSize = sylSize(sl, divs);
      let slope = getSlope(sl, p.x, count, slSize);
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
    count++;
  }
  pop();
}

//Syllabify Original Word
// https://stackoverflow.com/questions/49403285/splitting-word-into-syllables-in-javascript/49407494
const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;

function syllabify(words) {
  return words.match(syllableRegex);
}

function letPerSyl() {
  d = [];
  let l = 0;
  let s = 0;
  for (let sl of spl) {
    for (let lt of sl) {
      l++;
    }
    d[s] = l;
    s++;
  }
  return d;
}

function between(count, div) {
  for (let i = 0; j < div.length; i++) {
    if (count < div[0]) {
      return 0;
    } else if (div[i - 1] < count < div[i]) {
      return i;
    }
  }
  return null;
}

function sylSize(sl, divs) {
  if (sl = 0) {
    return divs[0];
  } else {
    return divs[sl] - divs[sl-1];
  }
}

//Divide
function fromTo(i) {
  var prev, curr, next;

  //prev
  if (i - 1 < 0) {
    prev = 0;
  } else {
    prev = str[i - 1];
  }

  //current
  curr = str[i];

  //next
  if (i + 1 > str.length) {
    next = 0;
  } else {
    next = str[i + 1];
  }

  return (prev, curr, next);
}

function calcSylLength() {
  return null;
}

function getSlope(i, x, count, slSize) {
  let prev, curr, next = fromTo(i);
  let xPos = x - xWidth[count-1];
  let sylWidth = calcSylLength(i);
  //let dX = xPos / (slSize*textWidth)
}
