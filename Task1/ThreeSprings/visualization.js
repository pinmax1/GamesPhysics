let ball;
let params = {
  mu: 140,
  mass: 1.0,
  k1: 0.1,
  k2: 0.1,
  k3: 0.1,
  l1: 100,
  l2: 100,
  l3: 100,
  g: 0.2,
  method: 'Verlet'
};

let sliders = {};
let anchor1, anchor2, anchor3; 
let sel, resetButton;
let origin;

function setup() {
  createCanvas(800, 600);
  origin = createVector(150, height - 100);
  updateAnchors();
  ball = new Ball(width / 2, height / 2);
  createUI();
}

function updateAnchors() {
  let angleRad = radians(params.mu);

  anchor1 = createVector(origin.x, origin.y - 200);
  
  let distance = 200;
  anchor2 = createVector(
    origin.x + distance * sin(angleRad) + 200,
    origin.y - distance * cos(angleRad) - 200
  );
  
  anchor3 = createVector(origin.x + 200, origin.y); 
}

function resetBall() {
  ball.pos.set(origin.x + 100, origin.y - 100);
  ball.vel.set(0, 0);
  ball.prevPos.set(origin.x + 100, origin.y - 100);
}

function draw() {
  background(240);
  
  // Update parameters
  params.mass = sliders.mass.value();
  params.k1 = sliders.k1.value();
  params.k2 = sliders.k2.value();
  params.k3 = sliders.k3.value();
  params.l1 = sliders.l1.value();
  params.l2 = sliders.l2.value();
  params.l3 = sliders.l3.value();

  updateAnchors();
  drawEnvironment();
  
  ball.update();
  ball.display();
  
  drawLabels();
}

class Ball {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.prevPos = createVector(x, y); 
    this.r = 15;
  }

  getAcc(p) {
    let f1 = p5.Vector.sub(anchor1, p);
    let d1 = f1.mag();
    f1.normalize().mult(params.k1 * (d1 - params.l1));

    let f2 = p5.Vector.sub(anchor2, p);
    let d2 = f2.mag();
    f2.normalize().mult(params.k2 * (d2 - params.l2));

    let f3 = p5.Vector.sub(anchor3, p);
    let d3 = f3.mag();
    f3.normalize().mult(params.k3 * (d3 - params.l3));

    let gravity = createVector(0, params.g * params.mass);
    return p5.Vector.add(f1, f2).add(f3).add(gravity).div(params.mass);
  }

  update() {
    if (mouseIsPressed && dist(mouseX, mouseY, this.pos.x, this.pos.y) < 50) {
      this.pos.set(mouseX, mouseY);
      this.vel.set(0, 0);
      this.prevPos.set(mouseX, mouseY);
      return;
    }

    let dt = 1.0; 

    if (params.method === 'Explicit Euler') {
      let a = this.getAcc(this.pos);
      this.pos.add(p5.Vector.mult(this.vel, dt));
      this.vel.add(p5.Vector.mult(a, dt));
    } 
    else if (params.method === 'Symplectic Euler') {
      let a = this.getAcc(this.pos);
      this.vel.add(p5.Vector.mult(a, dt));
      this.pos.add(p5.Vector.mult(this.vel, dt));
    } 
    else if (params.method === 'Verlet') {
      let a = this.getAcc(this.pos);
      let nextPos = p5.Vector.mult(this.pos, 2)
                    .sub(this.prevPos)
                    .add(p5.Vector.mult(a, dt * dt));
      this.prevPos = this.pos.copy();
      this.pos = nextPos;
      this.vel = p5.Vector.sub(this.pos, this.prevPos).div(dt);
    } 
    else if (params.method === 'Implicit') {
      let a1 = this.getAcc(this.pos);
      let v_pred = p5.Vector.add(this.vel, p5.Vector.mult(a1, dt));
      let p_pred = p5.Vector.add(this.pos, p5.Vector.mult(v_pred, dt));
      let a_corr = this.getAcc(p_pred);
      this.vel.add(p5.Vector.mult(a_corr, dt));
      this.pos.add(p5.Vector.mult(this.vel, dt));
    }
  }

  display() {
    this.drawSpring(anchor1, this.pos);
    this.drawSpring(anchor2, this.pos);
    this.drawSpring(anchor3, this.pos);
    
    fill(255, 100, 100);
    stroke(0);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);
  }

  drawSpring(start, end) {
    stroke(80); 
    strokeWeight(1.5); 
    noFill();
    beginShape();
    let segments = 15;
    for (let i = 0; i <= segments; i++) {
      let p = p5.Vector.lerp(start, end, i / segments);
      if (i > 0 && i < segments) {
        let diff = p5.Vector.sub(end, start);
        let perp = createVector(-diff.y, diff.x).normalize().mult(i % 2 === 0 ? 10 : -10);
        p.add(perp);
      }
      vertex(p.x, p.y);
    }
    endShape();
    fill(50);
    circle(start.x, start.y, 6);
  }
}

function drawEnvironment() {
  stroke(100);
  strokeWeight(5);
  
  line(origin.x, origin.y, origin.x, origin.y - 400);
  
  line(origin.x, origin.y, origin.x + 400, origin.y);
  
  wallLength = 100
  let angleRad = radians(params.mu);
  line(anchor2.x - wallLength * cos(angleRad), anchor2.y - wallLength * sin(angleRad), anchor2.x + wallLength * cos(angleRad), anchor2.y + wallLength * sin(angleRad))

  stroke(150);
  strokeWeight(1);
}

function createUI() {
  let x = 20, y = 20;
  sliders.mass = createSlider(0.5, 5, params.mass, 0.1).position(x, y + 40);
  sliders.k1 = createSlider(0.01, 0.5, params.k1, 0.01).position(x, y + 80);
  sliders.k2 = createSlider(0.01, 0.5, params.k2, 0.01).position(x, y + 120);
  sliders.k3 = createSlider(0.01, 0.5, params.k3, 0.01).position(x, y + 160);
  sliders.l1 = createSlider(50, 300, params.l1, 1).position(x, y + 200);
  sliders.l2 = createSlider(50, 300, params.l2, 1).position(x, y + 240);
  sliders.l3 = createSlider(50, 300, params.l3, 1).position(x, y + 280);
  
  sel = createSelect().position(x, y + 330).style('width', '140px');
  ['Explicit Euler', 'Symplectic Euler', 'Implicit', 'Verlet'].forEach(m => sel.option(m));
  sel.selected(params.method);
  sel.changed(() => params.method = sel.value());

  resetButton = createButton('Reset Position').position(x, y + 370);
  resetButton.mousePressed(resetBall);
}

function drawLabels() {
  fill(50); noStroke(); textSize(12);
  let x = 160;
  text(`Масса: ${params.mass}`, x, 75);
  text(`K1 (вертикаль): ${params.k1}`, x, 115);
  text(`K2 (точка в воздухе): ${params.k2}`, x, 155);
  text(`K3 (пол): ${params.k3}`, x, 195);
  text(`L1: ${params.l1}`, x, 235);
  text(`L2: ${params.l2}`, x, 275);
  text(`L3: ${params.l3}`, x, 315);
  
  fill(0);
  text(`МЕТОД: ${params.method}`, 20, 430);
}