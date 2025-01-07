import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { applySky, dayCycle, journeyState } from "./home-journey.js";
import { createGlassPass } from "./liquid-glass-webgl.js";

const canvas = document.querySelector(".home-model-canvas");
// Desktop duck height: increase to raise the duck, decrease to lower it.
const DESKTOP_DUCK_HEIGHT = 0.31;
// Desktop duck X position in map radii from the centre: increase to move
// right, decrease to move left. Keep it inside the plaza (see DUCK_ROUTE).
const DESKTOP_DUCK_X = 0.005;
// Camera tilt: increase for a steeper (more top-down) view. Was 0.65.
const CAMERA_ELEVATION = 0.85;
// Mobile camera target height: increase to push the model lower on screen,
// leaving room for the CTA text above it.
const MOBILE_CAMERA_TARGET_Y = 1.2;
// Desktop camera target height: increase to push the model lower on screen.
const DESKTOP_CAMERA_TARGET_Y = 0.4;

// ---------------------------------------------------------------------------
// Scroll journey choreography
//
// Poses are authored in map space with the city in its resting orientation
// (the hero spin eases back to 0 while the hero scrolls away). X/Z and
// distances are multiples of the map radius; Y is measured from street level
// (where the duck's feet are), also in map radii. That keeps every shot valid
// on any breakpoint, whatever scale the model is loaded at.
//   target  point the camera looks at
//   az      camera azimuth around the target (radians, 0 = looking from +Z)
//   el      camera elevation above the horizon (radians)
//   dist    camera distance to the target
//   fov     vertical field of view on landscape screens (portrait adds 10)
//   stop    duck route stop the duck walks to during this beat
// Time of day is not part of a pose: it follows the whole scroll (see
// dayCycle in home-journey.js).
// The text panel side comes from the beat element (data-side) in the DOM.
const POSES = {
  // Stage 1: establishing shot of the whole city.
  overview: { target: [0, 0.12, 0.02], az: 0.38, el: 0.62, dist: 2.75, fov: 38, stop: "start" },
  // Stage 2: one landmark per service.
  web: { target: [-0.14, 0.3, -0.04], az: -0.43, el: 0.2, dist: 2.4, fov: 36, stop: "web" },
  product: { target: [0.47, 0.3, 0.47], az: 0.25, el: 0.22, dist: 2.3, fov: 36, stop: "product" },
  brand: { target: [-0.12, 0.28, 0.24], az: -0.5, el: 0.24, dist: 2.25, fov: 36, stop: "brand" },
  growth: { target: [-0.42, 0.3, 0.27], az: -1.1, el: 0.2, dist: 2.25, fov: 36, stop: "growth" },
  // Stage 3: steep map view; the case study pins sit on the landmarks.
  proof: { target: [0.02, 0.05, 0], az: 1.0, el: 1.12, dist: 2.35, fov: 40, stop: "proof" },
  // Stage 4: night finale framing the duck next to the form.
  contact: { target: [0.02, 0.34, 0.05], az: 0.55, el: 0.26, dist: 2.5, fov: 34, stop: "contact" },
};

// Duck stops in map radii on the X/Z plane (duck centre, straight segments).
// The duck is huge next to the buildings, so it only shuffles around the
// central plaza: at desktop size its body clears every building, at any
// heading, inside roughly x 0.04..0.1, z -0.11..0.02. The start X is
// replaced at runtime by the hero position so the first frame never jumps.
const DUCK_ROUTE = [
  { stop: "start", at: [0, -0.03] },
  { stop: "web", at: [0.06, -0.03] },
  { stop: "product", at: [0.08, -0.06] },
  { stop: "brand", at: [0.05, -0.07] },
  { stop: "growth", at: [0.065, -0.09] },
  { stop: "proof", at: [0.07, -0.05] },
  { stop: "contact", at: [0.06, -0.03] },
];

// Screen anchors for the case study pins (map radii, Y above street level).
const PIN_ANCHORS = {
  utura: [-0.3, 0.56, -0.12],
  "port-vela": [-0.54, 0.4, 0.29],
  cactus: [0.36, 0.15, 0.37],
  vibes: [0.46, 0.28, -0.07],
  liceu: [-0.33, 0.2, -0.35],
};

// The duck model faces +Z; adjust if a different model faces another way.
const DUCK_FORWARD_YAW = 0;
// Framing shift that pushes the subject away from the text panel: sideways
// on desktop (fraction of the width), upwards on the stacked mobile layout
// where the cards sit on the bottom half (fraction of the height).
const PANEL_SHIFT_X = 0.15;
const PANEL_SHIFT_Y = 0.26;

const TAU = Math.PI * 2;
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrapAngle = (angle) => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const lerp = THREE.MathUtils.lerp;
const lerpAngle = (from, to, t) => from + wrapAngle(to - from) * t;
// Frame-rate independent exponential smoothing factor.
const dampFactor = (lambda, dt) => 1 - Math.exp(-lambda * dt);

const createRenderer = () => {
  try {
    return new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      // The black ink outline makes jagged silhouettes especially visible on
      // mobile. Native MSAA smooths the canvas edges without increasing its
      // drawing-buffer resolution.
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.error("WebGL no disponible", error);
    document.documentElement.classList.add("no-webgl");
    return null;
  }
};

// Collapse the static city into one draw call per material. The GLB ships as
// ~585 separate meshes; merging them removes almost all CPU draw overhead,
// which is what limits frame rate on phones (the city is only ~120k tris).
// Transparent materials stay separate so their depth sorting still works.
const mergeStaticMeshes = (root) => {
  root.updateMatrixWorld(true);
  const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();

  root.traverse((node) => {
    if (!node.isMesh || node.isSkinnedMesh || node.isInstancedMesh) return;
    const { geometry, material } = node;
    if (Array.isArray(material) || material.transparent) return;
    if (geometry.groups.length || Object.keys(geometry.morphAttributes).length) return;
    const signature = Object.keys(geometry.attributes)
      .sort()
      .map((name) => {
        const attribute = geometry.attributes[name];
        return `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`;
      })
      .join(",");
    const key = `${material.uuid}|${signature}|${geometry.index ? "indexed" : "flat"}`;
    if (!buckets.has(key)) buckets.set(key, { material, nodes: [] });
    buckets.get(key).nodes.push(node);
  });

  const matrix = new THREE.Matrix4();
  buckets.forEach(({ material, nodes }) => {
    if (nodes.length < 2) return;
    const geometries = nodes.map((node) => {
      matrix.multiplyMatrices(rootInverse, node.matrixWorld);
      const geometry = node.geometry.clone();
      geometry.applyMatrix4(matrix);
      // Mirrored transforms flip the winding. three.js compensates per object
      // at draw time, which is lost after merging, so fix the indices here.
      if (matrix.determinant() < 0) {
        if (geometry.index) {
          const index = geometry.index;
          for (let i = 0; i < index.count; i += 3) {
            const b = index.getX(i + 1);
            index.setX(i + 1, index.getX(i + 2));
            index.setX(i + 2, b);
          }
        } else {
          geometry.dispose();
          return null;
        }
      }
      return geometry;
    });
    if (geometries.includes(null)) {
      geometries.forEach((geometry) => geometry?.dispose());
      return;
    }
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `merged:${material.name || material.uuid}`;
    nodes.forEach((node) => node.removeFromParent());
    root.add(mesh);
  });

  // Drop the empty transform nodes left behind so per-frame matrix updates
  // walk a handful of objects instead of ~1100.
  const prune = (node) => {
    [...node.children].forEach(prune);
    if (node !== root && !node.isMesh && !node.isLight && !node.isCamera && node.children.length === 0) {
      node.removeFromParent();
    }
  };
  prune(root);
  root.updateMatrixWorld(true);
};

if (canvas) {
  const renderer = createRenderer();
  if (renderer) initScene(renderer);
}

function initScene(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
  camera.up.set(0, 1, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const hemiLight = new THREE.HemisphereLight(0xf7eee3, 0x242424, 2.2);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
  keyLight.position.set(4, 7, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9bb9d4, 1.1);
  fillLight.position.set(-4, 3, -5);
  scene.add(fillLight);

  // Day cycle grade: [day, golden hour, moonlit night].
  const grade = {
    hemiSky: [new THREE.Color(0xf7eee3), new THREE.Color(0xffd9b8), new THREE.Color(0x6f82c4)],
    hemiGround: [new THREE.Color(0x242424), new THREE.Color(0x2a2220), new THREE.Color(0x14162a)],
    key: [new THREE.Color(0xfff7ed), new THREE.Color(0xffb36b), new THREE.Color(0xb4c6ff)],
    fill: [new THREE.Color(0x9bb9d4), new THREE.Color(0x8a78c9), new THREE.Color(0x5a55c4)],
    hemiIntensity: [2.2, 2.2, 1.35],
    keyIntensity: [3.2, 3.6, 1.5],
    fillIntensity: [1.1, 1.1, 0.9],
    exposure: [1.15, 1.08, 1.02],
  };
  const gradeColor = (out, stops, golden, night) =>
    out.lerpColors(stops[0], stops[1], golden).lerp(stops[2], night);
  const gradeValue = (stops, golden, night) => lerp(lerp(stops[0], stops[1], golden), stops[2], night);

  // Premultiplied glow: adds light over the city, stays a valid alpha over
  // the transparent canvas so the CSS sky behind still shows through.
  const setGlowBlending = (material) => {
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.CustomBlending;
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor;
    material.blendDst = THREE.OneFactor;
    material.blendSrcAlpha = THREE.OneFactor;
    material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
    return material;
  };

  // Stars: a dome that follows the camera, so it reads as infinitely far and
  // only turns with the camera. Mostly faint points, a few bright ones.
  const createStars = (count) => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkle = new Float32Array(count * 2);
    const colors = new Float32Array(count * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Uniform over the sky cap, dipping a little below the horizon.
      const y = -0.2 + Math.random() * 1.2;
      const ring = Math.sqrt(1 - y * y);
      const angle = Math.random() * TAU;
      positions[i * 3] = Math.cos(angle) * ring;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * ring;
      sizes[i] = 1.2 + Math.pow(Math.random(), 7) * 3.4;
      twinkle[i * 2] = Math.random() * TAU;
      twinkle[i * 2 + 1] = 0.5 + Math.random() * 2.2;
      const hue = Math.random();
      tint.setRGB(1, 1, 1).lerp(hue < 0.5 ? new THREE.Color(0xaec6ff) : new THREE.Color(0xffe2b8), Math.random() * 0.5);
      tint.toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 2));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    const material = setGlowBlending(
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPixelRatio: { value: 1 },
          uRadius: { value: 40 },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform float uOpacity;
          uniform float uPixelRatio;
          uniform float uRadius;
          attribute float aSize;
          attribute vec2 aTwinkle;
          attribute vec3 aColor;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position * uRadius, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float glint = 0.6 + 0.4 * sin(uTime * aTwinkle.y + aTwinkle.x);
            // Thin out towards the horizon, where the night sky is lighter.
            vAlpha = uOpacity * glint * smoothstep(-0.2, 0.25, position.y);
            vColor = aColor;
            gl_PointSize = aSize * uPixelRatio * (0.8 + 0.35 * glint);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float a = exp(-d * d * 5.0) * (1.0 - smoothstep(0.7, 1.0, d)) * vAlpha;
            if (a < 0.002) discard;
            gl_FragColor = vec4(vColor * a, a);
          }
        `,
      }),
    );
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -1;
    points.visible = false;
    return points;
  };

  const stars = createStars(window.innerWidth < 700 ? 650 : 1400);
  scene.add(stars);

  // Street lamps: a halo on every lamp head plus a pool of light on the
  // ground under it. Each lamp has its own switch-on point so they light up
  // one after another as night falls. Built from the GLB once it loads.
  const lampUniforms = {
    uLamps: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: 0.1 },
    uViewport: { value: 500 },
  };
  let lampHalos = null;
  let lampPools = null;
  const windowMaterials = [];

  const createLamps = (heads, bases, poolSize) => {
    const count = heads.length;
    const positions = new Float32Array(count * 3);
    const switchOn = new Float32Array(count);
    const seeds = new Float32Array(count);
    heads.forEach((head, i) => {
      head.toArray(positions, i * 3);
      switchOn[i] = Math.random() * 0.78;
      seeds[i] = Math.random();
    });

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    haloGeometry.setAttribute("aOn", new THREE.BufferAttribute(switchOn, 1));
    haloGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const halos = new THREE.Points(
      haloGeometry,
      setGlowBlending(
        new THREE.ShaderMaterial({
          uniforms: lampUniforms,
          vertexShader: /* glsl */ `
            uniform float uLamps;
            uniform float uTime;
            uniform float uSize;
            uniform float uViewport;
            attribute float aOn;
            attribute float aSeed;
            varying float vAlpha;
            void main() {
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mvPosition;
              float on = smoothstep(aOn, aOn + 0.14, uLamps);
              float flicker = 0.94 + 0.06 * sin(uTime * (1.5 + aSeed * 2.5) + aSeed * 40.0);
              vAlpha = on * flicker;
              // World-sized sprite: shrinks with distance like real geometry.
              gl_PointSize = uSize * uViewport * projectionMatrix[1][1] / -mvPosition.z;
            }
          `,
          fragmentShader: /* glsl */ `
            varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - 0.5) * 2.0;
              float core = exp(-d * d * 26.0);
              float halo = exp(-d * d * 5.0) * 0.32;
              float a = (core + halo) * (1.0 - smoothstep(0.8, 1.0, d)) * vAlpha;
              if (a < 0.002) discard;
              vec3 color = mix(vec3(1.0, 0.6, 0.26), vec3(1.0, 0.94, 0.78), core);
              gl_FragColor = vec4(color * a, a);
            }
          `,
        }),
      ),
    );
    halos.frustumCulled = false;
    halos.visible = false;

    const poolGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    poolGeometry.setAttribute("aOn", new THREE.InstancedBufferAttribute(switchOn, 1));
    const poolMaterial = setGlowBlending(
      new THREE.ShaderMaterial({
        uniforms: lampUniforms,
        vertexShader: /* glsl */ `
          uniform float uLamps;
          attribute float aOn;
          varying vec2 vUv;
          varying float vAlpha;
          void main() {
            vUv = uv;
            vAlpha = smoothstep(aOn, aOn + 0.14, uLamps);
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          varying float vAlpha;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.2) * 0.42 * vAlpha;
            if (a < 0.002) discard;
            gl_FragColor = vec4(vec3(1.0, 0.68, 0.34) * a, a);
          }
        `,
      }),
    );
    // Sits on the pavement: pull it forward in depth to avoid z-fighting.
    poolMaterial.polygonOffset = true;
    poolMaterial.polygonOffsetFactor = -2;
    poolMaterial.polygonOffsetUnits = -4;
    const pools = new THREE.InstancedMesh(poolGeometry, poolMaterial, count);
    const poolMatrix = new THREE.Matrix4();
    bases.forEach((base, i) => {
      poolMatrix.makeScale(poolSize, 1, poolSize).setPosition(base);
      pools.setMatrixAt(i, poolMatrix);
    });
    pools.frustumCulled = false;
    pools.visible = false;
    return { halos, pools };
  };

  // Lamp head = centre of the top slice of the lamp's vertices (the arm can
  // put it off the pole axis); pool = the ground point right under it.
  const findLamps = (root) => {
    const lampNodes = new Set();
    root.traverse((node) => {
      if (node.isMesh || !/^lampione/i.test(node.name)) return;
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (lampNodes.has(parent)) return;
      }
      lampNodes.add(node);
    });
    const heads = [];
    const bases = [];
    const vertex = new THREE.Vector3();
    lampNodes.forEach((lamp) => {
      const bounds = new THREE.Box3().setFromObject(lamp);
      if (bounds.isEmpty()) return;
      const height = bounds.max.y - bounds.min.y;
      const sliceY = bounds.max.y - height * 0.15;
      const head = new THREE.Vector3();
      let samples = 0;
      lamp.traverse((node) => {
        if (!node.isMesh) return;
        const position = node.geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          vertex.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
          if (vertex.y >= sliceY) {
            head.add(vertex);
            samples += 1;
          }
        }
      });
      if (!samples) return;
      head.divideScalar(samples);
      head.y = bounds.max.y - height * 0.1;
      heads.push(root.worldToLocal(head.clone()));
      bases.push(root.worldToLocal(new THREE.Vector3(head.x, bounds.min.y + height * 0.01, head.z)));
    });
    return { heads, bases };
  };

  // El origen del pivote es el centro real de la ciudad.
  const mapPivot = new THREE.Group();
  const mapModel = new THREE.Group();
  // duckModel: route position + heading. duckBody: waddle, lean and bob.
  const duckModel = new THREE.Group();
  const duckBody = new THREE.Group();
  duckModel.add(duckBody);
  mapPivot.add(duckModel);
  mapPivot.add(mapModel);
  mapPivot.position.y = -0.65;
  scene.add(mapPivot);

  // Both GLBs ship Draco-compressed (originals in _source-assets/models).
  // The decoder is served from /draco/ and only runs in a worker.
  const dracoLoader = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
  // Let the city win the first network/decode turn. The duck is small and is
  // only placed after the city has been measured, so loading it during idle
  // time improves the first meaningful render without delaying its arrival.
  const duckRequest = new Promise((resolve, reject) => {
    const loadDuck = () => loader.load("/home/pato.glb", resolve, undefined, reject);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadDuck, { timeout: 1200 });
    } else {
      window.setTimeout(loadDuck, 120);
    }
  });
  duckRequest.catch(() => {});
  const timer = new THREE.Timer();
  timer.connect(document);
  const defaultCameraPosition = new THREE.Vector3();
  const heroTarget = new THREE.Vector3();
  const mapCenter = new THREE.Vector3();
  let mapRadius = 1;
  let loaded = false;
  let mixer = null;
  let duckMixer = null;
  // Clouds part (lift + fade) as the hero scrolls away.
  const cloudGroup = new THREE.Group();
  const cloudMaterials = [];
  let baseFov = 38;
  let isMobileLayout = window.innerWidth < 700;

  // Duck placement data, captured once both models are loaded.
  let duckScene = null;
  let duckRawCenter = null;
  let duckRawMinY = 0;
  let duckLargestSide = 1;
  let groundMinRelative = 0;
  let streetY = 0;
  let duckRoute = null;
  const stopParams = {};

  const updateCamera = () => {
    const verticalFov = THREE.MathUtils.degToRad(baseFov);
    const horizontalFov = 2 * Math.atan(
      Math.tan(verticalFov / 2) * camera.aspect,
    );
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const mobileZoom = camera.aspect < 0.75 ? 0.42 : 0.8;
    const distance = (mapRadius / Math.sin(limitingFov / 2)) * mobileZoom;
    // Vista cenital exacta: cámara perpendicular sobre el centro del mapa.
    const viewDirection = new THREE.Vector3(1, CAMERA_ELEVATION, 1).normalize();
    // Subir el objetivo (y la cámara con él) baja el modelo en pantalla.
    heroTarget.set(
      0,
      camera.aspect < 0.75 ? MOBILE_CAMERA_TARGET_Y : DESKTOP_CAMERA_TARGET_Y,
      0,
    ).add(mapCenter);

    defaultCameraPosition.copy(viewDirection).multiplyScalar(distance).add(heroTarget);
  };

  // Places the duck exactly as the hero was calibrated. Runs again when the
  // layout crosses the mobile breakpoint, since the map offsets change too.
  const placeDuck = () => {
    if (!duckScene) return;
    const isMobile = isMobileLayout;
    const parent = duckScene.parent;
    if (parent) parent.remove(duckScene);

    const duckScale = isMobile ? 0.52 : 0.7;
    const scale = (mapRadius * duckScale) / duckLargestSide;
    duckScene.scale.setScalar(scale);
    // Centre X/Z and feet at y = 0, so duckModel/duckBody turn and waddle
    // around the duck itself instead of swinging it around a distant pivot.
    duckScene.position.set(-duckRawCenter.x * scale, -duckRawMinY * scale, -duckRawCenter.z * scale);
    duckScene.updateMatrixWorld(true);

    const duckHeight = isMobile ? 1.1 : DESKTOP_DUCK_HEIGHT;
    const duckX = isMobile ? 0.008 : DESKTOP_DUCK_X;
    // La altura del pato está calibrada con el mapa en -1.1 / -0.6 y el
    // pivote en -2.05 / -0.65 (móvil / desktop).
    const duckReferenceMapY = isMobile ? -1.1 : -0.6;
    const duckReferencePivotY = isMobile ? -2.05 : -0.65;
    const groundY = groundMinRelative + duckReferenceMapY + duckReferencePivotY;
    streetY = groundY + duckHeight;
    duckBody.add(duckScene);

    buildDuckRoute(duckX);
    getDuckRoutePoint(duckState.u, duckModel.position);
    duckState.hasPrevious = false;
  };

  const buildDuckRoute = (startX) => {
    duckRoute = DUCK_ROUTE.map(({ stop, at }) =>
      new THREE.Vector3((stop === "start" ? startX : at[0]) * mapRadius, streetY, at[1] * mapRadius),
    );
    DUCK_ROUTE.forEach(({ stop }, index) => {
      if (stop) stopParams[stop] = index / (DUCK_ROUTE.length - 1);
    });
  };

  // Straight segments between stops: a spline would overshoot the plaza.
  const getDuckRoutePoint = (u, out) => {
    const f = clamp01(u) * (duckRoute.length - 1);
    const i = Math.min(Math.floor(f), duckRoute.length - 2);
    return out.lerpVectors(duckRoute[i], duckRoute[i + 1], f - i);
  };

  let lastWidth = 0;
  let lastHeight = 0;

  const resize = () => {
    // Tamaño real del canvas (100lvh en móvil): no cambia al ocultarse la
    // barra de Safari, así el aspect no se deforma al hacer scroll.
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;

    const isMobile = width < 700;
    camera.aspect = width / height;
    baseFov = isMobile ? 48 : 38;
    camera.fov = baseFov;
    mapPivot.position.y = isMobile ? -2.05 : -0.65;
    // Mismo offset que se aplica tras cargar el pato; si difiere, el mapa
    // sube en cada resize y el pato queda hundido.
    mapModel.position.y = isMobile ? -2.4 : -1.26;
    camera.updateProjectionMatrix();
    // A lower cap cuts fill-rate dramatically while preserving the crisp
    // silhouette of the stylised city. Adaptive resolution can go lower on
    // slower devices when the frame budget is still exceeded.
    maxPixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.25);
    pixelRatio = Math.min(pixelRatio || maxPixelRatio, maxPixelRatio);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    if (isMobile !== isMobileLayout) {
      isMobileLayout = isMobile;
      placeDuck();
    }
    if (loaded) updateCamera();
    // Snap to the new framing instead of easing from the old aspect ratio.
    hasCurrentPose = false;
  };

  loader.load(
    "/home/home.glb",
    ({ scene: loadedScene, animations }) => {
      mapModel.add(loadedScene);

      const rawBounds = new THREE.Box3().setFromObject(loadedScene);
      const rawSize = rawBounds.getSize(new THREE.Vector3());
      const modelScale = 3.6 / (Math.max(rawSize.x, rawSize.y, rawSize.z) || 1);
      mapModel.scale.setScalar(modelScale);
      mapModel.updateMatrixWorld(true);

      // Solo las geometrías que tocan el nivel más bajo forman la plataforma.
      // Así las nubes y los edificios no desplazan el centro X/Z.
      const allBounds = new THREE.Box3().setFromObject(loadedScene);
      const groundTolerance = allBounds.getSize(new THREE.Vector3()).y * 0.08;
      const groundBounds = new THREE.Box3();
      loadedScene.traverse((node) => {
        if (!node.isMesh) return;
        const nodeBounds = new THREE.Box3().setFromObject(node);
        if (nodeBounds.min.y <= allBounds.min.y + groundTolerance) {
          groundBounds.expandByObject(node);
        }
      });
      if (groundBounds.isEmpty()) groundBounds.copy(allBounds);
      groundBounds.getCenter(mapCenter);

      // La traslación se convierte a coordenadas locales por la escala del GLB.
      loadedScene.position.copy(mapCenter).multiplyScalar(-1 / modelScale);
      mapModel.updateMatrixWorld(true);

      // El zoom se calcula con la plataforma, no con las nubes ni el cielo.
      const boundsMapY = mapModel.position.y;
      const boundsPivotY = mapPivot.position.y;
      const centeredAllBounds = new THREE.Box3().setFromObject(mapModel);
      const centeredTolerance = centeredAllBounds.getSize(new THREE.Vector3()).y * 0.08;
      const centeredGroundBounds = new THREE.Box3();
      loadedScene.traverse((node) => {
        if (!node.isMesh) return;
        const nodeBounds = new THREE.Box3().setFromObject(node);
        if (nodeBounds.min.y <= centeredAllBounds.min.y + centeredTolerance) {
          centeredGroundBounds.expandByObject(node);
        }
      });
      if (centeredGroundBounds.isEmpty()) centeredGroundBounds.copy(centeredAllBounds);
      const centeredGroundSize = centeredGroundBounds.getSize(new THREE.Vector3());
      mapRadius = Math.sqrt(
        centeredGroundSize.x * centeredGroundSize.x +
          centeredGroundSize.z * centeredGroundSize.z,
      ) / 2;
      mapCenter.set(0, 0, 0);
      // Ground bottom relative to the map group, independent of the offsets
      // that were active while measuring.
      groundMinRelative = centeredGroundBounds.min.y - boundsMapY - boundsPivotY;
      const { heads: lampHeads, bases: lampBases } = findLamps(loadedScene);

      // Clouds: meshes floating well above the ground with a real footprint
      // (thin antennas are skipped). They get their own material so they can
      // fade without touching the city.
      const groundTop = centeredGroundBounds.max.y;
      const cloudMeshes = [];
      loadedScene.traverse((node) => {
        if (!node.isMesh) return;
        const nodeBounds = new THREE.Box3().setFromObject(node);
        const nodeSize = nodeBounds.getSize(new THREE.Vector3());
        if (
          nodeBounds.min.y > groundTop + mapRadius * 0.3 &&
          Math.max(nodeSize.x, nodeSize.z) > mapRadius * 0.08
        ) {
          cloudMeshes.push(node);
        }
      });
      mapModel.add(cloudGroup);
      const cloudMaterialClones = new Map();
      cloudMeshes.forEach((mesh) => {
        cloudGroup.attach(mesh);
        if (!cloudMaterialClones.has(mesh.material)) {
          cloudMaterialClones.set(mesh.material, mesh.material.clone());
        }
        mesh.material = cloudMaterialClones.get(mesh.material);
      });

      // Animated nodes must keep their own transforms, so only a fully static
      // city is merged (the current GLB ships without animations).
      if (!animations.length) {
        mergeStaticMeshes(loadedScene);
        mergeStaticMeshes(cloudGroup);
      }
      // Transparent only after merging (the merge skips transparent meshes).
      cloudMaterialClones.forEach((material) => {
        material.transparent = true;
        cloudMaterials.push(material);
      });

      // Night lights. Lamp positions were measured before the merge, which
      // drops the named lamp nodes.
      const lampSize = mapRadius * 0.075;
      const lampPoolSize = (mapRadius * 0.13) / modelScale;
      if (lampHeads.length) {
        ({ halos: lampHalos, pools: lampPools } = createLamps(lampHeads, lampBases, lampPoolSize));
        loadedScene.add(lampHalos, lampPools);
        lampUniforms.uSize.value = lampSize;
      }
      // Glass glows warm from inside once the lamps come on.
      loadedScene.traverse((node) => {
        if (!node.isMesh || node.material?.name !== "VETRO" || !node.material.emissive) return;
        if (windowMaterials.some((entry) => entry.material === node.material)) return;
        windowMaterials.push({ material: node.material, opacity: node.material.opacity });
        node.material.emissive.set(0xffb45e);
        node.material.emissiveIntensity = 0;
      });

      duckRequest.then(
        ({ scene: loadedDuck, animations: duckAnimations }) => {
          // Both models are decoded: release the Draco workers.
          dracoLoader.dispose();
          duckScene = loadedDuck;
          const duckBounds = new THREE.Box3().setFromObject(duckScene);
          duckRawCenter = duckBounds.getCenter(new THREE.Vector3());
          duckRawMinY = duckBounds.min.y;
          const duckSize = duckBounds.getSize(new THREE.Vector3());
          duckLargestSide = Math.max(duckSize.x, duckSize.y, duckSize.z, 0.01);
          placeDuck();

          if (duckAnimations.length) {
            duckMixer = new THREE.AnimationMixer(duckScene);
            const clip =
              duckAnimations.find((item) => item.name === "ShubaAction") ||
              duckAnimations.find((item) => /dance/i.test(item.name)) ||
              duckAnimations[0];
            // The dance loops at full weight the whole time, also while the
            // duck walks; the procedural waddle is layered on duckBody.
            duckMixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).play();
          }
        },
        (error) => console.error("No se pudo cargar /home/pato.glb", error),
      );

      updateCamera();
      mixer = animations.length ? new THREE.AnimationMixer(loadedScene) : null;
      animations.forEach((clip) => mixer.clipAction(clip).play());
      loaded = true;
    },
    undefined,
    (error) => console.error("No se pudo cargar /home/home.glb", error),
  );

  // -------------------------------------------------------------------------
  // Pose blending

  const createPoseState = () => ({
    target: new THREE.Vector3(),
    az: 0,
    el: 0,
    dist: 1,
    fov: 38,
    shiftX: 0,
    shiftY: 0,
  });

  const fromPose = createPoseState();
  const toPose = createPoseState();
  const goalPose = createPoseState();
  const currentPose = createPoseState();
  let hasCurrentPose = false;

  const scratch = new THREE.Vector3();
  const duckPosition = new THREE.Vector3();
  const cameraLocal = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();

  // Hero pose, expressed as an orbit around its target (world space).
  const readHeroPose = (out) => {
    out.target.copy(heroTarget);
    scratch.subVectors(defaultCameraPosition, heroTarget);
    out.dist = scratch.length() || 1;
    out.az = Math.atan2(scratch.x, scratch.z);
    out.el = Math.asin(THREE.MathUtils.clamp(scratch.y / out.dist, -1, 1));
    out.fov = baseFov;
    out.shiftX = 0;
    out.shiftY = 0;
    return out;
  };

  // Authored pose -> world space, for the current map rotation.
  const readJourneyPose = (id, side, rotation, out) => {
    const pose = POSES[id];
    if (!pose) return readHeroPose(out);
    const portrait = camera.aspect < 0.9;
    const [x, y, z] = pose.target;
    out.target
      .set(x * mapRadius, streetY + y * mapRadius, z * mapRadius)
      .applyAxisAngle(THREE.Object3D.DEFAULT_UP, rotation)
      .add(mapPivot.position);
    out.az = pose.az + rotation;
    out.el = pose.el;
    out.fov = pose.fov + (portrait ? 10 : 0);
    // Keep the horizontal framing on narrow screens: push the camera back by
    // part of the lost horizontal field of view (the rest is made up by the
    // wider portrait FOV above).
    const referenceHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(pose.fov) / 2) * 1.6);
    const currentHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(out.fov) / 2) * camera.aspect);
    const fit = Math.max(1, Math.tan(referenceHalf) / Math.tan(currentHalf));
    out.dist = pose.dist * mapRadius * (1 + (fit - 1) * 0.35);
    if (journeyState.compact) {
      out.shiftX = 0;
      out.shiftY = PANEL_SHIFT_Y;
    } else {
      out.shiftX = side === "left" ? PANEL_SHIFT_X : side === "right" ? -PANEL_SHIFT_X : 0;
      out.shiftY = 0;
    }
    return out;
  };

  const blendPose = (a, b, t, out) => {
    out.target.lerpVectors(a.target, b.target, t);
    out.az = lerpAngle(a.az, b.az, t);
    out.el = lerp(a.el, b.el, t);
    // Zoom in log space so dolly speed feels constant.
    out.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t));
    out.fov = lerp(a.fov, b.fov, t);
    out.shiftX = lerp(a.shiftX, b.shiftX, t);
    out.shiftY = lerp(a.shiftY, b.shiftY, t);
    return out;
  };

  const dampPose = (current, goal, k) => {
    current.target.lerp(goal.target, k);
    current.az = lerpAngle(current.az, goal.az, k);
    current.el = lerp(current.el, goal.el, k);
    current.dist = Math.exp(lerp(Math.log(current.dist), Math.log(goal.dist), k));
    current.fov = lerp(current.fov, goal.fov, k);
    current.shiftX = lerp(current.shiftX, goal.shiftX, k);
    current.shiftY = lerp(current.shiftY, goal.shiftY, k);
  };

  // Which beat transition is running, and how far along it is.
  const readJourney = () => {
    const beats = journeyState.beats;
    let fromIndex = -1;
    let toIndex = -1;
    let t = 0;
    for (let i = 0; i < beats.length; i++) {
      const progress = beats[i].trigger ? beats[i].trigger.progress : 0;
      if (progress > 0) {
        fromIndex = i - 1;
        toIndex = i;
        t = progress;
      }
    }
    return { fromIndex, toIndex, t: easeInOut(clamp01(t)) };
  };

  // -------------------------------------------------------------------------
  // Duck locomotion

  const duckState = {
    u: 0,
    yaw: 0,
    walk: 0,
    phase: 0,
    previous: new THREE.Vector3(),
    hasPrevious: false,
  };

  const updateDuck = (dt, goalU, lookSide, reduced) => {
    if (!duckRoute) return;
    const follow = dampFactor(reduced ? 20 : 3, dt);
    duckState.u = lerp(duckState.u, goalU, follow);
    if (Math.abs(duckState.u - goalU) < 1e-5) duckState.u = goalU;

    const position = getDuckRoutePoint(duckState.u, duckPosition);
    const step = duckState.hasPrevious ? scratch.subVectors(position, duckState.previous) : scratch.set(0, 0, 0);
    const travelled = Math.hypot(step.x, step.z);
    duckState.previous.copy(position);
    duckState.hasPrevious = true;
    duckModel.position.copy(position);

    const speed = dt > 0 ? travelled / dt : 0;
    const walkGoal = clamp01(speed / (mapRadius * 0.04));
    duckState.walk = lerp(duckState.walk, walkGoal, dampFactor(walkGoal > duckState.walk ? 8 : 4, dt));

    // Short steps: the moves between stops are only a few strides long.
    const stride = mapRadius * 0.03;
    duckState.phase += travelled / stride;

    // The moves are short shuffles, so the duck keeps facing the camera
    // instead of turning to the walking direction (a full turn would sweep
    // its tail through the buildings around the plaza).
    let yawGoal = duckState.yaw;
    if (lookSide === "hero") {
      // The hero is calibrated with the duck in its authored orientation.
      yawGoal = 0;
    } else if (lookSide) {
      // Turn toward the camera, biased to the side of the text panel.
      cameraLocal.copy(camera.position);
      mapPivot.worldToLocal(cameraLocal);
      cameraLocal.sub(position).setY(0).normalize();
      cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
      cameraRight.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -mapPivot.rotation.y).setY(0).normalize();
      const sideSign = lookSide === "left" ? -1 : lookSide === "right" ? 1 : 0;
      cameraLocal.addScaledVector(cameraRight, sideSign * 0.9);
      yawGoal = Math.atan2(cameraLocal.x, cameraLocal.z) + DUCK_FORWARD_YAW;
    }
    duckState.yaw = lerpAngle(duckState.yaw, yawGoal, dampFactor(reduced ? 8 : 2.5, dt));
    duckModel.rotation.y = duckState.yaw;

    // Gentle procedural waddle on top of the skeletal clip, pivoting on the feet.
    const walk = reduced ? 0 : duckState.walk;
    const cycle = duckState.phase * Math.PI;
    duckBody.rotation.z = Math.sin(cycle) * 0.04 * walk;
    duckBody.rotation.x = 0.025 * walk;
    duckBody.position.y = Math.abs(Math.sin(cycle)) * mapRadius * 0.006 * walk;
  };

  // -------------------------------------------------------------------------
  // Case study pins

  const pinPoint = new THREE.Vector3();
  const updatePins = (width, height) => {
    if (!journeyState.pinsActive) return;
    journeyState.pins.forEach(({ el, id }) => {
      const anchor = PIN_ANCHORS[id];
      if (!anchor) return;
      pinPoint.set(anchor[0] * mapRadius, streetY + anchor[1] * mapRadius, anchor[2] * mapRadius);
      mapPivot.localToWorld(pinPoint);
      pinPoint.project(camera);
      const visible = pinPoint.z < 1 && Math.abs(pinPoint.x) < 1.1 && Math.abs(pinPoint.y) < 1.1;
      const x = (pinPoint.x * 0.5 + 0.5) * width;
      const y = (-pinPoint.y * 0.5 + 0.5) * height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle("is-offscreen", !visible);
      // Keep the hover preview on screen near the top and right edges.
      el.classList.toggle("is-below", y < height * 0.42);
      el.classList.toggle("is-flipped", x > width - 280);
    });
  };

  // -------------------------------------------------------------------------
  // Adaptive resolution: step the pixel ratio down if frames run long.

  let maxPixelRatio = 1.25;
  let pixelRatio = 0;
  let frameSamples = 0;
  let frameTimeSum = 0;
  const adaptResolution = (dt) => {
    if (dt <= 0 || dt > 0.25) return;
    frameTimeSum += dt;
    frameSamples += 1;
    if (frameSamples < 90) return;
    const average = frameTimeSum / frameSamples;
    frameSamples = 0;
    frameTimeSum = 0;
    if (average > 1 / 45 && pixelRatio > 0.7) {
      pixelRatio = Math.max(0.7, pixelRatio - 0.15);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(lastWidth, lastHeight, false);
    }
  };

  // -------------------------------------------------------------------------
  // Render loop

  let autoRotation = 0;
  let pivotRotation = 0;
  const pointerSmoothed = { x: 0, y: 0 };
  let dayTime = 0;
  let hasDayTime = false;
  let nightClock = 0;
  let visible = true;
  let pageVisible = !document.hidden;
  let frameId = 0;
  let lastRenderTimestamp = 0;
  // Safari/Firefox: the canvas bends itself under the liquid glass panels.
  const glassPass = createGlassPass(renderer);

  // Let capable phones use a smoother cadence. Adaptive resolution steps in
  // when the GPU cannot sustain it, while slower devices keep their frame
  // time stable instead of queuing work for every display refresh.
  const frameInterval = () => (isMobileLayout ? 1000 / 45 : 1000 / 45);
  const scheduleRender = () => {
    if (!frameId && visible && pageVisible) frameId = requestAnimationFrame(render);
  };

  const render = (timestamp) => {
    frameId = 0;
    if (!visible || !pageVisible) return;
    if (lastRenderTimestamp && timestamp - lastRenderTimestamp < frameInterval()) {
      scheduleRender();
      return;
    }
    lastRenderTimestamp = timestamp;
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.1);
    const time = timer.getElapsed();
    const reduced = journeyState.reducedMotion;

    if (mixer) mixer.update(delta);
    if (duckMixer) duckMixer.update(delta);

    if (loaded) {
      const { fromIndex, toIndex, t } = readJourney();
      const beats = journeyState.beats;
      const inHero = toIndex === -1;
      // Hero exit: the spin eases back to the authored orientation.
      const heroBlend = toIndex === 0 ? t : inHero ? 0 : 1;
      if (inHero && !reduced) {
        autoRotation = (autoRotation + (delta * TAU) / 90) % TAU;
      }
      const rotationGoal = lerpAngle(autoRotation, 0, heroBlend);
      pivotRotation = hasCurrentPose
        ? lerpAngle(pivotRotation, rotationGoal, dampFactor(6, delta))
        : rotationGoal;
      mapPivot.rotation.y = pivotRotation;

      // Clouds drift up and fade out while the hero leaves the screen.
      const cloudLift = heroBlend;
      cloudGroup.position.y = (cloudLift * mapRadius * 0.9) / mapModel.scale.y;
      cloudGroup.visible = cloudLift < 0.999;
      for (let i = 0; i < cloudMaterials.length; i++) {
        cloudMaterials[i].opacity = 1 - cloudLift;
      }
      mapPivot.updateMatrixWorld();

      if (inHero) {
        readHeroPose(goalPose);
      } else {
        const toBeat = beats[toIndex];
        const fromBeat = beats[fromIndex];
        if (fromBeat) readJourneyPose(fromBeat.id, fromBeat.side, pivotRotation, fromPose);
        else readHeroPose(fromPose);
        readJourneyPose(toBeat.id, toBeat.side, pivotRotation, toPose);
        blendPose(fromPose, toPose, t, goalPose);
      }

      if (!hasCurrentPose) {
        blendPose(goalPose, goalPose, 0, currentPose);
        hasCurrentPose = true;
      } else {
        dampPose(currentPose, goalPose, dampFactor(reduced ? 12 : journeyState.compact ? 5 : 4, delta));
      }

      // Subtle life: pointer parallax and a slow breathing drift.
      const pointerK = dampFactor(3, delta);
      pointerSmoothed.x = lerp(pointerSmoothed.x, reduced ? 0 : journeyState.pointer.x, pointerK);
      pointerSmoothed.y = lerp(pointerSmoothed.y, reduced ? 0 : journeyState.pointer.y, pointerK);
      const journeyAmount = inHero ? 0 : toIndex === 0 ? t : 1;
      const drift = reduced ? 0 : Math.sin(time * 0.21) * 0.018 * journeyAmount;
      const az = currentPose.az - pointerSmoothed.x * 0.05 * journeyAmount + drift;
      const el = THREE.MathUtils.clamp(currentPose.el + pointerSmoothed.y * 0.025 * journeyAmount, 0.04, 1.45);

      const cosEl = Math.cos(el);
      camera.position.set(
        currentPose.target.x + Math.sin(az) * cosEl * currentPose.dist,
        currentPose.target.y + Math.sin(el) * currentPose.dist,
        currentPose.target.z + Math.cos(az) * cosEl * currentPose.dist,
      );
      camera.lookAt(currentPose.target);
      camera.fov = currentPose.fov;
      if (Math.abs(currentPose.shiftX) > 1e-4 || Math.abs(currentPose.shiftY) > 1e-4) {
        camera.setViewOffset(
          lastWidth,
          lastHeight,
          -currentPose.shiftX * lastWidth,
          currentPose.shiftY * lastHeight,
          lastWidth,
          lastHeight,
        );
      } else if (camera.view?.enabled) {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Day cycle: eased on top of the (already smooth) scroll so sky, lights
      // and stars glide instead of tracking every wheel tick.
      const dayGoal = journeyState.dayTrigger ? journeyState.dayTrigger.progress : 0;
      dayTime = hasDayTime ? lerp(dayTime, dayGoal, dampFactor(reduced ? 20 : 7, delta)) : dayGoal;
      hasDayTime = true;
      const cycle = dayCycle(dayTime);
      applySky(cycle);

      const { golden, night } = cycle;
      gradeColor(hemiLight.color, grade.hemiSky, golden, night);
      gradeColor(hemiLight.groundColor, grade.hemiGround, golden, night);
      gradeColor(keyLight.color, grade.key, golden, night);
      gradeColor(fillLight.color, grade.fill, golden, night);
      hemiLight.intensity = gradeValue(grade.hemiIntensity, golden, night);
      keyLight.intensity = gradeValue(grade.keyIntensity, golden, night);
      fillLight.intensity = gradeValue(grade.fillIntensity, golden, night);
      renderer.toneMappingExposure = gradeValue(grade.exposure, golden, night);

      if (!reduced) nightClock += delta;
      stars.visible = cycle.stars > 0.001;
      if (stars.visible) {
        stars.position.copy(camera.position);
        stars.rotation.y = nightClock * 0.006;
        stars.material.uniforms.uOpacity.value = cycle.stars;
        stars.material.uniforms.uTime.value = nightClock;
        stars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      }

      const lampsOn = cycle.lamps > 0.001;
      lampUniforms.uLamps.value = cycle.lamps;
      lampUniforms.uTime.value = nightClock;
      lampUniforms.uViewport.value = (lastHeight * renderer.getPixelRatio()) / 2;
      if (lampHalos) lampHalos.visible = lampsOn;
      if (lampPools) lampPools.visible = lampsOn;
      for (let i = 0; i < windowMaterials.length; i++) {
        const { material, opacity } = windowMaterials[i];
        material.emissiveIntensity = cycle.lamps * 1.8;
        material.opacity = lerp(opacity, 0.92, cycle.lamps);
      }

      // Duck: walk to the stop of the beat being entered.
      const toId = inHero ? null : beats[toIndex].id;
      const fromId = fromIndex >= 0 ? beats[fromIndex].id : null;
      const fromStop = fromId ? POSES[fromId]?.stop : "start";
      const toStop = toId ? POSES[toId]?.stop : "start";
      const goalU = lerp(stopParams[fromStop] ?? 0, stopParams[toStop] ?? 0, t);
      const lookSide = inHero ? "hero" : t > 0.5 ? (journeyState.compact ? "center" : beats[toIndex].side) : null;
      updateDuck(delta, goalU, lookSide, reduced);

      updatePins(lastWidth, lastHeight);
      adaptResolution(delta);
    }

    renderer.render(scene, camera);
    if (glassPass) glassPass();
    scheduleRender();
  };

  // Stop drawing when the stage is scrolled out (e.g. content after it).
  const stage = canvas.closest(".experience") || canvas;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scheduleRender();
  }).observe(stage);

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (!pageVisible && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (pageVisible) {
      lastRenderTimestamp = 0;
      scheduleRender();
    }
  });

  window.addEventListener("resize", resize);
  resize();
  scheduleRender();
}
