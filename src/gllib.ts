let gl:WebGLRenderingContext;
const debug = false;

const 
TEXTURE_2D = 0x0de1,
FRAMEBUFFER = 0x8d40,
RGBA = 0x1908,
ARRAY_BUFFER = 0x8892,
FRAGMENT_SHADER = 0x8b30,
VERTEX_SHADER = 0x8b31,
UNSIGNED_BYTE = 0x1401,
FLOAT = 0x1406,
TEXTURE_MIN_FILTER = 0x2801,
NEAREST = 0x2600,
COLOR_ATTACHMENT0 = 0x8ce0,
TRIANGLES = 0x0004,
TRIANGLE_FAN = 0x0006;

export function useGL(val:WebGLRenderingContext){
  gl = val;
}

export function createShader(mode:"v"|"f", header:string, body:string) {
  let src =
    `#version 300 es
precision highp float;
${header}
void main() {${body}}`;

  const shader = gl.createShader(mode=="v"?VERTEX_SHADER:FRAGMENT_SHADER);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (debug) {
    const e = gl.getShaderInfoLog(shader);
    console.log("shader:", e ? e + src : "OK");
  }

  return shader;
}

export function compileProgram(vs:WebGLProgram, fs:WebGLProgram) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  return program;
}

export function createTexture([width, height]:[number, number]) {
  const targetTexture = gl.createTexture();
  gl.bindTexture(TEXTURE_2D, targetTexture);

  gl.texImage2D(
    TEXTURE_2D,
    0,
    RGBA,
    width,
    height,
    0,
    RGBA,
    UNSIGNED_BYTE,
    null
  );

  gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);

  gl.bindTexture(TEXTURE_2D, null);

  return targetTexture;
}

export function createBuffer(targetTexture) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(FRAMEBUFFER, fb);

  gl.framebufferTexture2D(
    FRAMEBUFFER,
    COLOR_ATTACHMENT0,
    TEXTURE_2D,
    targetTexture,
    0
  );

  return fb;
}

export function draw(tex:WebGLTexture, buf?:WebGLFramebuffer) {
  gl.bindTexture(TEXTURE_2D, tex);
  gl.bindFramebuffer(FRAMEBUFFER, buf);
  gl.drawArrays(TRIANGLES, 0, 6);
}

export function uniforms(p:WebGLProgram) {
  const uniform = {};
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
    const info = gl.getActiveUniform(p, i);
    uniform[info.name] = gl.getUniformLocation(p, info.name);
  }
  return uniform;
}
