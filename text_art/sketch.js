// https://www.mathiasbernhard.ch/ascii-art-with-p5js/

var cnv,img;
var resdiv;
var options = [' ','`','.',',-',"':",';_~','"','*|','!l',
'+=','>','<L','\\i','/^','1?','Jv','r','()cx','7}','sz',
'3u','2Ckty{','jn','4FVY','5P[]af','qw','Sde','Eo',
'NOZ','9HXgh','GTU','$AIm','QW','KM','L','#06@','bp',
'D','&','R','B'];
var gui,btn,livebtn; // buttons
var live = false;
var capture;
var pg;

function setup() {
  //paragraph for display of ascii result
  resdiv = createP('');
  
  //video capture elements
  pg = createGraphics(160,120);
  capture = createCapture(VIDEO);
  capture.size(80, 60);
  capture.hide();
  
  //gui elements
  btn = createButton('UPDATE');
  btn.mousePressed(calcCapture);
  gui = createDiv('');
  btn.parent(gui);
  livebtn = createButton('LIVE');
  livebtn.mousePressed(function(){live=!live;});
  livebtn.parent(gui);
  
  cnv = createCanvas(windowWidth,windowHeight);
  background(255);

  img = loadImage('shadows.png', function(pic){
    calcImg(pic);
  });
}

function draw() {
  // image(capture, 0, 0, width, height);
  // if (live) calcCapture();
}

function calcImg(pic) {
  var res = '<pre>';
  for (var i=0; i<600; i++) {
    var line = '';
    for (var j=0; j<14000; j++) {
      var x = pic.get(2+round(j*5.714),5+i*10);
      var v = round((1-x[0]/255.0)*40);
      var index = floor(random(options[v].length));
      var chr = options[v][index];
      if (chr==' ') chr='&nbsp;';
      if (chr=='<') chr='&lt;';
      if (chr=='>') chr='&gt;';
      if (chr=='"') chr='&quot;';
      line += chr;
    }
    res += line+'<br>';
  }
  res += '</pre>'
  resdiv.html(res);
}

function calcCapture() {
  pg.image(capture,0,0,80,60);
  var res = '<pre>';
  for (var i=0; i<60; i++) {
    var line = '';
    for (var j=0; j<140; j++) {
      var x = pg.get(round(j*1.143),i*2);
      var f = (1-x[0]/255.0);
      f = f*f; //square factor to lighten up, because less bright characters
      var v = round(f*40);
      var index = floor(random(options[v].length));
      var chr = options[v][index];
      if (chr==' ') chr='&nbsp;';
      if (chr=='<') chr='&lt;';
      if (chr=='>') chr='&gt;';
      if (chr=='"') chr='&quot;';
      line += chr;
    }

    res += line+'<br>';
  }
  res += '</pre>'
  resdiv.html(res);
}