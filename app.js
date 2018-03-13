const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext("webgl");

console.assert(gl != null, "Could not create gl context");

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
varying vec2 vUV;

int get(int x, int y){
  return int(texture2D(state, (gl_FragCoord.xy + vec2(x,y))/vec2(512,512)).r);
}

void main(){
  int sum = get(-1,-1) + get(-1,0) + get(-1,1) + get(0,-1) + get(0, 1) + get(1,-1) + get(1,0) + get(1,-1);

  if(sum == 3){
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  else if( sum == 2 ){
    float current = float(get(0,0));
    gl_FragColor = vec4(current, current, current, 1.0);
  }
  // else if(sum == 4){
  //   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  // }
  // else if(sum == 5){
  //   gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
  // }
  // else if(sum == 6){
  //   gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
  // }
  // else if(sum == 7){
  //   gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
  // }
  // else if(sum == 1){
  //   gl_FragColor = vec4(1.0, 0.5, 0.5, 1.0);
  // }
  // else if(sum == 0){
  //   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  // }
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



function generateRandomImage(p) {
  var prob = p || 0.5;
  var img = new Uint8Array(512 * 512 * 4);
  for (let i = 0; i < 512; i++) {
    const kk = (i * 512 * 4);
    for (let j = 0; j < 512; j++) {
      var val = Math.random() < prob? 0 : 1;
      var ii = j * 4;
      var fv = (val == 0 ? 0 : 255);
      img[kk + ii] = fv;
      img[kk + ii + 1] = fv;
      img[kk + ii + 2] = fv;
      img[kk + ii + 3] = 255;
    }
  }
  // var img1 = document.createElement("img");
  // var blob = new Blob( [ img ], { type: "image/jpeg" } );
  // var imgsrc = URL.createObjectURL(blob);
  // img1.src = imgsrc;
  // document.body.appendChild(img1);
  return img;
}


// Create textures
var tex1 = twgl.createTexture(gl, { src: generateRandomImage(0.2) });
var tex2 = twgl.createTexture(gl, { width: 512, height: 512 });

// Create Framebuffer
//var frameBuffer = twgl.createFramebufferInfo(gl, [{attachment : tex1}]);
var frameBuffer = gl.createFramebuffer();


function swap() {
  var temp = tex1;
  tex1 = tex2;
  tex2 = temp;
}

gl.viewport(0,0,512,512);


function render() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex2, 0);
  //gl.bindTexture(gl.TEXTURE_2D, tex1);
  gl.useProgram(proggol.program);
  gl.clear(gl.COLOR_BUFFER_BIT);
  twgl.setBuffersAndAttributes(gl, proggol, bufferInfo);
  twgl.setUniforms(proggol, { state: tex1 });
  twgl.drawBufferInfo(gl, bufferInfo);
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
