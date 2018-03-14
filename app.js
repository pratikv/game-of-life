const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext("webgl");

console.assert(gl != null, "Could not create gl context");

canvas.addEventListener("mousedown", function () {
  console.log(arguments);
})

canvas.addEventListener("mouseup", function () {
  console.log(arguments);
})

var scale = 4;
var stateSize = [512 / scale, 512 / scale];

const vsrc = `
attribute vec2 pos;
attribute vec2 a_uv;

varying vec2 vUV;

void main(){
  vUV = a_uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const fsrc = `
precision mediump float;

varying vec2 vUV;

void main(){
  gl_FragColor = vec4(1.0,1.0,0.0,1.0);
}
`;

const fsrc2 = `
precision mediump float;
uniform sampler2D tex;
varying vec2 vUV;

void main(){
  //gl_FragColor = vec4(0.0,1.0,1.0,1.0);//texture2D(tex, vUV);
  gl_FragColor = texture2D(tex, vUV);
}
`;

const golfsrc = `
precision mediump float;
uniform sampler2D state;
uniform vec2 scale;
varying vec2 vUV;

int get(int x, int y){
  return int(texture2D(state, (gl_FragCoord.xy + vec2(x,y))/scale).r);
}

void main(){
  int sum = get(-1,-1) + get(-1,0) + get(-1,1) + get(0,-1) + get(0, 1) + get(1,-1) + get(1,0) + get(1,1);

  if(sum == 3){
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
  else if( sum == 2 ){
    float current = float(get(0,0));
    gl_FragColor = vec4(current, 0.0, 0.0, 1.0);
  }
  else{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}

`;


gl.clearColor(0.0, 0.0, 0.0, 1.0);

var prog = twgl.createProgramInfo(gl, [vsrc, fsrc]);
var prog2 = twgl.createProgramInfo(gl, [vsrc, fsrc2]);
var proggol = twgl.createProgramInfo(gl, [vsrc, golfsrc]);


var arrays = {
  pos: { numComponents: 2, data: [-1, -1, 1, -1, 1, 1, -1, 1] },
  a_uv: { numComponents: 2, data: [0, 0, 1, 0, 1, 1, 0, 1] },
  indices: { numComponents: 3, data: [0, 1, 2, 2, 3, 0] }
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

function setAt(i, j, img, val) {
  const kk = (i * stateSize[1] * 4);
  var ii = j * 4;
  img[kk + ii] = val;
  img[kk + ii + 1] = 0;
  img[kk + ii + 2] = 0;
  img[kk + ii + 3] = 255;
}

var patters = [
  [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  [{ x: 6, y: 3 }, { x: 7, y: 2 }, { x: 7, y: 4 }, { x: 9, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 4 }],
  [{ x: 14, y: 4 }, { x: 15, y: 4 }, { x: 16, y: 4 }]
];

function generateKnownImage() {
  var img = new Uint8Array(stateSize[0] * stateSize[1] * 4);
  for (let i = 0; i < stateSize[0]; i++) {
    for (let j = 0; j < stateSize[1]; j++) {
      setAt(i, j, img, 0);
    }
  }

  // Create patterns
  patters.forEach(pattern => {
    pattern.forEach(pts => setAt(pts.x, pts.y, img, 255));
  });


  return img;
}

function generateRandomImage(p) {
  var prob = p || 0.5;
  var img = new Uint8Array(stateSize[0] * stateSize[1] * 4);
  for (let i = 0; i < stateSize[0]; i++) {
    //const kk = (i * stateSize[1] * 4);
    for (let j = 0; j < stateSize[1]; j++) {
      var val = Math.random() < prob ? 0 : 1;
      //var ii = j * 4;
      var fv = (val == 0 ? 0 : 255);
      setAt(i, j, img, fv);
    }
  }
  // var img1 = document.createElement("img");
  // var blob = new Blob( [ img ], { type: "image/jpeg" } );
  // var imgsrc = URL.createObjectURL(blob);
  // img1.src = imgsrc;
  // document.body.appendChild(img1);
  return img;
}

var d1 = generateRandomImage(0.8);
var d2 = generateKnownImage();

// Create textures
var tex1 = twgl.createTexture(gl, { src: d1, min: gl.NEAREST, mag: gl.NEAREST });
var tex2 = twgl.createTexture(gl, { width: stateSize[0], height: stateSize[1], min: gl.NEAREST, mag: gl.NEAREST });

// Create Framebuffer
//var frameBuffer = twgl.createFramebufferInfo(gl, [{attachment : tex1}]);
var frameBuffer = gl.createFramebuffer();


function swap() {
  var temp = tex1;
  tex1 = tex2;
  tex2 = temp;
}

gl.viewport(0, 0, stateSize[0], stateSize[1]);


function render() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex2, 0);
  //gl.bindTexture(gl.TEXTURE_2D, tex1);
  gl.useProgram(proggol.program);
  gl.clear(gl.COLOR_BUFFER_BIT);
  twgl.setBuffersAndAttributes(gl, proggol, bufferInfo);
  twgl.setUniforms(proggol, { state: tex1, scale: [stateSize[0], stateSize[1]] });
  twgl.drawBufferInfo(gl, bufferInfo);

  // Clear the framebuffer. Output to the default canvas
  twgl.bindFramebufferInfo(gl);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog2.program);
  twgl.setBuffersAndAttributes(gl, prog2, bufferInfo);
  twgl.setUniforms(prog2, { tex: tex2 });
  twgl.drawBufferInfo(gl, bufferInfo);
  swap();
  //requestAnimationFrame(render);
}
setInterval(render, 200);
//render();
