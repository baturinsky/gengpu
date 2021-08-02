export let gl: WebGL2RenderingContext;
const debug = true;

export const
  TEXTURE_2D = 0x0de1,
  FRAMEBUFFER = 0x8d40,
  RGBA = 0x1908,
  ARRAY_BUFFER = 0x8892,
  FRAGMENT_SHADER = 0x8b30,
  VERTEX_SHADER = 0x8b31,
  UNSIGNED_BYTE = 0x1401,
  INT = 0x1404,
  UNSIGNED_INT = 0x1405,
  FLOAT = 0x1406,
  SAMPLER_2D = 0x8B5E,
  TEXTURE_MIN_FILTER = 0x2801,
  NEAREST = 0x2600,
  COLOR_ATTACHMENT0 = 0x8ce0,
  TRIANGLES = 0x0004,
  TRIANGLE_FAN = 0x0006;

export function glContext(c: HTMLCanvasElement) {
  gl = c.getContext("webgl2");
}

export function glShader(mode: "v" | "f", body: string) {
  let src =
    `#version 300 es
precision highp float;
${body}`;

  const shader = gl.createShader(mode == "v" ? VERTEX_SHADER : FRAGMENT_SHADER);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);


  if (debug) {
    const e = gl.getShaderInfoLog(shader);
    if (e) {
      console.log("shader:", e);
      console.log(src.split("\n").map((s, i) => `${i + 1}. ${s}`).join("\n"));
    }
  }

  return shader;
}

export function glCompile(vs: WebGLProgram, fs: WebGLProgram) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  return program;
}

export function glTexture(width:number, height:number) {
  const texture = gl.createTexture();
  gl.bindTexture(TEXTURE_2D, texture);

  gl.texImage2D(
    TEXTURE_2D,
    0,
    RGBA,
    width,
    height,
    0,
    gl.RGBA,
    UNSIGNED_BYTE,
    null
  );

  gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);

  gl.bindTexture(TEXTURE_2D, null);

  return texture;
}


export function glFramebuffer(textures) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(FRAMEBUFFER, fb);

  for(let i = 0; i < textures.length; i++){
    gl.framebufferTexture2D(
      FRAMEBUFFER,
      COLOR_ATTACHMENT0 + i,
      TEXTURE_2D,
      textures[i],
      0
    );  
  }

  gl.bindFramebuffer(FRAMEBUFFER, null);

  return fb;
}


export function glBindTextures(textures: WebGLTexture[], p:WebGLProgram) {
  for (let i = 0; i < textures.length; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.uniform1i(gl.getUniformLocation(p, "T"+i), i);
    gl.bindTexture(TEXTURE_2D, textures[i]);
  }
}

export function glDrawQuad() {  
  gl.drawArrays(TRIANGLES, 0, 6)
}

export function glUniforms(p: WebGLProgram) {
  const uniform: { [field: string]: (...number) => void } = {};
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
    const info = gl.getActiveUniform(p, i);
    console.log(info);
    let suffix = ["i", "ui", "f"][info.type - INT] || i;
    if (suffix) {
      const loc = gl.getUniformLocation(p, info.name);
      uniform[info.name] = (...args) => gl[`uniform${args.length}${suffix}`](loc, ...args);
    }
  }
  return uniform;
}


function glBuffer() {
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
}

function glBufferData(buffer, data) {
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

function glAttr(program, name, buffer, itemSize = 2) {
  let loc = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(loc);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(loc, itemSize, gl.FLOAT, false, 0, 0);
}

