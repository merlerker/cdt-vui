// trace splines over an image then save as a list of points
// also see for possible svg conversion: https://css-tricks.com/svg-path-syntax-illustrated-guide/

let myfilename = "blind-contour-04";
let mysvg;
let mypts = [];

let blobs = ['loading', 'read', 'listen', 'encourage', 'celebrate', 'teach', 'help', 'hello-goodbye'];
let blob_imgs = {};
let blob_idx = 0;

function preload() {
    // mysvg = loadImage("VUI_blind-contour/" + myfilename + ".svg");
    mysvg = loadImage("listening.png");

    for (let blob_file of blobs) {
        blob_imgs[blob_file] = loadImage(`blobs/${blob_file}.png`);
    }
    // mysvg = loadImage("");
}

function setup() {
    createCanvas(windowWidth, windowHeight);
}


function draw() {
    background(220);
    // image(mysvg, 0,0);
    let blob_state = blobs[blob_idx];
    if (blob_state == 'loading') {
        image(blob_imgs[blob_state],0,0,861,861);
    }
    else if (blob_state == 'listen') {
        image(mysvg, 75,17,247,332);
    }
    else {
        image(blob_imgs[blob_state],0,0,350,350);
    }

    noFill();
    stroke(0);
    strokeWeight(5);

    if (mypts.length > 2) {
        beginShape();

        var start_slope = (mypts[1][1]-mypts[0][1]) / (mypts[1][0]-mypts[0][0])
        var control_x = mypts[0][0] - 1;
        var control_y = mypts[0][1] - start_slope;
        curveVertex(control_x, control_y);

        for (let i=0; i<mypts.length; i++) {
            let pt = mypts[i];
            curveVertex(pt[0], pt[1]);
        }

        // for (let i=0; i<mypts.length; i++) {
        //     fill(255,0,0);
        //     ellipse(pt[0], pt[1], 5,5);
        //     noFill();
        // }

        var end_slope = (mypts.at(-2)[1]-mypts.at(-1)[1]) / (mypts.at(-2)[0]-mypts.at(-1)[0])
        var control_x = mypts.at(-1)[0] - 1;
        var control_y = mypts.at(-1)[1] - end_slope;
        curveVertex(control_x, control_y);
        endShape();
    }
}

function mousePressed() {
    mypts.push([mouseX,mouseY]);
    print(mouseX, mouseY);
    // print(mypts);
}

function keyTyped() {
    if (key == 's') {
        print("saving points!")
        saveStrings(mypts, blobs[blob_idx] + '.txt');
    }
}

function keyPressed() {
    if (keyCode === RIGHT_ARROW) {
        blob_idx++;
        blob_idx = blob_idx%blobs.length;
        mypts=[];
    }
}