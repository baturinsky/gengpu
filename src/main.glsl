uniform sampler2D T0;
uniform sampler2D T1;
uniform float t;
uniform int screen;
layout(location = 0) out vec4 c0;
layout(location = 1) out vec4 c1;
void main() {
  ivec2 F = ivec2(gl_FragCoord.xy);
  if(screen == 1) {
    c0 = texelFetch(T0, F, 0) + texelFetch(T1, F, 0);
  } else {
    float v = fbm(gl_FragCoord.xy / 50. + vec2(0, t * 10.));
    c0 = vec4(0, v, 0, 1);
    float w = fbm(gl_FragCoord.xy / 200. + vec2(0, t * 10.)) - 0.5;
    w = .5 / (1. + w * w * 4e2);
    c1 = vec4(0, w, 0, 1);
  }
}
