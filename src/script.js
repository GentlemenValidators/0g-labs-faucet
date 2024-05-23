var canvas = document.getElementById("canvas");
canvas.width = width = window.innerWidth;
canvas.height = height = window.innerHeight;
var ctx = canvas.getContext("2d");

var mouse = {x: 0, y: 0, click: false};

var camera = {rotX: -0.5, rotY: 0, zoom: 0};

var size = 500;
var cellSize = 20;

var objects = [{x: 0, y: 300, z: 0, radius: 100, color: "#ffae42"}];

var heights;
calculateHeights();

function calculateHeights() {
  heights = new Array(size * 2 / cellSize + 1);
  for (var i = 0; i < heights.length; i++) {
    heights[i] = new Array(size * 2 / cellSize + 1);
    for (var j = 0; j < heights[i].length; j++) {
      heights[i][j] = 0;
      for (var k = 0; k < objects.length; k++) {
        var o = objects[k];
        var x = i - size / cellSize - o.x / cellSize;
        var y = j - size / cellSize - o.z / cellSize;
        var h1 = Math.pow(2, -Math.pow(x / (8 * (1 + o.y / 1000)), 2));
        var h2 = Math.pow(2, -Math.pow(y / (8 * (1 + o.y / 1000)), 2));
        heights[i][j] += (o.y + 150) * h1 * h2;
      }
    }
  }
}

var selectedObject;
var lastSelectedObject;

loop();
function loop() {
  ctx.beginPath();
  ctx.fillStyle = "rgb(20, 20, 20)";
  ctx.fillRect(0, 0, width, height);
  
  ctx.beginPath();
  for (var z = -size; z < size; z += cellSize) {
    for (var x = -size; x < size; x += cellSize) {
      var h1 = heights[(x + size) / cellSize][(z + size) / cellSize];
      var h2 = heights[(x + cellSize + size) / cellSize][(z + size) / cellSize];
      var h3 = heights[(x + size) / cellSize][(z + cellSize + size) / cellSize];
      var h4 = heights[(x + cellSize + size) / cellSize][(z + cellSize + size) / cellSize];
      
      var p1 = td(x, h1, z);
      var p2 = td(x + cellSize, h2, z);
      var p3 = td(x, h3, z + cellSize);
      
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p3.x, p3.y);
    }
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  
  for (var i = 0; i < objects.length; i++) {
    var o = objects[i];
    var pos = td(o.x, o.y, o.z);
    var s = td(o.x + Math.cos(camera.rotY) * o.radius, o.y, o.z + Math.sin(camera.rotY) * o.radius);
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(1, s.x - pos.x), 0, Math.PI * 2);
    ctx.fillStyle = o.color;
    ctx.fill();
    
    if (o == selectedObject) {
      ctx.lineWidth = (s.x - pos.x) / 20;
      ctx.strokeStyle = "white";
      ctx.stroke();
      
      o.y = mouse.y;
    }
  }
  
  if (selectedObject)
    calculateHeights();
  
  camera.rotY += 0.003;
  
  requestAnimationFrame(loop);
}

document.onmousemove = function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  
  if (mouse.click) {
    camera.rotX -= e.movementY / 100;
    camera.rotY += e.movementX / 100;
  }
}

document.onmousedown = () => mouse.click = true;
document.onmouseup = () => {
  mouse.click = false;
  
  if (selectedObject) {
    selectedObject = undefined;
  }
  else {
    for (var i = 0; i < objects.length; i++) {
      var o = objects[i];
      var pos = td(o.x, o.y, o.z);
      var s = td(o.x + Math.cos(camera.rotY) * o.radius, o.y, o.z + Math.sin(camera.rotY) * o.radius);

      if (getDistance(mouse.x, mouse.y, pos.x, pos.y) < (s.x - pos.x)) {
        selectedObject = o;
        break;
      }
    }
  }
}

window.addEventListener('scroll', function() {
  camera.zoom = document.documentElement.scrollTop;
});

function td(x, y, z) {
  var rotMat = newRotationMat({x, y, z}, {x: camera.rotX, y: camera.rotY, z: 0});
  x = rotMat.x;
  y = rotMat.y;
  z = Math.min(rotMat.z - camera.zoom + 200, 500);
  var Z = 5 / (5 - z / 100);
  return {x: x * Z + width / 2, y: y * Z + height / 2};
}

function newRotationMat(a, b) {
  var mat = multiplyRotationMatrix(getXRotMat(b.x), multiplyRotationMatrix(getYRotMat(b.y), [[a.x], [a.y], [a.z]]));
  return {x: mat[0][0],
          y: mat[1][0],
          z: mat[2][0]};
}

function getXRotMat(rot) {
  return [[1, 0, 0], [0, Math.cos(rot), -Math.sin(rot)], [0, Math.sin(rot), Math.cos(rot)]];
}
function getYRotMat(rot) {
  return [[Math.cos(rot), 0, Math.sin(rot)], [0, 1, 0], [-Math.sin(rot), 0, Math.cos(rot)]];
}
function getZRotMat(rot) {
  return [[Math.cos(rot), -Math.sin(rot), 0], [Math.sin(rot), Math.cos(rot), 0], [0, 0, 1]];
}

function multiplyRotationMatrix(m1, m2) {
  return [[m1[0][0] * m2[0][0] + m1[0][1] * m2[1][0] + m1[0][2] * m2[2][0]],
          [m1[1][0] * m2[0][0] + m1[1][1] * m2[1][0] + m1[1][2] * m2[2][0]],
          [m1[2][0] * m2[0][0] + m1[2][1] * m2[1][0] + m1[2][2] * m2[2][0]]];
}
  
function getDistance(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

function requestToken() {
  const data = document.getElementById('tokenInput').value;
  // Example: Send data to a server to request a token
  console.log('Data submitted:', data);
  // Add your actual token request code here
}