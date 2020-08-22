window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
    camStart();
}
// 1. Just Palette - options screen for KScope mode (plain, shades 1 or shades 2, line width, blending, fading, perspective, rectangular, etc.
// 2. LineTo.  Options for random or shades, colours, style (vertical, mirrored etc.)
// Leave this one to Alphabet Paint 3. Filling in - options for picture set
// 3. Balls. Options: size, symetry, grid, perspective
// 4. circles, squares, options for size.
// 5. Painting with filling.
// 6. Full painting and options. 1. Paint, 2. Fill, 3. Stamps, 4. Symetry, 5. Colour style (solid, shades, alternate, etc), 6. Line width, 7. Line style (rectangular, vertical, horizontal, rotating line, line from start, etc), 8. Effects toggles (perspective, fading, blending, fun), 9. blank, 10. Clear
// Cursor style

// Override the function with all the posibilities
// navigator.getUserMedia ||
//     (navigator.getUserMedia = navigator.mozGetUserMedia ||
//     navigator.webkitGetUserMedia || navigator.msGetUserMedia);

var analyserContext = null;
var canvasWidth, canvasHeight;

var animation;
var canvas;
var canvas2;
var Param1 = 0.0;
var Param2 = 0.0;
var Param3 = 0.0;
var btnContext;
var index = 0;
var screenState = 0;
var splash;
var gobutton;
var button = [];
var kbutton = [];
var sbutton = [];
var lbutton = [];
var touches = [];
var pal = [];
var stamps = [];
var palette;
var toolbar;
var toolbar2;
var toolButtons = [];
var toolButtons2 = [];
var colocoSettings = [0,1,2,0,0,0,0,0, 1,2,2,0,0,0,0,0, 2,2,2,0,0,0,0,0, 2,1,2,0,0,0,1,0, 0,1,2,0,0,0,0,0, 0,1,2,0,0,0,0];
var btnBack;
var fun;
var doingFun = 0;
var fun1;
var fun2;
var fun3;
var settings;
var aspect;
var nAgt = navigator.userAgent;
var mouseX = 0.5;
var mouseY = 0.5;
var scale;
var update = 0;
var options;
var btnBlending;
var btnGrid;
var btnPerspective;
var btnFading;
var stampSet = -1;
var paintState = 0; // 0 = paintng, 1 = filling, 2 = stamping

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
      if (k.nodeType == 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "f") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "v") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
      return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var programsArray = new Array();
var current_program;

function initShaders() {
  programsArray.push(createProgram("shader-vs", "shader-1-fs"));
  current_program = programsArray[0];
}

function createProgram(vertexShaderId, fragmentShaderId) {
  var shaderProgram;
  var fragmentShader = getShader(gl, fragmentShaderId);
  var vertexShader = getShader(gl, vertexShaderId);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.resolutionUniform = gl.getUniformLocation(shaderProgram, "resolution");
  shaderProgram.mouse = gl.getUniformLocation(shaderProgram, "mouse");
  shaderProgram.mouse1 = gl.getUniformLocation(shaderProgram, "mouse1");
  shaderProgram.indexUniform = gl.getUniformLocation(shaderProgram, "index");
  shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
  shaderProgram.Param1 = gl.getUniformLocation(shaderProgram, "Param1");
  shaderProgram.Param2 = gl.getUniformLocation(shaderProgram, "Param2");
  shaderProgram.Param3 = gl.getUniformLocation(shaderProgram, "Param3");
  return shaderProgram;
}

var webcam;
var texture;

function initTexture() {
  texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

var ix = 0.0;
var end;
var st = new Date().getTime();
function setUniforms() {
  end = new Date().getTime();
  gl.uniformMatrix4fv(current_program.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(current_program.mvMatrixUniform, false, mvMatrix);
  gl.uniform2f(current_program.resolutionUniform, canvas2.width, canvas2.height);
  gl.uniform2f(current_program.mouse, mouseX, mouseY);
  // gl.uniform2f(current_program.mouse1, mouseX1, mouseY1);
  // gl.uniform1i(current_program.indexUniform, ix);
  gl.uniform1f(current_program.time, ((end-st) % 1000000)/1000.0);
  gl.uniform1f(current_program.Param1, Param1);
  gl.uniform1f(current_program.Param2, Param2);
  gl.uniform1f(current_program.Param3, Param3);
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
function initBuffers() {
  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  vertices = [-1.0, -1.0, 1.0, -1.0, 1.0,  1.0, -1.0,  1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 2;
  cubeVertexPositionBuffer.numItems = 4;

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0 ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 4;

  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [0, 1, 2,      0, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 6;
}

function drawScene() {
  gl.viewport(0, 0, canvas2.width, canvas2.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.BLEND);

  mat4.ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0, pMatrix);

  gl.useProgram(current_program);
  mat4.identity(mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(current_program.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(current_program.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.uniform1i(current_program.samplerUniform, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
}


var old_time = Date.now();

function tick() {
// 	if (touches.length == 0)
// 	{
// 		if (mouseState == 0) // nothing touching
//  		mouseX = -1.0;
// 		if (touchCount > 0) // ie just released
// 		    player.pause();
// 	}
// 	else if (touches.length == 1)
// 	{
// 		if (touchCount == 0) { // ie just touched
// 		 	 PlaySound(1);
//       	player.loop = true;
//       }
// 		mouseX = touches[0].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY = 1.0-touches[0].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;
//		mouseX1 = -1.0;
// 	}
// 	else if (touches.length >= 2)
// 	{
// 		mouseX = touches[0].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY = 1.0-touches[0].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;
//     mouseX1 = touches[1].clientX/canvas.scrollWidth; //] (mouseX + 7.0*touches/canvas.scrollWidth)/8.0;
//		mouseY1 = 1.0-touches[1].clientY/canvas.scrollHeight; //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0;

// 	}
// 	touchCount = touches.length;
  requestAnimFrame(tick);
  drawScene();
}

function webGLStart() {
  initShaders();
  initBuffers();
  initTexture();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

var redIncreasing = 1;
var greenIncreasing = 0;
var blueIncreasing = 1;
var red;
var green;
var blue;
function startShades()
{
	if (Math.random() > .5)
    redIncreasing = 1;
	else
	  redIncreasing = 0;
	if (Math.random() > .5)
    blueIncreasing = 1;
	else
	  blueIncreasing = 0;
	if (Math.random() > .5)
    greenIncreasing = 1;
	else
	  greenIncreasing = 0;
	red = Math.floor(Math.random() * 255);
	if (red == 1)
	  red = 2;
	green = Math.floor(Math.random() * 255);
	blue =  Math.floor(Math.random() * 255);
	return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

StoreValue = function (key, value) {
  if (window.localStorage) {
     window.localStorage.setItem(key, value);
  }
};

RetrieveValue = function(key, defaultValue) {
  var got;
  try {
   if (window.localStorage) {
     got = window.localStorage.getItem(key);
     if (got === 0) {
      return got;
     }
     if (got === "") {
      return got;
     }
     if (got) {
      return got;
     }
     return defaultValue;
   }
   return defaultValue;
  } catch (e) {
     return defaultValue;
  }
};

function LoadSettings() {
  if (nAgt.indexOf('Chrome') != -1) {
        chrome.storage.local.get('coloco2Settings', function (result) {
            if (result.colocoSettings == undefined)
              return;
            console.log(result.colocoSettings);
            colocoSettings = result.colocoSettings
        });
        for (var i = 0; i < 42; i++)
            colocoSettings[i] = parseInt(colocoSettings[i]);
  }
  else {
    for (var i = 0; i < 48; i++) {
    // StoreValue("Setting"+i, colocoSettings[i]);
      colocoSettings[i] = RetrieveValue("Setting"+i, colocoSettings[i]);
    }
  }
}

function SaveSettings() {
  if (nAgt.indexOf('Chrome') != -1) {
    chrome.storage.local.clear();
    chrome.storage.local.set({colocoSettings: colocoSettings}, function () {
    });
  }
  else {
    for (var i = 0; i < 48; i++)
     StoreValue("Setting"+i, colocoSettings[i]);
  }
}

function nextShade(f)
{
	if (redIncreasing == 1)
		red += f;
	else
		red -= f;
	if (red > 255) {
		redIncreasing = 0;
		red = 255;
	}
	if (red < 0) {
		redIncreasing = 1;
		red = 0;
	}
	if (blueIncreasing)
		blue += f;
	else
		blue -= f;
	if (blue > 255) {
		blueIncreasing = 0;
		blue = 255;
	}
	if (blue < 0) {
		blueIncreasing = 1;
		blue = 0;
	}
	if (greenIncreasing)
		green += f;
	else
		green -= f;
	if (green > 255) {
		greenIncreasing = 0;
		green = 255;
	}
	if (green < 0) {
		greenIncreasing = 1;
		green = 0;
	}
	if (red == 1)
	  red = 2;
	return 'rgb(' + red + ',' + green + ',' + blue + ')';
}

var lastColour = -1;
function NewBrightColor()
{
	var c;
	lastColour++;
	if (lastColour > 5)
		lastColour = 0;
	switch (lastColour)	{
	case 0:
		c = 'red';
		break;
	case 1:
		c = 'lime';
		break;
	case 2:
		c = 'blue';
		break;
	case 3:
    c = 'fuchsia';
		break;
	case 4:
    c = 'yellow';
		break;
	case 5:
    c = 'magenta';
		break;
	default:
	  c = 'white';
		break;
	}
	return(c);
}

var count = 0;
var current = 0;
var smoothMax = 0;
var scaleMax = 0;


function MonitorKeyUp(e) {
  if (!e) e=window.event;
    if (e.keyCode == 32 || e.keyCode == 49)
      Action(4);
    if (e.keyCode == 50)
		Action(2);
    if (e.keyCode == 51  || e.keyCode == 13)
		Action(3);
    if (e.keyCode == 52)
		Action(1);
   return false;
}

var mouseState = 0;

StoreValue = function (key, value) {
  if (window.localStorage) {
     window.localStorage.setItem(key, value);
  }
};

RetrieveValue = function(key, defaultValue) {
  var got;
  try {
   if (window.localStorage) {
     got = window.localStorage.getItem(key);
     if (got === 0) {
      return got;
     }
     if (got === "") {
      return got;
     }
     if (got) {
      return got;
     }
     return defaultValue;
   }
   return defaultValue;
  } catch (e) {
     return defaultValue;
  }
};

function WiggleButtons() {
  button[0].style.transform = "rotate(-2deg)";
  button[1].style.transform = "rotate(2deg)";
  button[2].style.transform = "rotate(2deg)";
  button[3].style.transform = "rotate(-2deg)";
  button[4].style.transform = "rotate(-2deg)";
  button[5].style.transform = "rotate(2deg)";
}

function back () {
  toolbar.hidden = true;
  toolbar2.hidden = true;
  btnBack.style.left = "2.5vw";
  btnBack.style.top = "3vh";
  palette.hidden = true;
  canvas.hidden = true;
  canvas2.hidden = true;
  fun1.hidden = true;
  fun2.hidden = true;
  fun3.hidden = true;
  if (screenState == 2) {
    fun.hidden = false;
    screenState = 1;
    gobutton.hidden = false;
    for (var i = 0; i < 5; i++) {
  	  kbutton[i].hidden = false;
    }
    if (index < 2 || index > 3)
      for (var i = 0; i < 3; i++) {
    	  sbutton[i].hidden = false;
      }
    for (var i = 0; i < 4; i++)
  	  lbutton[i].hidden = false;
  }
  else {
    fun.hidden = true;
//      splash.style.backgroundImage = "url('images/painting.jpg')";
    screenState = 0;
    splash.hidden = false;
    for (var i = 0; i < 5; i++)
      button[i].hidden = false;
    btnBack.hidden = true;
    splash.style.zIndex = 999;
  }
}

var done = 0;
function doneStart() {
  if (done == 1)
    return;
  done = 1;
  splash.style.backgroundImage="url(images/menu.jpg)";   splash.style.zIndex = 995; animation.hidden = true;
}

var doingFore = false;
function camStart() {
  animation  = document.querySelector('animation');
  splash  = document.querySelector('splash');
  btnContext  = document.querySelector('btnContext');
  palette  = document.querySelector('palette');
  toolbar  = document.querySelector('toolbar');
  toolbar2  = document.querySelector('toolbar2');
  settings  = document.querySelector('settings');
  gobutton  = document.querySelector('gobutton');
  options =  document.querySelector('optionsBox');
  btnFading =  document.querySelector('fading');
  btnPerspective =  document.querySelector('perspective');
  btnGrid =  document.querySelector('rectangular');
  btnBlending =  document.querySelector('blending');
  for (var i = 0; i < 6; i++) {
    button[i] = document.querySelector('button'+i);
    kbutton[i] = document.querySelector('kbutton'+i);
  }
  for (var i = 0; i < 3; i++) {
    sbutton[i] = document.querySelector('sbutton'+i);
  }
  for (var i = 0; i < 5; i++) {
    lbutton[i] = document.querySelector('lbutton'+i);
  }
  WiggleButtons();
  btnBack = document.querySelector('back');
  fun = document.querySelector('fun');
  fun1 = document.querySelector('fun1');
  fun2 = document.querySelector('fun2');
  fun3 = document.querySelector('fun3');
  canvas = document.getElementById("analyser");
  canvas.style.left = "8vw";
  canvas.style.width = "92vw";
  analyserContext = canvas.getContext('2d');
  canvas.style.backgroundColor = 'black';
//  LoadSettings();
  var t;
  t = window.setTimeout(function() { doneStart()}, 4500); // hide Splash screen after 2.5 seconds
  btnBack.onclick = function(e) {
    back();
  }
  splash.onclick = function(e) {
    window.clearTimeout(t);
    doneStart();
  }
  animation.onclick = function(e) {
    window.clearTimeout(t);
    doneStart();
  }

  btnFading.onclick = function(e) {
    fading = 1 - fading;
    if (fading == 1)
      btnFading.style.backgroundColor = 'darkblue';
    else
      btnFading.style.backgroundColor = 'black';
	  colocoSettings[index*8+3] = fading;
  }

  btnPerspective.onclick = function(e) {
    perspective = 1 - perspective;
    if (perspective == 1)
      btnPerspective.style.backgroundColor = 'darkblue';
    else
      btnPerspective.style.backgroundColor = 'black';
	  colocoSettings[index*8+4] = perspective;
  }

  btnBlending.onclick = function(e) {
    blending = 1 - blending;
    if (blending == 1)
      btnBlending.style.backgroundColor = 'darkblue';
    else
      btnBlending.style.backgroundColor = 'black';
	  colocoSettings[index*8+5] = blending;
  }

  btnGrid.onclick = function(e) {
    grid = 1 - grid;
      if (grid < 0)
          grid = 0;
      if (grid > 1)
          grid = 1;
    if (grid == 1)
      btnGrid.style.backgroundColor = 'darkblue';
    else
      btnGrid.style.backgroundColor = 'black';
	  colocoSettings[index*8+6] = grid;
      if (grid == 1)
          rectangular = 4;
      else
          rectangular = 0;
  }

  fun.onclick = function(e) {
    doingFun = 1 - doingFun;
    if (doingFun == 1)
      fun.style.backgroundColor = 'darkblue';
    else
      fun.style.backgroundColor = 'black';
	  colocoSettings[index*8+7] = doingFun;
  }

  fun1.onclick = function(e) {
    Param1++;
    if (Param1 > 4)
      Param1 = 0;
  }


  fun2.onclick = function(e) {
    Param2++;
    if (Param2 > 2)
      Param2 = 0;
  }

  fun3.onclick = function(e) {
    Param3++;
    if (Param3 > 1)
      Param3 = 0;
  }

  btnContext.onclick = function(e) {
    back();
  }

  for (var i = 0; i < 5; i++) {
 	  button[i].onmousedown = function(e) {
    	Action(parseInt(e.currentTarget.id));
    }
  }

  for (var i = 0; i < 3; i++) {
 	  sbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 3; j++)
 	      sbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
  	  changeColour = parseInt(e.currentTarget.id);
  	  colocoSettings[index*8] = changeColour;
 	  }
  }

  for (var i = 0; i < 5; i++) {
 	  kbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 5; j++)
 	      kbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
  	  mirrorStyle = parseInt(e.currentTarget.id);
  	  colocoSettings[index*8+1] = mirrorStyle;
 	  }
  }

  for (var i = 0; i < 4; i++)
 	  lbutton[i].onmousedown = function(e) {
 	    for (var j = 0; j < 4; j++)
 	      lbutton[j].style.backgroundColor = 'black';
 	    e.currentTarget.style.backgroundColor = 'darkblue';
    	lineWidth = parseInt(e.currentTarget.id)+1;
  	  colocoSettings[index*8+2] = lineWidth-1;
  }

  gobutton.onclick = function(e) {
    if (index > 3) {
      toolbar.hidden = false;
      if (index == 4) {
        toolButtons[0].hidden = false;
        toolButtons[1].hidden = false;
        toolButtons[9].hidden = false;
      }
     }

    btnBack.style.left = ".6vw";
    btnBack.style.top = "1vh";
    palette.hidden = false;
    if (index < 2 || index > 3)
      palette.style.backgroundColor = 'red';
    else
      palette.style.backgroundColor = 'black';

    currentColour = 'red';
    canvas.hidden = false;
    fun.hidden = true;
    if (doingFun == 1) {
 //     if (changeColour == 1 || changeColour == 2)
      fun2.hidden = false;
      fun3.hidden = false;
    }
    fun1.hidden = false;
    analyserContext.fillRect(0, 0, canvas.width, canvas.height);
    screenState = 2;
    gobutton.hidden = true;

    for (var i = 0; i < 5; i++) {
  	  button[i].hidden = true;
  	  kbutton[i].hidden = true;
    }
    for (var i = 0; i < 3; i++) {
  	  sbutton[i].hidden = true;
    }
    for (var i = 0; i < 4; i++)
  	  lbutton[i].hidden = true;
   canvas2.hidden = false;

   SaveSettings();

//  doImage();
  }
  canvas2 = document.getElementById("webgl-canvas");
  canvas2.style.left = "8vw";
  canvas2.style.width = "92vw";
  canvas2.style.height = "100vh";
//  canvas2.style.zOrder = 993;
  try {
      gl = canvas2.getContext("experimental-webgl");
  } catch (e) {
  }
  if (!gl) {
      alert("Could not initialise WebGL, sorry :-(");
  }
//  canvas2.style.backgroundImage = gobutton.style.backgroundImage;
  for (var i = 0; i < 10; i++) {
    pal[i] = document.createElement("BTN");
    pal[i].style.position = "absolute";
    pal[i].style.height = "9vh";
    pal[i].style.width = "6vw";
    pal[i].style.left = "-0.5vw";
    pal[i].style.top = 10 + i*9 +"vh";
    pal[i].style.borderStyle = 'groove';
    pal[i].style.backgroundSize = "95% 95%";
    palette.appendChild(pal[i]);
    pal[i].onclick = function (e) {
      palette.style.backgroundColor = e.currentTarget.style.backgroundColor;
      currentColour = e.currentTarget.style.backgroundColor;
      beginShades();
    }
    stamps[i] = document.createElement("BTN");
    stamps[i].style.position = "absolute";
    stamps[i].style.height = "9vh";
    stamps[i].style.width = "7.6vw";
    stamps[i].style.left = "0vw";
    stamps[i].style.top = 10 + i*9 +"vh";
    stamps[i].style.borderStyle = 'ridge';
    stamps[i].style.backgroundSize = "100% 100%";
    stamps[i].style.backgroundColor = 'black';
    stamps[i].hidden = true;
    stamps[i].index = i;
    palette.appendChild(stamps[i]);
    stamps[i].onclick = function (e) {
      if (stampSet >= 0 && e.currentTarget.index == 9) {
        stampSet = 1 - stampSet;
        for (var j = 0; j < 9; j++)
          stamps[j].style.backgroundImage = "url('images/FillShapes/" + (j+1 + (10*stampSet))  + ".png')";
        return;
      }

      if (index == 2)
        imageObj.src="images/Balls/" + (e.currentTarget.index+1) + ".png";
      else if (index == 3)
        imageObj.src="images/FillShapes/" + (e.currentTarget.index+1 +(10*stampSet)) + ".png";
      for (var j = 0; j < 10; j++)
        stamps[j].style.backgroundColor = 'black';
      stamps[e.currentTarget.index].style.backgroundColor = 'darkblue';
    }
    stamps[0].style.backgroundColor = 'darkblue';

    toolButtons[i] = document.createElement("BTN");
    toolButtons[i].style.position = "absolute";
    toolButtons[i].style.height = "10vh";
    toolButtons[i].style.width = "7.5vw";
    toolButtons[i].style.left = "0vw";
    toolButtons[i].style.top = i*10 +"vh";
    toolButtons[i].style.borderStyle = 'groove';
    toolButtons[i].style.backgroundSize = "100% 100%";
    toolButtons[i].hidden = true;
    toolButtons[i].style.backgroundColor = 'black';
    toolButtons[i].index = i;

    toolbar.appendChild(toolButtons[i]);
    toolButtons[i].onclick = function (e) {
      if (e.currentTarget.index < 4) {
         toolButtons[0].style.backgroundColor = 'black';
         toolButtons[1].style.backgroundColor = 'black';
         toolButtons[e.currentTarget.index].style.backgroundColor = 'darkblue';
      }
      if (e.currentTarget.index == 0)
        paintStyle = 0;
      else if (e.currentTarget.index == 1)
        paintStyle = 1;
      else if (e.currentTarget.index == 9)
        analyserContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    toolButtons2[i] = document.createElement("BTN");
    toolButtons2[i].style.position = "absolute";
    toolButtons2[i].style.height = "10vh";
    toolButtons2[i].style.width = "7.5vw";
    toolButtons2[i].style.left = "0vw";
    toolButtons2[i].style.top = i*10 +"vh";
    toolButtons2[i].style.borderStyle = 'groove';
    toolButtons2[i].style.backgroundSize = "100% 100%";
    toolButtons2[i].hidden = true;
    toolButtons2[i].style.backgroundColor = 'black';
    toolButtons2[i].index = i;

    toolbar2.appendChild(toolButtons2[i]);
    toolButtons2[i].onclick = function (e) {
    }
  }
  toolButtons[0].style.backgroundImage = "url('images/painting.png')";
  toolButtons[0].style.backgroundColor = 'darkblue';
  toolButtons[1].style.backgroundImage = "url('images/filling.png')";
  toolButtons[9].style.backgroundImage = "url('images/clear.png')";

  setPaletteColours();
  palette.style.backgroundColor = 'black';

  webGLStart();
}

function setPaletteColours() {
  pal[0].style.backgroundColor = 'white';
  pal[1].style.backgroundColor = 'red';
  pal[2].style.backgroundColor = 'green';
  pal[3].style.backgroundColor = 'blue';
  pal[4].style.backgroundColor = 'yellow';
  pal[5].style.backgroundColor = 'cyan';
  pal[6].style.backgroundColor = 'magenta';
  pal[7].style.backgroundColor = 'teal';
  pal[8].style.backgroundColor = 'orange';
  pal[9].style.backgroundColor = 'rgb(1,0,0)';
}

function beginShades() {
    var c = tinycolor(palette.style.backgroundColor).toRgb();
    currentColour = palette.style.backgroundColor;
    red = c.r;
    green = c.g;
    blue = c.b;
    if (red > 128)
      redIncreasing = 0;
    else
      redIncreasing = 1;
    if (blue > 128)
      blueIncreasing = 01;
    else
      blueIncreasing = 1;
    if (green > 128)
      greenIncreasing = 1;
    else
      greenIncreasing = 0;

}

var previousX = 0;
var previousY = 0;
var mirrorStyle = 0;
var perspective = 0;
var lineWidth = 4;
var wiggleLineWidth = 0;
var blending = 0; // context.globalCompositeOperation = "multiply"; etc
var shape = 0; // 0: line, 1: fan, 2: stripey line, 3: altenative invert, 4: circles, 5: '+'s, 6: rectangles
var fading = 0; // dim the picture to date whenever the mouse moves
var changeColour = 0; // 0: fixed, 3: click, 4: timed, 1: shades, 2: shades 2, 5: random
var rectangular = 0; // 0: normal, 1: vertical, 2: horizontal, 3: grid, 4: horizontal or vertical
var grid = 0;
var shaderEffects = 0;
var currentColour = 'white';
var stripey = 1; // 0: normal, 1: stripes, 2: boxes

function floodfill_hexToR(h) {
    return parseInt(h.substring(0,2),16)
}
function floodfill_hexToG(h) {
    return parseInt(h.substring(2,4),16)
}
function floodfill_hexToB(h) {
    return parseInt(h.substring(4,6),16)
}

var imageData;
var startR;
var startG;
var startB;

function floodfill_matchTolerance(pixelPos,color,tolerance){
    var rMax = startR + (startR * (tolerance / 100));
    var gMax = startG + (startG * (tolerance / 100));
    var bMax = startB + (startB * (tolerance / 100));

    var rMin = startR - (startR * (tolerance / 100));
    var gMin = startG - (startG * (tolerance / 100));
    var bMin = startB - (startB * (tolerance / 100));

    var r = imageData.data[pixelPos];
    var g = imageData.data[pixelPos+1];
    var b = imageData.data[pixelPos+2];

    return ((
        (r >= rMin && r <= rMax)
        && (g >= gMin && g <= gMax)
        && (b >= bMin && b <= bMax)
        )
        && !(r == color.r
        && g == color.g
        && b == color.b)
        );
}

function floodfill_colorPixel(pixelPos,color){
  imageData.data[pixelPos] = color.r;
  imageData.data[pixelPos+1] = color.g;
  imageData.data[pixelPos+2] = color.b;
  imageData.data[pixelPos+3] = 255;
}

function floodFill(x,y,context,color,tolerance){
   pixelStack = [[x,y]];
   width = context.canvas.width;
   height = context.canvas.height;
   pixelPos = (y*width + x) * 4;
   imageData =  context.getImageData(0, 0, width, height);
   startR = imageData.data[pixelPos];
   startG = imageData.data[pixelPos+1];
   startB = imageData.data[pixelPos+2];
   while(pixelStack.length){
      newPos = pixelStack.pop();
      x = newPos[0];
      y = newPos[1];
      pixelPos = (y*width + x) * 4;
      while(y-- >= 0 && floodfill_matchTolerance(pixelPos,color,tolerance)){
        pixelPos -= width * 4;
      }
      pixelPos += width * 4;
      ++y;
      reachLeft = false;
      reachRight = false;
      while(y++ < height-1 && floodfill_matchTolerance(pixelPos,color,tolerance)){
        floodfill_colorPixel(pixelPos,color);
        if(x > 0){
          if(floodfill_matchTolerance(pixelPos - 4,color,tolerance)) {
            if(!reachLeft){
              pixelStack.push([x - 1, y]);
              reachLeft = true;
            }
          }
          else if(reachLeft){
            reachLeft = false;
          }
        }
        if(x < width-1){
          if(floodfill_matchTolerance(pixelPos + 4,color,tolerance)){
            if(!reachRight){
              pixelStack.push([x + 1, y]);
              reachRight = true;
            }
          }
          else if(floodfill_matchTolerance(pixelPos + 4 -(width *4),color,tolerance)) {
            if(!reachLeft){
              pixelStack.push([x + 1, y - 1]);
              reachLeft = true;
            }
          }
          else if(reachRight){
            reachRight = false;
          }
        }
        pixelPos += width * 4;
      }
    }
    context.putImageData(imageData, 0, 0);
}

function drawPoint(x,y) {
  var w;
  previousX = x;
  previousY = y;
  if (paintStyle == 1) { //filling
    var color = tinycolor(currentColour).toRgb();
    floodFill(Math.floor(x),Math.floor(y),analyserContext,color,1);
    return;
  }
  else if (paintStyle == 2) { // stamping
    doStamp();
    return;
  }
  switch (stripey) {
    case 0:
      analyserContext.lineCap = 'round';
      break;
    case 1:
      analyserContext.lineCap = 'butt';
      break;
    case 2:
      analyserContext.lineCap = 'square';
      break;
  }
  w = 1000/((5-lineWidth)*20);
 	if (perspective == 1) {
			w /= (y + 1) / canvas.scrollHeight;
  		w = Math.min (w, canvas.scrollHeight/5);
  }
  analyserContext.lineWidth = w;
  if (blending == 1)
    analyserContext.globalCompositeOperation = "lighten";
  else
    analyserContext.globalCompositeOperation = "source-over";
  switch (rectangular) {
    case 1:
      break;
    case 2:
      break;
    case 3:
      x -= x % 50;
      y -= y % 50;
      break;
    case 4:
      break;
  }
  switch (changeColour) {
    case 0:
      break;
    case 1:
     beginShades();
      break;
    case 2:
     beginShades();
      break;
    case 3:
//      currentColour = NewBrightColor();
      break;
    case 4:
      function colourChange() {
        if (changeColour == 4)
          currentColour = NewBrightColor();
          setTimeout(colourChange, 2000);
      }
      colourChange();
      break;
    case 5:
      currentColour = NewBrightColor();
      break;
  }

  analyserContext.strokeStyle = currentColour;
  analyserContext.beginPath();
  analyserContext.moveTo(x,y);
  analyserContext.lineTo(x+.001,y);

  switch (mirrorStyle) {
    case 1:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
      break;
    case 2:
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
      break;
    case 3:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
        analyserContext.moveTo(canvas.width-x,canvas.height-y);
        analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);
      break;
    case 4:
        analyserContext.moveTo(canvas.width-x,y);
        analyserContext.lineTo(canvas.width-x-0.01,y);
        analyserContext.moveTo(x,canvas.height-y);
        analyserContext.lineTo(x-0.01,canvas.height-y);
        analyserContext.moveTo(canvas.width-x,canvas.height-y);
        analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);

        analyserContext.moveTo(y,x);
        analyserContext.lineTo(y-0.01,x);
        analyserContext.moveTo(canvas.width-y,x);
        analyserContext.lineTo(canvas.width-y-0.01,x);
        analyserContext.moveTo(y,canvas.height-x);
        analyserContext.lineTo(y-0.01,canvas.height-x);
        analyserContext.moveTo(canvas.width-y,canvas.height-x);
        analyserContext.lineTo(canvas.width-y-0.01,canvas.height-x);
        break;
  }
  analyserContext.stroke();
//  doImage();
}


function drawLine(x,y) {
  if (paintStyle == 1) // filling
    return;
  if (fading  == 1) {
    analyserContext.globalAlpha=0.02;
    analyserContext.fillRect(0, 0, canvas.width, canvas.height);
    analyserContext.globalAlpha=1.00;
  }
  //y = 1000-y; // Changed PB 15/2/18 Changed again 6/10/18
  if (paintStyle == 2) {
    doStamp();
    return;
  }
  switch (rectangular) {
    case 3:
      previousY = 1000;
      previouxX = x;
      break;
    case 2:
      previousX = 0;
      previousY = y;
      break;
    case 4:
      x -= x % 50;
      y -= y % 50;
      break;
    case 1:
      if (Math.abs(x-previousX) < Math.abs(y-previousY))
        x=previousX;
      else
        y=previousY;
      break;
  }
  var w = 1000/((5-lineWidth)*20);
  switch (changeColour) {
    case 1:
      currentColour = nextShade(2);
      break;
    case 2:
      currentColour = nextShade(8);
      break;
    case 5:
      currentColour = NewBrightColor();
      break;
  }

  if (perspective == 1) {
  		w /= (y + 1) / canvas.scrollHeight;
  		w = Math.min (w, canvas.scrollHeight/5);
  }
  if (wiggleLineWidth == 1)
   w *= 1+Math.random()/3;
  analyserContext.lineWidth = w;
  analyserContext.strokeStyle = currentColour;
  analyserContext.beginPath();
  analyserContext.moveTo(previousX,previousY);
  analyserContext.lineTo(x,y);

  switch (mirrorStyle) {
    case 1:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
      break;
    case 2:
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
      break;
    case 3:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
        analyserContext.moveTo(canvas.width-previousX,canvas.height-previousY);
        analyserContext.lineTo(canvas.width-x,canvas.height-y);
      break;
    case 4:
        analyserContext.moveTo(canvas.width-previousX,previousY);
        analyserContext.lineTo(canvas.width-x,y);
        analyserContext.moveTo(previousX,canvas.height-previousY);
        analyserContext.lineTo(x,canvas.height-y);
        analyserContext.moveTo(canvas.width-previousX,canvas.height-previousY);
        analyserContext.lineTo(canvas.width-x,canvas.height-y);

        analyserContext.moveTo(previousY,previousX);
        analyserContext.lineTo(y,x);
        analyserContext.moveTo(canvas.width-previousY,previousX);
        analyserContext.lineTo(canvas.width-y,x);
        analyserContext.moveTo(previousY,canvas.height-previousX);
        analyserContext.lineTo(y,canvas.height-x);
        analyserContext.moveTo(canvas.width-previousY,canvas.height-previousX);
        analyserContext.lineTo(canvas.width-y,canvas.height-x);
        break;
  }
  if (stripey > 0) {
      for (var i = 0; i < 2; i++) {
        analyserContext.stroke();
        analyserContext.lineWidth *= .6;
        if (i == 0)
          analyserContext.strokeStyle = 'darkgrey';
        else
          analyserContext.strokeStyle = currentColour;
        switch (mirrorStyle) {
        case 1:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
          break;
        case 2:
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
          break;
        case 3:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
            analyserContext.moveTo(canvas.width-x,canvas.height-y);
            analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);
          break;
        case 4:
            analyserContext.moveTo(canvas.width-x,y);
            analyserContext.lineTo(canvas.width-x-0.01,y);
            analyserContext.moveTo(x,canvas.height-y);
            analyserContext.lineTo(x-0.01,canvas.height-y);
            analyserContext.moveTo(canvas.width-x,canvas.height-y);
            analyserContext.lineTo(canvas.width-x-0.01,canvas.height-y);

            analyserContext.moveTo(y,x);
            analyserContext.lineTo(y-0.01,x);
            analyserContext.moveTo(canvas.width-y,x);
            analyserContext.lineTo(canvas.width-y-0.01,x);
            analyserContext.moveTo(y,canvas.height-x);
            analyserContext.lineTo(y-0.01,canvas.height-x);
            analyserContext.moveTo(canvas.width-y,canvas.height-x);
            analyserContext.lineTo(canvas.width-y-0.01,canvas.height-x);
            break;
      }
    }
  }
  analyserContext.stroke();
//  doImage();
  if (index != 1) {
    previousX = x;
    previousY = y;
  }
//  Param1 = 1.0;
}


function doStamp() {
  if (index == 2 || index == 3) {
   var x1 = 1000 * mouseX;
   var y1 = 1000* mouseY;
   var w;
   switch (lineWidth) {
     case 1:
       w = 20;
       break;
      case 2:
        w = 12;
        break;
      case 3:
        w = 9;
        break;
      case 4:
        w = 6;
        break;
   }
   if (perspective == 1) {
     w /=  (1000-y1) / canvas.scrollHeight;
     w = Math.min (w/2, 100);
   }
   var x2 = canvas.width/w;
   var y2 = canvas.height/w;
	 if (grid == 1) {
    x1 -= x1 % x2;
    y1 -= y1 % y2;
   }
   else {
     x1 -= x2/2;
     y1 -= y2/2;
   }

    analyserContext.save();
    analyserContext.scale(1,-1);
    if (blending == 1)
      analyserContext.globalAlpha = 0.2;

    analyserContext.drawImage(imageObj, x1, -y1-y2, x2, y2);
    switch (mirrorStyle) {
    case 1:
        analyserContext.drawImage(imageObj, canvas.width - x1 - x2, -y1-y2, x2, y2);
      break;
    case 2:
        analyserContext.drawImage(imageObj, x1, -canvas.height+y1, x2, y2);
      break;
    case 3:
        analyserContext.drawImage(imageObj, canvas.width - x1 - x2, -y1-y2, x2, y2);
        analyserContext.drawImage(imageObj, x1, -canvas.height+y1, x2, y2);
        analyserContext.drawImage(imageObj, canvas.width - x1 - x2, -canvas.height+y1, x2, y2);
      break;
    case 4:
        analyserContext.drawImage(imageObj, canvas.width - x1 - x2, -y1-y2, x2, y2);
        analyserContext.drawImage(imageObj, x1, -canvas.height+y1, x2, y2);
        analyserContext.drawImage(imageObj, canvas.width - x1 - x2, -canvas.height+y1, x2, y2);

        analyserContext.drawImage(imageObj, y1, -x1-x2, x2, y2);
        analyserContext.drawImage(imageObj, y1, -canvas.height + x1, x2, y2);
        analyserContext.drawImage(imageObj, canvas.width - y1-y2, -x1-x2, x2, y2);
        analyserContext.drawImage(imageObj, canvas.width - y1-y2, -canvas.height + x1, x2, y2);

        break;
    }
    analyserContext.restore();
  }
}

var imageObj = new Image();
function doImage() {
  // if (index == 2) {
  //   analyserContext.save();
  //   analyserContext.scale(1,-1);
  //   analyserContext.drawImage(imageObj, 0, -canvas.height, canvas.width, canvas.height);
  //   analyserContext.restore();
  // }

}

function loadBackground() {
//  imageObj.style.backgroundImage = "url('images/menu.jpg')"; //"url('images/1/a.png')";
        imageObj.src='images/Balls/1.png';
}

function loadStamp(s) {
    imageObj.src=s;
}

function Action(i){
//  var img = "url(images/" + i + ".png)";

  btnContext.style.backgroundImage="url(images/" + (i+1) + ".png)";
  btnContext.style.backgroundColor = 'white';
  fun.hidden = false;
  if (i < 4) {
    canvas.style.width = "92vw";
    canvas2.style.width = "92vw";
  }
  else {
    canvas.style.width = "84vw";
    canvas2.style.width = "84vw";
  }
  changeColour = 3;
  for (var j = 0; j < 3; j++)
    sbutton[j].style.backgroundColor = 'black';
  sbutton[colocoSettings[i*8]].style.backgroundColor = 'darkblue';
  changeColour = colocoSettings[i*8];
  for (var j = 0; j < 5; j++)
    kbutton[j].style.backgroundColor = 'black';
  kbutton[colocoSettings[i*8+1]].style.backgroundColor = 'darkblue';
  mirrorStyle = colocoSettings[i*8+1];
  for (var j = 0; j < 4; j++)
    lbutton[j].style.backgroundColor = 'black';
  lbutton[colocoSettings[i*8+2]].style.backgroundColor = 'darkblue';
  lineWidth = colocoSettings[i*8+2] + 1;
  fading = colocoSettings[i*8+3];
  perspective = colocoSettings[i*8+4];
  blending = colocoSettings[i*8+5];
  grid = colocoSettings[i*8+6];
  doingFun = colocoSettings[i*8+7];
  btnFading.style.backgroundColor = 'black';
  btnPerspective.style.backgroundColor = 'black';
  btnBlending.style.backgroundColor = 'black';
  btnGrid.style.backgroundColor = 'black';
  fun.style.backgroundColor = 'black';
  if (fading == 1)
    btnFading.style.backgroundColor = 'darkblue';
  if (perspective == 1)
    btnPerspective.style.backgroundColor = 'darkblue';
  if (blending == 1)
    btnBlending.style.backgroundColor = 'darkblue';
  if (grid == 1) {
    btnGrid.style.backgroundColor = 'darkblue';
    rectangular = 4;
    }
  if (doingFun == 1)
    fun.style.backgroundColor = 'darkblue';
  palette.style.backgroundColor = 'black';
  if (i < 2 || i > 3) { // setting screen for palette
      paintStyle = 0;
      palette.style.backgroundColor = 'green';
      for (var j = 0; j < 10; j++) {
        pal[j].hidden = false;
        stamps[j].hidden = true;
      }
      for (var j = 0; j < 3; j++)
        sbutton[j].hidden = false;
     options.style.left = "56vw";
     options.style.top = "15vh";
     options.style.height = "28vh";
     options.style.width = "24vw";
     options.style.backgroundSize = "24vw 28vh";
     btnFading.style.top = "18vh";
     btnPerspective.style.top = "18vh";
     btnGrid.style.top = "30vh";
     btnBlending.style.top = "30vh";
     btnFading.style.left = "69vw";
     btnPerspective.style.left = "57vw";
     btnBlending.style.left = "57vw";
     btnGrid.style.left = "69vw";
     if (i == 5) {
      btnGrid.hidden = true;
      btnBlending.style.left = "63vw";
     }
  }
  else if (i == 2 || i == 3) { // settings for balls and stamps
      paintStyle = 2;
      if (i == 2) {
        stampSet = -1;
        imageObj.src='images/Balls/1.png';
      }
      else {
        stampSet = 0;
        imageObj.src='images/FillShapes/1.png';
      }
     for (var j = 0; j < 10; j++) {
        pal[j].hidden = true;
        if (i == 2) {
          stamps[j].style.backgroundImage = "url('images/Balls/" + (j+1) + ".png')";
        }
        else {
          stamps[j].style.backgroundImage = "url('images/FillShapes/" + (j+1) + ".png')";
        }
        stamps[j].hidden = false;
     }
     options.style.left = "21vw";
     options.style.top = "27vh";
     options.style.height = "15vh";
     options.style.width = "58vw";
     options.style.backgroundSize = "58vw 15vh";
     btnFading.style.top = "30vh";
     btnPerspective.style.top = "30vh";
     btnGrid.style.top = "30vh";
     btnBlending.style.top = "30vh";
     btnFading.style.left = "52vw";
     btnPerspective.style.left = "25vw";
     btnGrid.style.left = "38vw";
     btnBlending.style.left = "65vw";

     for (var j = 0; j < 3; j++)
        sbutton[j].hidden = true;
  }
 //  if (i < 4) {
  screenState = 1;
//  splash.hidden = true;
  splash.style.backgroundImage = "url('images/menu.jpg')";
  splash.style.zIndex = 991;
//  }
  index = i;
  analyserContext.fillStyle = 'black';
//  if (index == 2 || index == 3)
//   analyserContext.fillStyle = 'white';
  analyserContext.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < 5; i++)
    button[i].hidden = true;
  btnBack.hidden = false;
//  if (index == 4)
//    stripey = 1;
//  else if (index == 5)
//    stripey = 2;
//  else stripey = 0;
stripey = 0;
  aspect = canvasHeight/canvasWidth;
  canvas2.onkeyup = MonitorKeyUp;
  canvas2.onmousedown = function(e) {
    if ( i < 4)
  		mouseX = e.clientX/canvas2.scrollWidth - 0.088;
		else
  		mouseX = e.clientX/canvas2.scrollWidth - 0.096;
 		mouseY = 1.0-e.clientY/canvas2.scrollHeight;
    drawPoint(1000*mouseX,1000*mouseY);
    mouseState = 1;
  }
  canvas2.onmousemove = function(e) {
    if ( i < 4)
  		mouseX = e.clientX/canvas2.scrollWidth - 0.088;
		else
  		mouseX = e.clientX/canvas2.scrollWidth - 0.096;
 		mouseY = 1.0-e.clientY/canvas2.scrollHeight;
    if (mouseState == 1)
      drawLine(1000*mouseX,1000*mouseY);
  }
  canvas2.onmouseup = function(e) {
    mouseState = 0;
//    doImage();
  }
  canvas2.onmouseleave = function(e) {
    mouseState = 0;
  }

	canvas2.addEventListener('touchmove', function(event) {
      event.preventDefault();
      if (i < 4)
    		mouseX = event.touches[0].clientX/canvas.scrollWidth - 0.088;
      else
    		mouseX = event.touches[0].clientX/canvas.scrollWidth - 0.096;
   		    mouseY = 1.0-event.touches[0].clientY/canvas.scrollHeight;
			if (event.touches.length == 1) {
			  if (i < 4) // parenthesese added PB 15/2/18
			    drawLine(1000*(event.touches[0].clientX/canvas.scrollWidth-0.088),1000*event.touches[0].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
              else
			    drawLine(1000*(event.touches[0].clientX/canvas.scrollWidth-0.096),1000*event.touches[0].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
			}
			else if (event.touches.length > 1) {
			  previousX = 1000*mouseX;
			  previousY = 1000*mouseY;
			  if (i < 4) // parenthesese added PB 15/2/18
			    drawLine(1000*(event.touches[1].clientX/canvas.scrollWidth-0.088),1000*event.touches[0].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
              else
			    drawLine(1000*(event.touches[1].clientX/canvas.scrollWidth-0.096),1000*event.touches[0].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
			}
  }, false);
  canvas2.addEventListener('touchstart', function(event) {
    event.preventDefault();
    if (i < 4)
  		mouseX = event.touches[0].clientX/canvas.scrollWidth-0.088;
  	else
  		mouseX = event.touches[0].clientX/canvas.scrollWidth-0.096;
 		mouseY = 1.0-event.touches[0].clientY/canvas.scrollHeight;
		if (event.touches.length == 1)
		  drawPoint(1000*mouseX,1000*mouseY); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
		else if (event.touches.length > 1) {
		  previousX = 1000*mouseX;
		  previousY = 1000*mouseY;
		  drawLine(1000*event.touches[1].clientX/canvas.scrollWidth,1000*event.touches[1].clientY/canvas.scrollHeight); //(mouseY + 7.0*(1.0 - e.clientY/canvas.scrollHeight))/8.0);
		}

    mouseState = 1;
  }, false);
  canvas2.addEventListener('touchend', function(event) {
    event.preventDefault();
	  mouseState = 0;
    doImage();
  }, false);
  canvas2.addEventListener('touchleave', function(event) {
    event.preventDefault();
		mouseState = 0;
    doImage();
  }, false);
}
