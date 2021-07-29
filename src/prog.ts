//@ts-check  

import { createBuffer, compileProgram, createShader, uniforms, draw, createTexture, useGL } from "./gllib"

const canvasWidth = 1900, canvasHeight = 960;

import simplex from "./simplex.glsl"

console.log(simplex);

function main() {

  let gl: WebGLRenderingContext = (document.getElementById("C") as HTMLCanvasElement).getContext("webgl2");

  useGL(gl);



  const vFullScreenQuad = createShader(
    "v",
    ``,
    `
int i = gl_VertexID;
gl_Position = vec4(vec2(i%2*2-1, 1-(i+1)%4/2*2), 0., 1.);
`
  );

  let tx = createTexture([canvasWidth, canvasHeight]);
  let buffer = createBuffer(tx);

  let tx2 = createTexture([canvasWidth, canvasHeight]);
  let buffer2 = createBuffer(tx2);

  let t = 0;

  let p = compileProgram(
    vFullScreenQuad,
    createShader(
      "f", `
uniform sampler2D T;
uniform float t;
out vec4 c;`,
      `
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
`
    )
  );
  gl.useProgram(p);

  let uniform = uniforms(p);

  let interval: number;

  window.onclick = () => {
    clearInterval(interval);
    interval = setInterval((_) => {
      gl.uniform1f(uniform["t"], t);
      draw(tx, buffer2);

      [buffer, buffer2] = [buffer2, buffer];
      [tx, tx2] = [tx2, tx];

      draw(tx);
      t++;

      if (t > 100)
        clearInterval(interval);
    }, 50);
  }


}

main();