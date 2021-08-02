//@ts-check  

import { gl, glFramebuffer, glCompile, glShader, glUniforms, glBindTextures, glTexture, glContext, TRIANGLES, glDrawQuad } from "./gllib"
import shaders from "./shaders"

const canvasWidth = 800, canvasHeight = 800;

C.width = canvasWidth;
C.height = canvasHeight;

glContext(C);

gl.getExtension('EXT_color_buffer_float');

const vFullScreenQuad = glShader(
  "v",
  `
void main() {
  int i = gl_VertexID;
  gl_Position = vec4(vec2(i%2*2-1, 1-(i+1)%4/2*2), 0., 1.);
}`
);

const buffersNumber = 2;
let textures = [0, 1].map(side => [...new Array(buffersNumber)].map((_, i) => glTexture(canvasWidth, canvasHeight)))
let buffers = textures.map(textures => glFramebuffer(textures))

let t = 0;

let p = glCompile(
  vFullScreenQuad,
  glShader(
    "f", `
${shaders.gradient}
${shaders.main}
`
  )
);

gl.useProgram(p);
let pUniform = glUniforms(p);

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
