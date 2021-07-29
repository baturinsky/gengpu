(() => {
  // src/gllib.ts
  var gl;
  var debug = false;
  var TEXTURE_2D = 3553;
  var FRAMEBUFFER = 36160;
  var RGBA = 6408;
  var FRAGMENT_SHADER = 35632;
  var VERTEX_SHADER = 35633;
  var UNSIGNED_BYTE = 5121;
  var TEXTURE_MIN_FILTER = 10241;
  var NEAREST = 9728;
  var COLOR_ATTACHMENT0 = 36064;
  var TRIANGLES = 4;
  function useGL(val) {
    gl = val;
  }
  function createShader(mode, header, body) {
    let src = `#version 300 es
precision highp float;
${header}
void main() {${body}}`;
    const shader = gl.createShader(mode == "v" ? VERTEX_SHADER : FRAGMENT_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (debug) {
      const e = gl.getShaderInfoLog(shader);
      console.log("shader:", e ? e + src : "OK");
    }
    return shader;
  }
  function compileProgram(vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }
  function createTexture([width, height]) {
    const targetTexture = gl.createTexture();
    gl.bindTexture(TEXTURE_2D, targetTexture);
    gl.texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, null);
    gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
    gl.bindTexture(TEXTURE_2D, null);
    return targetTexture;
  }
  function createBuffer(targetTexture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(FRAMEBUFFER, fb);
    gl.framebufferTexture2D(FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, targetTexture, 0);
    return fb;
  }
  function draw(tex, buf) {
    gl.bindTexture(TEXTURE_2D, tex);
    gl.bindFramebuffer(FRAMEBUFFER, buf);
    gl.drawArrays(TRIANGLES, 0, 6);
  }
  function uniforms(p) {
    const uniform = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); ++i) {
      const info = gl.getActiveUniform(p, i);
      uniform[info.name] = gl.getUniformLocation(p, info.name);
    }
    return uniform;
  }

  // src/simplex.glsl
  var simplex_default = "vec3 permute(vec3 x) {\r\n  return mod(((x * 34.0) + 1.0) * x, 289.0);\r\n}\r\n\r\nfloat snoise(vec2 v) {\r\n  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);\r\n  vec2 i = floor(v + dot(v, C.yy));\r\n  vec2 x0 = v - i + dot(i, C.xx);\r\n  vec2 i1;\r\n  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\r\n  vec4 x12 = x0.xyxy + C.xxzz;\r\n  x12.xy -= i1;\r\n  i = mod(i, 289.0);\r\n  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\r\n  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);\r\n  m = m * m;\r\n  m = m * m;\r\n  vec3 x = 2.0 * fract(p * C.www) - 1.0;\r\n  vec3 h = abs(x) - 0.5;\r\n  vec3 ox = floor(x + 0.5);\r\n  vec3 a0 = x - ox;\r\n  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);\r\n  vec3 g;\r\n  g.x = a0.x * x0.x + h.x * x0.y;\r\n  g.yz = a0.yz * x12.xz + h.yz * x12.yw;\r\n  return 130.0 * dot(m, g);\r\n}";

  // src/prog.ts
  var canvasWidth = 1900;
  var canvasHeight = 960;
  console.log(simplex_default);
  function main() {
    let gl2 = document.getElementById("C").getContext("webgl2");
    useGL(gl2);
    const vFullScreenQuad = createShader("v", ``, `
int i = gl_VertexID;
gl_Position = vec4(vec2(i%2*2-1, 1-(i+1)%4/2*2), 0., 1.);
`);
    let tx = createTexture([canvasWidth, canvasHeight]);
    let buffer = createBuffer(tx);
    let tx2 = createTexture([canvasWidth, canvasHeight]);
    let buffer2 = createBuffer(tx2);
    let t = 0;
    let p = compileProgram(vFullScreenQuad, createShader("f", `
uniform sampler2D T;
uniform float t;
out vec4 c;`, `
ivec2 F=ivec2(gl_FragCoord.xy);
c=texelFetch(T,F,0);
float m=c.g,n=-m;
for(int i=0;i<9;i++)
  n+=texelFetch(T,F+ivec2(i%3-1,i/3-1),0).g;
  c.gra=vec3(
    n==3.||m==1.&&(n==2. || n == 6.)||abs(atan(float(F.y-${canvasHeight / 2}),
    float(F.x-${canvasWidth / 2}))-mod(t/5e2,6.28)+3.14)<2e-4?1:0,
    max(c.g,c.r*.9),1
  );
`));
    gl2.useProgram(p);
    let uniform = uniforms(p);
    let interval;
    window.onclick = () => {
      clearInterval(interval);
      interval = setInterval((_) => {
        gl2.uniform1f(uniform["t"], t);
        draw(tx, buffer2);
        [buffer, buffer2] = [buffer2, buffer];
        [tx, tx2] = [tx2, tx];
        draw(tx);
        t++;
        if (t > 100)
          clearInterval(interval);
      }, 50);
    };
  }
  main();
})();
