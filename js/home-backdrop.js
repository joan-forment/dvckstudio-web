import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { SKY_GLSL } from "./liquid-glass-webgl.js";

// Low poly world around the floating city: a sea of clouds under it, a few
// small floating islets behind it and distant peaks on the horizon. Without
// it the low journey shots show the island alone on an empty gradient.
// Everything is built in map radii with y = 0 at the underside of the island,
// so it scales with the city on every breakpoint. Far geometry fades its
// alpha out instead of fogging to a colour, so the CSS sky (and the moon)
// behind the transparent canvas shows through at the horizon. The clouds are
// also tinted with the sky right behind them: the text panels float over
// them and white clouds would kill the contrast of their white copy.

const COLORS = {
  cloud: 0xf7f4f0,
  cloudFloor: 0xe4e8f1,
  grass: 0x7fc846,
  dirt: 0x6b4526,
  dirtDark: 0x4a301b,
  rock: 0x8c86a0,
  rockDark: 0x6a6582,
  snow: 0xf4f6fb,
  tree: 0x3f8a2e,
  pine: 0x2f6e2a,
  trunk: 0x5a3a22,
  wall: 0xf3e7d3,
  roof: 0xff8222,
};

// Hand placed so no islet ever sits between a journey camera and the city:
// the cameras all orbit on the +Z side (azimuth -1.1..1.0), so the islets
// stay behind the city or out at the far sides. angle = atan2(x, z).
const ISLETS = [
  { angle: 2.35, dist: 2.7, y: 0.22, size: 0.26, house: true },
  { angle: -2.7, dist: 2.9, y: 0.62, size: 0.18 },
  { angle: 3.1, dist: 4.3, y: 0.12, size: 0.34, house: true },
  { angle: 1.95, dist: 3.4, y: 0.72, size: 0.15 },
  { angle: -1.95, dist: 3.1, y: 0.18, size: 0.24, house: true },
  { angle: -2.3, dist: 5.2, y: 0.5, size: 0.3 },
  { angle: 2.2, dist: 5.6, y: -0.02, size: 0.36, house: true },
  { angle: -3.0, dist: 6.4, y: 0.85, size: 0.22 },
];

// Cloud sea level below the island underside, and how far it reaches.
const FLOOR_Y = -0.55;
const FLOOR_RADIUS = 14;
// View distance (map radii) where geometry starts fading, and where it is gone.
const HAZE_NEAR = 3;
const HAZE_FAR = 12;

// Deterministic layout: the same world on every visit.
const createRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Position hash: duplicated seam vertices get the same offset, so jittered
// shapes stay closed.
const hash = (x, y, z) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return value - Math.floor(value) - 0.5;
};

const jitter = (geometry, amount) => {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setXYZ(
      i,
      x + hash(x, y, z) * amount,
      y + hash(y, z, x) * amount,
      z + hash(z, x, y) * amount,
    );
  }
  return geometry;
};

const color = new THREE.Color();

// Flat, vertex coloured piece ready to merge (position + normal + color).
const part = (geometry, hex, matrix) => {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  if (flat !== geometry) geometry.dispose();
  flat.deleteAttribute("uv");
  if (matrix) flat.applyMatrix4(matrix);
  flat.computeVertexNormals();
  const colors = new Float32Array(flat.attributes.position.count * 3);
  color.setHex(hex);
  for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
  flat.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return flat;
};

// Recolour whole triangles by the height of their centre (snow caps).
const paintByHeight = (geometry, pick) => {
  const position = geometry.attributes.position;
  const colors = geometry.attributes.color;
  for (let i = 0; i < position.count; i += 3) {
    const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3;
    color.setHex(pick(y));
    for (let v = 0; v < 3; v++) colors.setXYZ(i + v, color.r, color.g, color.b);
  }
};

const matrix = (x = 0, y = 0, z = 0, rotationY = 0, scale = 1, scaleY = scale) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotationY),
    new THREE.Vector3(scale, scaleY, scale),
  );

const buildTree = (s, x, z, random) => {
  const turn = random() * Math.PI;
  const parts = [
    part(new THREE.CylinderGeometry(s * 0.03, s * 0.04, s * 0.16, 5), COLORS.trunk, matrix(x, s * 0.08, z, turn)),
  ];
  if (random() < 0.45) {
    parts.push(part(new THREE.ConeGeometry(s * 0.12, s * 0.34, 6), COLORS.pine, matrix(x, s * 0.3, z, turn)));
  } else {
    const r = s * (0.11 + random() * 0.05);
    parts.push(part(new THREE.IcosahedronGeometry(r, 0), COLORS.tree, matrix(x, s * 0.16 + r * 0.8, z, turn)));
  }
  return parts;
};

// Grass cap on a jagged earth root, with a few trees and maybe a house.
// Origin at the top centre of the grass.
const buildIslet = ({ size: s, house }, random) => {
  const parts = [
    part(jitter(new THREE.CylinderGeometry(s, s * 0.9, s * 0.14, 8), s * 0.05), COLORS.grass, matrix(0, -s * 0.07)),
    part(
      jitter(new THREE.ConeGeometry(s * 0.9, s * 1.2, 8, 2).rotateX(Math.PI), s * 0.14),
      COLORS.dirt,
      matrix(0, -s * 0.74),
    ),
    part(
      jitter(new THREE.ConeGeometry(s * 0.45, s * 0.7, 6).rotateX(Math.PI), s * 0.1),
      COLORS.dirtDark,
      matrix(s * 0.3, -s * 0.5, -s * 0.2, random() * Math.PI),
    ),
  ];

  const trees = 2 + Math.floor(random() * 3);
  const start = random() * Math.PI * 2;
  for (let i = 0; i < trees; i++) {
    // Keep the trees on one side when there is a house in the middle.
    const angle = start + (i / trees) * (house ? Math.PI : Math.PI * 2);
    const r = s * (house ? 0.62 : 0.2 + random() * 0.45);
    parts.push(...buildTree(s, Math.sin(angle) * r, Math.cos(angle) * r, random));
  }

  if (house) {
    const turn = random() * Math.PI;
    const x = Math.sin(start + Math.PI * 1.5) * s * 0.2;
    const z = Math.cos(start + Math.PI * 1.5) * s * 0.2;
    parts.push(
      part(new THREE.BoxGeometry(s * 0.34, s * 0.24, s * 0.28), COLORS.wall, matrix(x, s * 0.12, z, turn)),
      part(new THREE.ConeGeometry(s * 0.29, s * 0.2, 4).rotateY(Math.PI / 4), COLORS.roof, matrix(x, s * 0.34, z, turn)),
    );
  }
  return mergeGeometries(parts);
};

// Flattened puffs clustered along the cloud sea.
const buildCloudPuffs = (count, random) => {
  const parts = [];
  for (let i = 0; i < count; i++) {
    // Denser near the island, thinning out towards the horizon.
    const dist = 0.3 + Math.pow(random(), 1.4) * 6.5;
    const angle = random() * Math.PI * 2;
    const cx = Math.sin(angle) * dist;
    const cz = Math.cos(angle) * dist;
    const heading = random() * Math.PI;
    const puffs = 3 + Math.floor(random() * 3);
    for (let p = 0; p < puffs; p++) {
      const r = 0.1 + random() * 0.18;
      const along = (p / (puffs - 1) - 0.5) * 0.5;
      const x = cx + Math.cos(heading) * along + (random() - 0.5) * 0.08;
      const z = cz + Math.sin(heading) * along + (random() - 0.5) * 0.08;
      // Bigger puffs in the middle of the cluster sit higher.
      const lift = r * 0.3 * (1 - Math.abs(along) * 2);
      parts.push(
        part(new THREE.IcosahedronGeometry(r, dist < 3 ? 1 : 0), COLORS.cloud, matrix(x, FLOOR_Y + lift, z, random() * Math.PI, 1, 0.55)),
      );
    }
  }
  return mergeGeometries(parts);
};

// Faceted, gently rolling sheet that fills the gaps between the puffs.
const buildCloudFloor = () =>
  part(
    jitter(new THREE.RingGeometry(0.001, FLOOR_RADIUS, 40, 18).rotateX(-Math.PI / 2), 0.12),
    COLORS.cloudFloor,
    matrix(0, FLOOR_Y - 0.04),
  );

// Snow capped peaks rising out of the cloud sea, all around the horizon.
const buildPeaks = (count, random) => {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.35;
    const dist = 7 + random() * 3;
    const height = 0.9 + random() * 1.3;
    const radius = 0.8 + random() * 0.7;
    const base = FLOOR_Y - 0.25;
    const peak = part(
      jitter(new THREE.ConeGeometry(radius, height, 6, 3), 0.18),
      COLORS.rock,
      matrix(Math.sin(angle) * dist, base + height / 2, Math.cos(angle) * dist, random() * Math.PI),
    );
    const snowLine = base + height * (0.62 + random() * 0.12);
    const shadeLine = base + height * 0.3;
    paintByHeight(peak, (y) => (y > snowLine ? COLORS.snow : y > shadeLine ? COLORS.rock : COLORS.rockDark));
    parts.push(peak);
  }
  return mergeGeometries(parts);
};

export const createBackdrop = ({ radius, compact }) => {
  const random = createRandom(20260925);
  const uniforms = {
    uHazeNear: { value: HAZE_NEAR * radius },
    uHazeFar: { value: HAZE_FAR * radius },
    uDusk: { value: 0 },
    uNight: { value: 0 },
    uViewHeight: { value: 1 },
  };
  // skyMix: how much of the sky colour behind a fragment replaces its own.
  const createMaterial = (key, skyMix) => {
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      transparent: true,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms, { uSkyMix: { value: skyMix } });
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vHazeDistance;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvHazeDistance = length(mvPosition.xyz);");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uHazeNear;
          uniform float uHazeFar;
          uniform float uDusk;
          uniform float uNight;
          uniform float uViewHeight;
          uniform float uSkyMix;
          varying float vHazeDistance;
          ${SKY_GLSL}`,
        )
        .replace(
          "#include <dithering_fragment>",
          /* glsl */ `#include <dithering_fragment>
          float haze = smoothstep(uHazeNear, uHazeFar, vHazeDistance);
          vec3 sky = skyAt(clamp(1.0 - gl_FragCoord.y / uViewHeight, 0.0, 1.0));
          // Aerial perspective, then fade out into the CSS sky.
          gl_FragColor.rgb = mix(gl_FragColor.rgb, sky, mix(uSkyMix, 1.0, haze * 0.6));
          gl_FragColor.a *= 1.0 - haze;`,
        );
    };
    material.customProgramCacheKey = () => `home-backdrop-${key}`;
    return material;
  };
  const materials = {
    solid: createMaterial("solid", 0.18),
    puffs: createMaterial("puffs", 0.45),
    floor: createMaterial("floor", 0.62),
  };

  const root = new THREE.Group();
  root.name = "backdrop";
  // Rises into place as the hero clears; `root` itself is placed by the caller.
  const lift = new THREE.Group();
  root.add(lift);

  // Back to front, and before the lamp glows (renderOrder 0) so their halos
  // are never painted over; the stars (-1) stay behind everything.
  const addMesh = (geometry, material, renderOrder) => {
    geometry.scale(radius, radius, radius);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    mesh.frustumCulled = false;
    lift.add(mesh);
    return mesh;
  };

  addMesh(buildPeaks(compact ? 11 : 16, random), materials.solid, -0.8);
  addMesh(buildCloudFloor(), materials.floor, -0.6);
  const puffs = addMesh(buildCloudPuffs(compact ? 40 : 70, random), materials.puffs, -0.4);
  const islets = ISLETS.map((islet) => {
    const mesh = addMesh(buildIslet(islet, random), materials.solid, -0.2);
    mesh.position.set(Math.sin(islet.angle) * islet.dist, islet.y, Math.cos(islet.angle) * islet.dist).multiplyScalar(radius);
    mesh.rotation.y = random() * Math.PI * 2;
    return { mesh, baseY: mesh.position.y, phase: random() * Math.PI * 2 };
  });

  let clock = 0;
  const update = (delta, { reveal, dusk, night, viewHeight, reduced }) => {
    root.visible = reveal > 0.001;
    if (!root.visible) return;
    Object.values(materials).forEach((material) => {
      material.opacity = reveal;
    });
    uniforms.uDusk.value = dusk;
    uniforms.uNight.value = night;
    uniforms.uViewHeight.value = viewHeight;
    lift.position.y = -(1 - reveal) * radius * 0.35;
    if (reduced) return;
    clock += delta;
    // Slow drift and bob: alive, never distracting.
    puffs.rotation.y = clock * 0.004;
    islets.forEach(({ mesh, baseY, phase }) => {
      mesh.position.y = baseY + Math.sin(clock * 0.45 + phase) * radius * 0.025;
    });
  };

  return { object: root, update };
};
