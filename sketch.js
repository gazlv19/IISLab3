
let port;             
let shapes = [];      
let shapeNumber = 0;    

let corners = [];       
let trackPoints = []; 
let checkpoints = [];  
let nextCheckpoint = 0; 
let trail = [];       
let lastState = "";   
let finished = false;

let lineWidth = 60;    
let checkpointSpacing = 80; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);

  port = createSerial();
  let button = createButton("Connect ESP32");
  button.position(10, 10);
  button.mousePressed(connectToESP32);

  makeShapes();
  loadShape();
}

function connectToESP32() {
  if (!port.opened()) {
    port.open(115200);
  }
}

function makeShapes() {
  let circle = [];
  for (let a = 0; a <= 360; a += 20) {
    circle.push([0.5 - 0.4 * sin(a), 0.5 - 0.4 * cos(a)]);
  }

  shapes = [
    { name: "L", points: [[0.3, 0.1], [0.3, 0.9], [0.7, 0.9]] },
    { name: "7", points: [[0.2, 0.1], [0.8, 0.1], [0.4, 0.9]] },
    { name: "V", points: [[0.2, 0.1], [0.5, 0.9], [0.8, 0.1]] },
    { name: "Z", points: [[0.2, 0.1], [0.8, 0.1], [0.2, 0.9], [0.8, 0.9]] },
    { name: "O", points: circle },
    { name: "star", points: [[0.5, 0.05], [0.62, 0.38], [0.97, 0.38], [0.69, 0.6], [0.8, 0.93],
                              [0.5, 0.73], [0.2, 0.93], [0.31, 0.6], [0.03, 0.38], [0.38, 0.38], [0.5, 0.05]] }
  ];
}

function loadShape() {
  let size = min(width * 0.8, height * 0.7);
  let left = (width - size) / 2;
  let top = height * 0.15;

  corners = [];
  trackPoints = [];
  checkpoints = [];
  let points = shapes[shapeNumber].points;

  for (let i = 0; i < points.length; i++) {
    corners.push({ x: left + points[i][0] * size, y: top + points[i][1] * size });
  }

  for (let i = 0; i < corners.length - 1; i++) {
    for (let t = 0; t < 1; t += 0.05) {
      trackPoints.push({
        x: lerp(corners[i].x, corners[i + 1].x, t),
        y: lerp(corners[i].y, corners[i + 1].y, t)
      });
    }
  }

  checkpoints.push(corners[0]);
  for (let i = 0; i < corners.length - 1; i++) {
    let length = dist(corners[i].x, corners[i].y, corners[i + 1].x, corners[i + 1].y);
    let steps = max(1, round(length / checkpointSpacing));
    for (let s = 1; s <= steps; s++) {
      checkpoints.push({
        x: lerp(corners[i].x, corners[i + 1].x, s / steps),
        y: lerp(corners[i].y, corners[i + 1].y, s / steps)
      });
    }
  }

  nextCheckpoint = 0;
  trail = [];
  finished = false;
  sendState("S");
}

function onTheLine() {
  for (let i = 0; i < trackPoints.length; i++) {
    if (dist(mouseX, mouseY, trackPoints[i].x, trackPoints[i].y) < lineWidth / 2) {
      return true;
    }
  }
  return false;
}

function sendState(letter) {
  if (letter != lastState) {
    lastState = letter;
    if (port.opened()) {
      port.write(letter);
    }
  }
}

function sendEvent(letter) {
  if (port.opened()) {
    port.write(letter);
  }
}

function draw() {
  background(217, 236, 247);

  if (port.opened() && port.available() > 0) {
    let message = port.readUntil("\n");
    if (message.trim() == "N") {
      nextShape();
    }
  }

  if (!finished) {
    if (mouseIsPressed) {
      let isOn = onTheLine();
      trail.push({ x: mouseX, y: mouseY, on: isOn });

      if (isOn) {
        sendState("A");
      } else {
        sendState("B");
      }

      let c = checkpoints[nextCheckpoint];
      if (dist(mouseX, mouseY, c.x, c.y) < lineWidth * 0.8) {
        nextCheckpoint++;
        if (nextCheckpoint >= checkpoints.length) {
          finished = true;
          sendState("S");
          sendEvent("D");
        } else {
          sendEvent("C");
        }
      }
    } else {
      sendState("S");
    }
  }

 
  noStroke();
  fill(31, 78, 121);
  textSize(36);
  text("Trace the " + shapes[shapeNumber].name, width / 2, height * 0.08);

  stroke(255);
  strokeWeight(lineWidth);
  strokeCap(ROUND);
  for (let i = 0; i < corners.length - 1; i++) {
    line(corners[i].x, corners[i].y, corners[i + 1].x, corners[i + 1].y);
  }

  noStroke();
  for (let i = 0; i < checkpoints.length; i++) {
    if (i < nextCheckpoint) {
      fill(43, 182, 115);                       // done = green
      circle(checkpoints[i].x, checkpoints[i].y, 20);
    } else if (i == nextCheckpoint && !finished) {
      fill(242, 183, 5);                        // next = yellow, pulsing
      circle(checkpoints[i].x, checkpoints[i].y, 40 + 8 * sin(frameCount * 5));
    } else {
      fill(190, 210, 225);                      // later = grey
      circle(checkpoints[i].x, checkpoints[i].y, 12);
    }
  }

  for (let i = 0; i < trail.length; i++) {
    if (trail[i].on) {
      fill(43, 182, 115);
    } else {
      fill(229, 72, 77);
    }
    circle(trail[i].x, trail[i].y, 12);
  }

  fill(31, 78, 121);
  textSize(16);
  if (port.opened()) {
    text("ESP32 connected   |   Space = next shape, R = try again", width / 2, height - 25);
  } else {
    text("ESP32 not connected   |   Space = next shape, R = try again", width / 2, height - 25);
  }

  if (finished) {
    textSize(48);
    fill(43, 182, 115);
    text("Great job! Press space", width / 2, height / 2);
  }
}

function nextShape() {
  shapeNumber = (shapeNumber + 1) % shapes.length;
  loadShape();
}

function keyPressed() {
  if (key == " ") {
    nextShape();
  }
  if (key == "r") {
    loadShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  loadShape();
}
