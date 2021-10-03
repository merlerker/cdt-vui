let curr_pts;
let ptsA;
let ptsB;
let ptsC;
let transitioning = false; // transitioning between VUI states
let stringA, stringB;

let yoff = 0.0;


function preload() {
    let fileA = "blind-contour-01";
    let fileB = "blind-contour-02";

    stringA = loadStrings(fileA + ".txt");
    stringB = loadStrings(fileB + ".txt");

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    ptsA = parseToArray(stringA);
    ptsB = parseToArray(stringB);

    curr_pts = parseToArray(stringA); // could also deepcopy ptsA here, but we'll use parseToArray to create new SoftFloat objects
}


function draw() {
    background(255);
    if (transitioning) {
        transitioning = updateArray(curr_pts);
    }
    else {
        jitterArray(curr_pts);
    }
    drawArray(curr_pts);
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
                pt[j] = new SoftFloat(parseFloat(pt[j])); // convert string to float
            }
            pts.push(pt);
        }
    }
    return pts;
}

// draw array of softfloats
function drawArray(ptsArr) {
    noFill();
    stroke(0);
    strokeWeight(2);

    beginShape();
    for (let i=0; i<ptsArr.length; i++) {
        let pt = ptsArr[i];
        curveVertex(pt[0].get(), pt[1].get());
    }
    endShape();
}

// update array of softfloats
// return false if done updating
function updateArray(ptsArr) {
    let arr_targeting = false; // if any points in the array are still updating return true
    for (let i=0; i<ptsArr.length; i++) {
        let pt = ptsArr[i];
        let pt_targeting;
        pt_targeting = pt[0].update(); // update x
        pt[1].update(); // update y
        arr_targeting = arr_targeting || pt_targeting;
    }
    return arr_targeting;
}

// transition array A to B
// setting new SoftFloat targets
function targetArray(A, B) {
    let mapping = {};
    // more points in B than A
    if (A.length < B.length) {
        let step = Math.round(B.length / A.length);
        for (let A_idx=0; A_idx<A.length; A_idx++) {
            // let B_idx = A_idx;
            let B_idx = A_idx * step; // skip extra points in the middle
            if (B_idx < B.length) {
                A[A_idx][0].setTarget(B[B_idx][0].get()); // set softfloat target for x
                A[A_idx][1].setTarget(B[B_idx][1].get()); // set softfloat target for y
                mapping[A_idx] = B_idx;
            }
        }
    }
    // more points in A than B
    else {
        let step = Math.round(A.length / B.length);
        for (let B_idx=0; B_idx<B.length; B_idx++) {
            // let A_idx = B_idx;
            let A_idx = B_idx * step; // skip extra points in the middle
            if (A_idx < A.length) {
                mapping[A_idx] = B_idx;
                A[A_idx][0].setTarget(B[B_idx][0].get()); // set softfloat target for x
                A[A_idx][1].setTarget(B[B_idx][1].get()); // set softfloat target for y
            } 
        }
    }
}

// jitter all the points in the array
function jitterArray(ptsArr) {
    for (let i=0; i<ptsArr.length; i++) {
        let pt = ptsArr[i];
        pt[0].jitter(.25);
        pt[1].jitter(.25);
    }
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