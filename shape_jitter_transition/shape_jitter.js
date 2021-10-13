// without SoftFloats, just perlin noise or sin waves

// blob references
// https://editor.p5js.org/natureofcode/sketches/B1Iy2929x
// https://thecodingtrain.com/CodingChallenges/036-blobby.html
// soft bodies
// https://editor.p5js.org/krafpy/sketches/L0zXxth-1
// https://editor.p5js.org/p5/sketches/Simulate:_SoftBody 


// affect waviness with speech volume
// https://p5js.org/examples/sound-mic-input.html
// https://p5js.org/reference/#/p5/userStartAudio

let mic;
let vol;

let listener;
let spoken_text;

let yellow_pts, blue_pts;
let hair_pts, nose_pts, lbrow_pts, rbrow_pts;
let stringYellow, stringBlue, stringYellow_b, stringHair, stringNose, stringLbrow, stringRbrow;

// offset for random wobbles in sin wave magnitude
let blue_off = 94.0;
let yellow_off = 0.0;


function preload() {
    let fileBlue = "listening-blue";
    let fileYellow = "listening-yellow";
    let fileYellow_b = "read";

    stringBlue = loadStrings(fileBlue + ".txt");
    stringYellow = loadStrings(fileYellow + ".txt");
    stringYellow_b = loadStrings(fileYellow_b + ".txt");

    stringHair = loadStrings("listening_outline/" + "hair" + ".txt");
    stringNose = loadStrings("listening_outline/" + "nose" + ".txt");
    stringLbrow = loadStrings("listening_outline/" + "left-brow" + ".txt");
    stringRbrow = loadStrings("listening_outline/" + "right-brow" + ".txt");

}

function setup() {
    createCanvas(windowWidth, windowHeight);

    blue_pts = parseToArray(stringBlue);
    yellow_pts = parseToArray(stringYellow);

    yellow_b_pts = parseToArray(stringYellow_b)

    hair_pts = parseToArray(stringHair);
    nose_pts = parseToArray(stringNose);
    lbrow_pts = parseToArray(stringLbrow);
    rbrow_pts = parseToArray(stringRbrow);

    mic = new p5.AudioIn();
    mic.start();

    listener = new p5.SpeechRec('en-US', parseResult); // new P5.SpeechRec object
    listener.continuous = true; // do continuous recognition
    listener.interimResults = true; // allow partial recognition (faster, less accurate)
    listener.onResult = parseResult;
    listener.start();
}


function draw() {
    vol = mic.getLevel();

    background(255);

    noStroke();
    fill(132, 184, 253, 150);
    blue_off = drawPolar(blue_pts, blue_off);
    // fill(0);
    // drawDots(blue_pts);

    fill(255, 220, 94, 150);
    yellow_off = drawPolar(yellow_pts, yellow_off);
    // fill(0);
    // drawDots(yellow_pts);

    noFill();
    stroke(0);
    strokeWeight(6);
    drawCurves(hair_pts);
    drawCurves(nose_pts);
    drawCurves(lbrow_pts);
    drawCurves(rbrow_pts);

    fill(0);
    noStroke();
    ellipse(160,200,20,20);
    ellipse(250,210,20,20);

    textSize(48);
    text(spoken_text, windowWidth/4, 900)
}

// parse string array into points array
// ["x,y", "x,y", ... ] -> [[x,y], [x,y], ... ]
function parseToArray(stringArr) {
    let pts = [];
    for (let i=0; i<stringArr.length; i++) {
        let line = stringArr[i];

        if (line.length > 0) {
            let pt = line.split(","); // split x and y
            for (let j=0; j<pt.length; j++) {
                pt[j] = parseFloat(pt[j]); // convert string to float
            }
            pts.push(pt);
        }
    }
    return pts;
}

function drawDots(ptsArr) {
    let center = getArrayCenter(ptsArr); // returns array [x,y]
    push();
    translate(center[0], center[1]);

    for (let i=0; i<ptsArr.length; i++) {
        let pt = [ptsArr[i][0], ptsArr[i][1]];
        let angle = getAngle(center, pt);
        let offset=0;
        let r = getDistance(center, pt) + offset;
        ellipse(r * cos(angle), r * sin(angle),5,5);
    }
    pop();
}

function drawCurves(ptsArr) {
    let center = getArrayCenter(ptsArr); // returns array [x,y]
    push();
    translate(center[0], center[1]);

    beginShape();
    for (let i=0; i<ptsArr.length; i++) {
        let pt = [ptsArr[i][0], ptsArr[i][1]];
        let angle = getAngle(center, pt);
        let offset=0;
        let r = getDistance(center, pt) + offset;
        curveVertex(r * cos(angle), r * sin(angle));
    }
    endShape();
    pop();
}

// draw points using polar coordinates
function drawPolar(ptsArr, yoff) {
    let center = getArrayCenter(ptsArr); // returns array [x,y]
    push();
    translate(center[0], center[1]);

    beginShape();
    for (let i=0; i<ptsArr.length; i++) {
        let pt = [ptsArr[i][0], ptsArr[i][1]];
        let angle = getAngle(center, pt);

        // offset is generated using perlin noise, which is always output between 0 and 1
        // first parameter of noise() changes the wobble as we rotate around the center (parameterized on angle)
        // second parameter of noise() changes the wobble over time
        // to reduce wobble, we can change the noise parameters (move less along the noise curve each step in space/time)
        // or we can map to smaller -/+ values
        // let magnitude = 10;
        
        let magnitude = 10 + 500*vol;
        // let offset = map(sin(angle*100 + frameCount*.01), -1, 1, -magnitude, magnitude); // distort w sin curve on edge
        let offset = map(sin(angle*100 + yoff*2), -1, 1, -magnitude, magnitude); // distort w sin curve on edge
        
        // let magnitude = 20;
        // let offset = map(noise(angle*.5, yoff), 0, 1, -magnitude, magnitude);

        let r = getDistance(center, pt) + offset;
        curveVertex(r * cos(angle), r * sin(angle));
    }

    endShape();
    pop();

    return yoff + .005;
}

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

// get center of array of SoftFloats
// return as array [x,y]
function getArrayCenter(ptsArr) {
    let x_sum = 0;
    let y_sum = 0;
    for (let i=0; i<ptsArr.length; i++) {
        let pt = ptsArr[i];
        x_sum += pt[0];
        y_sum += pt[1];
    }

    let center = [x_sum/ptsArr.length, y_sum/ptsArr.length];
    return center;
}

function keyTyped() {
    if (key == 'a') {
        print("animating to a");
        transitioning = true;
        targetArray(curr_pts, ptsA);
    }
    if (key == 'b') {
        print("animating to b");
        transitioning = true;
        targetArray(curr_pts, ptsB);
    }
}


// start listening when user clicks
function mousePressed() {
    userStartAudio();
}

// parse speech recognition result
function parseResult() {
    // recognition system will often append words into phrases.
    // so hack here is to only use the last word:
    var mostrecentword = listener.resultString.split(' ').pop();
    var resultstring = listener.resultString;
    spoken_text = mostrecentword;

    // print(listener.resultJSON['timeStamp']);
    print("confidence: " + listener.resultConfidence)
    print(resultstring);
    print(mostrecentword);
  }