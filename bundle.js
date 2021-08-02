(() => {
  // src/gllib.ts
  var gl;
  var debug = true;
  var TEXTURE_2D = 3553;
  var FRAMEBUFFER = 36160;
  var RGBA = 6408;
  var FRAGMENT_SHADER = 35632;
  var VERTEX_SHADER = 35633;
  var UNSIGNED_BYTE = 5121;
  var INT = 5124;
  var TEXTURE_MIN_FILTER = 10241;
  var NEAREST = 9728;
  var COLOR_ATTACHMENT0 = 36064;
  var TRIANGLES = 4;
  function glContext(c) {
    gl = c.getContext("webgl2");
  }
  function glShader(mode, body) {
    let src = `#version 300 es
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
  function glCompile(vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }
  function glTexture(width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, texture);
    gl.texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, gl.RGBA, UNSIGNED_BYTE, null);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    gl.bindTexture(TEXTURE_2D, null);
    return texture;
  }
  function glFramebuffer(textures2) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(FRAMEBUFFER, fb);
    for (let i = 0; i < textures2.length; i++) {
      gl.framebufferTexture2D(FRAMEBUFFER, COLOR_ATTACHMENT0 + i, TEXTURE_2D, textures2[i], 0);
    }
    gl.bindFramebuffer(FRAMEBUFFER, null);
    return fb;
  }
  function glBindTextures(textures2, p2) {
    for (let i = 0; i < textures2.length; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.uniform1i(gl.getUniformLocation(p2, "T" + i), i);
      gl.bindTexture(TEXTURE_2D, textures2[i]);
    }
  }
  function glDrawQuad() {
    gl.drawArrays(TRIANGLES, 0, 6);
  }
  function glUniforms(p2) {
    const uniform = {};
    for (let i = 0; i < gl.getProgramParameter(p2, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p2, i);
      console.log(info);
      let suffix = ["i", "ui", "f"][info.type - INT] || i;
      if (suffix) {
        const loc = gl.getUniformLocation(p2, info.name);
        uniform[info.name] = (...args) => gl[`uniform${args.length}${suffix}`](loc, ...args);
      }
    }
    return uniform;
  }

  // src/gradient.glsl
  var gradient_default = "int NUM_OCTAVES = 10;\r\n\r\n\r\n// 1,2,3\r\n\r\nfloat rand(vec2 n) { \r\n	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n}\r\n\r\nfloat noise(vec2 p){\r\n	vec2 ip = floor(p);\r\n	vec2 u = fract(p);\r\n	u = u*u*(3.0-2.0*u);\r\n	\r\n	float res = mix(\r\n		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),\r\n		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\r\n	return res*res;\r\n}\r\n\r\n\r\n/*\r\n// Simplex\r\n\r\nvec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }\r\n\r\nfloat noise(vec2 v){\r\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439,\r\n           -0.577350269189626, 0.024390243902439);\r\n  vec2 i  = floor(v + dot(v, C.yy) );\r\n  vec2 x0 = v -   i + dot(i, C.xx);\r\n  vec2 i1;\r\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\r\n  vec4 x12 = x0.xyxy + C.xxzz;\r\n  x12.xy -= i1;\r\n  i = mod(i, 289.0);\r\n  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\r\n  + i.x + vec3(0.0, i1.x, 1.0 ));\r\n  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),\r\n    dot(x12.zw,x12.zw)), 0.0);\r\n  m = m*m ;\r\n  m = m*m ;\r\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\r\n  vec3 h = abs(x) - 0.5;\r\n  vec3 ox = floor(x + 0.5);\r\n  vec3 a0 = x - ox;\r\n  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\r\n  vec3 g;\r\n  g.x  = a0.x  * x0.x  + h.x  * x0.y;\r\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\r\n  return 0.5 + 130.0 * dot(m, g) * 0.5;\r\n}\r\n*/\r\n\r\nfloat fbm(vec2 x) {\r\n	float v = 0.0;\r\n	float a = 0.5;\r\n	vec2 shift = vec2(100);\r\n  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));\r\n	for (int i = 0; i < NUM_OCTAVES; ++i) {\r\n		v += a * noise(x);\r\n		x = rot * x * 2.0 + shift;\r\n		a *= 0.6;\r\n	}\r\n	return v;\r\n}\r\n";

  // src/main.glsl
  var main_default = "uniform sampler2D T0;\r\nuniform sampler2D T1;\r\nuniform float t;\r\nuniform int screen;\r\nlayout(location = 0) out vec4 c0;\r\nlayout(location = 1) out vec4 c1;\r\nvoid main() {\r\n  ivec2 F = ivec2(gl_FragCoord.xy);\r\n  if(screen == 1) {\r\n    c0 = texelFetch(T0, F, 0) + texelFetch(T1, F, 0);\r\n  } else {\r\n    float v = fbm(gl_FragCoord.xy / 50. + vec2(0, t * 10.));\r\n    c0 = vec4(0, v, 0, 1);\r\n    float w = fbm(gl_FragCoord.xy / 200. + vec2(0, t * 10.)) - 0.5;\r\n    w = .5 / (1. + w * w * 4e2);\r\n    c1 = vec4(0, w, 0, 1);\r\n  }\r\n}\r\n";

  // src/shaders.ts
  var shaders_default = {main: main_default, gradient: gradient_default};

  // src/prog.ts
  var canvasWidth = 800;
  var canvasHeight = 800;
  C.width = canvasWidth;
  C.height = canvasHeight;
  glContext(C);
  gl.getExtension("EXT_color_buffer_float");
  var vFullScreenQuad = glShader("v", `
void main() {
  int i = gl_VertexID;
  gl_Position = vec4(vec2(i%2*2-1, 1-(i+1)%4/2*2), 0., 1.);
}`);
  var buffersNumber = 2;
  var textures = [0, 1].map((side) => [...new Array(buffersNumber)].map((_, i) => glTexture(canvasWidth, canvasHeight)));
  var buffers = textures.map((textures2) => glFramebuffer(textures2));
  var t = 0;
  var p = glCompile(vFullScreenQuad, glShader("f", `
${shaders_default.gradient}
${shaders_default.main}
`));
  gl.useProgram(p);
  var pUniform = glUniforms(p);
  function loop() {
    pUniform.t(t);
    pUniform.screen(0);
    glBindTextures(textures[0], p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffers[1]);
    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1
    ]);
    glDrawQuad();
    pUniform.screen(1);
    glBindTextures(textures[1], p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    glDrawQuad();
    buffers = buffers.reverse();
    textures = textures.reverse();
    t++;
  }
  window.onclick = loop;
  loop();
})();
