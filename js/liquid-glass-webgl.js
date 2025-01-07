// Liquid glass refraction drawn by the WebGL scene behind the glass.
// Safari and Firefox cannot put SVG filters in backdrop-filter, so after the
// scene renders, this copies the frame and redraws the rim of every visible
// panel with the same fillet displacement and RGB split as the Chromium
// filter in js/liquid-glass.js. The DOM panel above then only adds its
// highlights. Content between the canvas and the panel is not bent.
//
// The canvas is transparent over the CSS sky, so where the RGB split lands
// one channel on the sky and another on the city, the missing sky is filled
// in from the same gradients as .experience-sky/-dusk/-night.

import * as THREE from "three";
import { canvasRefracts, glassPanels } from "./liquid-glass.js";

// Same fillet softness as the SVG displacement map.
const RIM_SOFTNESS = 0.15;

// css/home-journey.css sky layers (linear gradients only), v = 0 at the top.
// Shared with js/home-backdrop.js; needs uDusk and uNight uniforms.
export const SKY_GLSL = /* glsl */ `
  vec3 skyAt(float v) {
    vec3 day = v < 0.52
      ? mix(vec3(0.204, 0.498, 0.710), vec3(0.310, 0.624, 0.820), v / 0.52)
      : mix(vec3(0.310, 0.624, 0.820), vec3(0.608, 0.812, 0.918), (v - 0.52) / 0.48);
    vec3 dusk = v < 0.38
      ? mix(vec3(0.173, 0.208, 0.439), vec3(0.482, 0.353, 0.576), v / 0.38)
      : v < 0.68
        ? mix(vec3(0.482, 0.353, 0.576), vec3(0.878, 0.455, 0.478), (v - 0.38) / 0.30)
        : mix(vec3(0.878, 0.455, 0.478), vec3(1.0, 0.635, 0.353), (v - 0.68) / 0.32);
    vec3 night = v < 0.40
      ? mix(vec3(0.008, 0.016, 0.051), vec3(0.027, 0.047, 0.149), v / 0.40)
      : v < 0.78
        ? mix(vec3(0.027, 0.047, 0.149), vec3(0.082, 0.106, 0.290), (v - 0.40) / 0.38)
        : mix(vec3(0.082, 0.106, 0.290), vec3(0.161, 0.157, 0.353), (v - 0.78) / 0.22);
    return mix(mix(day, dusk, uDusk), night, uNight);
  }
`;

const vertexShader = /* glsl */ `
  uniform vec2 uResolution;
  uniform vec4 uRect;
  void main() {
    vec2 pixel = uRect.xy + (position.xy * 0.5 + 0.5) * uRect.zw;
    gl_Position = vec4(pixel / uResolution * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform vec4 uRect;
  uniform float uRadius;
  uniform float uBevel;
  uniform float uStrength;
  uniform float uAberration;
  uniform float uOpacity;
  uniform float uDusk;
  uniform float uNight;

  ${SKY_GLSL}

  // Premultiplied sample topped up with sky to the panel's shared alpha.
  float channel(vec2 uv, int index, float alpha) {
    vec4 s = texture2D(uScene, uv);
    float sky = skyAt(1.0 - clamp(uv.y, 0.0, 1.0))[index];
    return s[index] + (alpha - s.a) * sky;
  }

  float sdRoundRect(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 halfSize = uRect.zw * 0.5;
    vec2 p = gl_FragCoord.xy - uRect.xy - halfSize;
    float r = min(uRadius, min(halfSize.x, halfSize.y));
    float d = sdRoundRect(p, halfSize, r);
    float t = clamp(-d / uBevel, 0.0, 1.0);
    // Outside the panel and in its flat centre the frame stays as rendered.
    if (d > 0.0 || t >= 1.0) discard;

    const float e = 0.5;
    vec2 g = vec2(
      sdRoundRect(p + vec2(e, 0.0), halfSize, r) - sdRoundRect(p - vec2(e, 0.0), halfSize, r),
      sdRoundRect(p + vec2(0.0, e), halfSize, r) - sdRoundRect(p - vec2(0.0, e), halfSize, r)
    );
    float len = length(g);
    vec2 inward = len > 0.0 ? -g / len : vec2(0.0);
    // Quarter-circle fillet: steep at the rim, flat towards the centre.
    float u = 1.0 - t;
    float slope = u / sqrt(1.0 - u * u + ${RIM_SOFTNESS.toFixed(2)}) * sqrt(${RIM_SOFTNESS.toFixed(2)});
    vec2 offset = inward * slope * uStrength / uResolution;

    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 uvRed = uv + offset;
    vec2 uvGreen = uv + offset * (1.0 + uAberration);
    vec2 uvBlue = uv + offset * (1.0 + uAberration * 2.0);
    float alpha = max(texture2D(uScene, uvRed).a, max(texture2D(uScene, uvGreen).a, texture2D(uScene, uvBlue).a));
    vec4 bent = vec4(channel(uvRed, 0, alpha), channel(uvGreen, 1, alpha), channel(uvBlue, 2, alpha), alpha);
    gl_FragColor = mix(texture2D(uScene, uv), bent, uOpacity);
  }
`;

// Opacity the panel is painted with, including its ancestors'.
function visibleOpacity(node) {
  let opacity = 1;
  for (let el = node; el && el !== document.documentElement; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (el === node && style.visibility === "hidden") return 0;
    opacity *= parseFloat(style.opacity);
    if (opacity < 0.01) return 0;
  }
  return opacity;
}

/**
 * Returns a function to call right after each `renderer.render()` that
 * redraws the rim of every liquid glass panel over the canvas, or null when
 * the browser refracts on its own (or has no fine pointer).
 *
 * @param {THREE.WebGLRenderer} renderer
 */
export function createGlassPass(renderer) {
  if (!canvasRefracts) return null;
  document.documentElement.classList.add("lg-canvas");

  const canvas = renderer.domElement;
  // applySky() writes the day cycle here as inline custom properties.
  const stage = canvas.closest(".experience-stage");
  const bufferSize = new THREE.Vector2();
  let sceneCopy = null;

  const uniforms = {
    uScene: { value: null },
    uResolution: { value: new THREE.Vector2() },
    uRect: { value: new THREE.Vector4() },
    uRadius: { value: 0 },
    uBevel: { value: 1 },
    uStrength: { value: 0 },
    uAberration: { value: 0 },
    uOpacity: { value: 1 },
    uDusk: { value: 0 },
    uNight: { value: 0 },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      blending: THREE.NoBlending,
      depthTest: false,
      depthWrite: false,
    }),
  );
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.Camera();

  return () => {
    if (!glassPanels.size) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    // Collect first: the frame is only copied when a panel is on screen.
    const visible = [];
    for (const panel of glassPanels) {
      const rect = panel.node.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (rect.right < bounds.left || rect.left > bounds.right) continue;
      if (rect.bottom < bounds.top || rect.top > bounds.bottom) continue;
      const opacity = visibleOpacity(panel.node);
      if (opacity) visible.push({ panel, rect, opacity });
    }
    if (!visible.length) return;

    renderer.getDrawingBufferSize(bufferSize);
    if (!sceneCopy || sceneCopy.image.width !== bufferSize.x || sceneCopy.image.height !== bufferSize.y) {
      sceneCopy?.dispose();
      sceneCopy = new THREE.FramebufferTexture(bufferSize.x, bufferSize.y);
      sceneCopy.minFilter = THREE.LinearFilter;
      sceneCopy.magFilter = THREE.LinearFilter;
      uniforms.uScene.value = sceneCopy;
    }
    renderer.copyFramebufferToTexture(sceneCopy);
    uniforms.uResolution.value.copy(bufferSize);
    uniforms.uDusk.value = parseFloat(stage?.style.getPropertyValue("--dusk")) || 0;
    uniforms.uNight.value = parseFloat(stage?.style.getPropertyValue("--night")) || 0;

    const toBuffer = bufferSize.x / bounds.width;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    for (const { panel, rect, opacity } of visible) {
      const { node, strength, bevel, aberration } = panel;
      // The SVG filter works in the panel's own space, so it scales with it.
      const scale = (node.offsetWidth ? rect.width / node.offsetWidth : 1) * toBuffer;
      const width = rect.width * toBuffer;
      const height = rect.height * toBuffer;
      uniforms.uRect.value.set(
        (rect.left - bounds.left) * toBuffer,
        (bounds.bottom - rect.bottom) * toBuffer,
        width,
        height,
      );
      uniforms.uRadius.value = (parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0) * scale;
      uniforms.uBevel.value = Math.max(1, Math.min(bevel * scale, width / 2, height / 2));
      uniforms.uStrength.value = strength * scale;
      uniforms.uAberration.value = aberration;
      uniforms.uOpacity.value = opacity;
      renderer.render(scene, camera);
    }
    renderer.autoClear = autoClear;
  };
}
