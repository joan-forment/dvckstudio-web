// Blog cover images: Claude writes three scene ideas for a title, ComfyUI
// renders them locally (Z-Image Turbo) in the house low-poly Y2K style, and ffmpeg
// grades and exports the chosen one to public/blog-images (see content.mjs).
import fs from "fs";
import path from "path";
import { IMAGES_DIR, ROOT } from "./content.mjs";
import { askClaude, extractJson, run } from "./claude.mjs";

export const COMFY_URL = process.env.COMFY_URL || "http://127.0.0.1:8188";
// Raw renders, one folder per post. _source-assets is never deployed.
export const COVERS_DIR = path.join(ROOT, "_source-assets/blog-covers");

// Shared by every cover so the blog reads as one series: PS2-era low-poly,
// cel-shaded, Y2K street culture (references in _source-assets/references/).
// Tested on 2026-09-25: "fisheye", "GoPro" or "barrel distortion" paint black
// round borders, so the lens stays plain wide-angle and the chromatic
// aberration and grain are added by GRADE instead. Character proportions
// ("chunky sneakers") in here put sneakers on robots and props, so clothes
// come from the art director's scene.
const STYLE =
  "Low-poly 3D render in the style of a 2001 PlayStation 2 / Dreamcast game like Jet Set Radio, Y2K aesthetic, made in Blender. Everything is built from a few large flat polygons: faceted angular faces, blocky hands, chunky geometric shoes and props, visible hard polygon edges on characters, objects and walls, no smooth surfaces. Toon cel-shading with two flat tones and hard-edged shadows, thick uneven black ink outlines around every shape like a manga drawing, crunchy low-resolution hand-painted textures with visible square pixels, grime, scuffs, stickers and paint drips. Moody game lighting: warm key light, deep black shadows, colored rim light, bloom on highlights. Comic effects floating in 3D space: jagged starburst shapes, halftone dot patches, speed lines, dizzy spirals. Deep saturated tangerine orange (#FF8222) sky or backdrop fills most of the frame. Accent colors: cobalt blue, lime green, hot pink and off-white; high contrast. Wide-angle lens with strong perspective, low dynamic camera angle, slight dutch tilt. The image fills the whole 16:9 frame edge to edge, evenly lit corners. All products are unbranded. Not a Pixar render, not smooth, not realistic. No text, no letters, no words, no numbers, no logos, no watermark, no software interface, no vignette, no black borders, no frame.";

// The model paints the sky ~236,114,50. This lifts it to the brand #FF8222
// (measured ~254,125,40) and adds the slight RGB split and grain of the references.
const GRADE = "colorlevels=rimax=0.93:gimax=0.94,eq=saturation=1.12,rgbashift=rh=-2:bh=2,noise=alls=5:allf=u";

// 16:9-ish and a multiple of 16, as the model expects; cropped to 1600x900.
const RENDER = { width: 1664, height: 928 };

export async function comfyAvailable() {
  try {
    return (await fetch(`${COMFY_URL}/system_stats`, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

// Z-Image Turbo text-to-image, same nodes as ComfyUI's own template.
const workflow = (prompt, seed) => ({
  1: { class_type: "UNETLoader", inputs: { unet_name: "z_image_turbo_bf16.safetensors", weight_dtype: "default" } },
  2: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2" } },
  3: { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
  4: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["1", 0], shift: 3 } },
  5: { class_type: "CLIPTextEncode", inputs: { clip: ["2", 0], text: prompt } },
  6: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["5", 0] } },
  7: { class_type: "EmptySD3LatentImage", inputs: { ...RENDER, batch_size: 1 } },
  8: {
    class_type: "KSampler",
    inputs: {
      model: ["4", 0], positive: ["5", 0], negative: ["6", 0], latent_image: ["7", 0],
      seed, steps: 8, cfg: 1, sampler_name: "res_multistep", scheduler: "simple", denoise: 1,
    },
  },
  9: { class_type: "VAEDecode", inputs: { samples: ["8", 0], vae: ["3", 0] } },
  10: { class_type: "SaveImage", inputs: { images: ["9", 0], filename_prefix: "dvck-blog" } },
});

// Queues one render and waits for the PNG. Takes ~15-25 s on an RTX 5070 Ti.
async function render(scene, seed) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow(`${scene} ${STYLE}`, seed) }),
  });
  const queued = await res.json();
  if (!res.ok) throw new Error(`ComfyUI rechazó el encargo: ${JSON.stringify(queued.error || queued)}`);

  const started = Date.now();
  while (Date.now() - started < 5 * 60_000) {
    await new Promise((r) => setTimeout(r, 1000));
    const entry = (await (await fetch(`${COMFY_URL}/history/${queued.prompt_id}`)).json())[queued.prompt_id];
    if (entry?.status?.status_str === "error") throw new Error("ComfyUI falló al generar la imagen.");
    const image = entry?.outputs?.["10"]?.images?.[0];
    if (!image) continue;
    const params = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
    return Buffer.from(await (await fetch(`${COMFY_URL}/view?${params}`)).arrayBuffer());
  }
  throw new Error("ComfyUI tardó más de 5 minutos.");
}

async function ffmpeg(args) {
  // run() goes through the shell: quote filters and paths that have spaces.
  const quoted = args.map((a) => (/\s/.test(a) ? `"${a}"` : a));
  const { ok, output } = await run("ffmpeg", ["-loglevel", "error", "-y", ...quoted], { capture: true });
  if (!ok) throw new Error(`ffmpeg: ${output.trim() || "no se pudo ejecutar (¿está en el PATH?)"}`);
}

// Three scene ideas for one post, from a Claude session acting as art director.
export async function sceneIdeas({ slug, title, description, category }) {
  const prompt = fs
    .readFileSync(path.join(ROOT, "scripts/blog/art-director-prompt.md"), "utf8")
    .replace("{{TITLE}}", title)
    .replace("{{DESCRIPTION}}", description || "")
    .replace("{{CATEGORY}}", category || "");
  // One prompt file per post: several jobs can ask for scenes at the same time.
  const { ok, output } = await askClaude(prompt, `art-director-${slug}`, { capture: true });
  if (!ok) throw new Error("Claude no ha podido proponer escenas para la portada.");
  const ideas = extractJson(output);
  const list = Array.isArray(ideas) ? ideas : ideas.concepts;
  if (!Array.isArray(list) || !list.length) throw new Error("El director de arte no ha devuelto escenas.");
  return list.slice(0, 3).map((c) => ({ scene: String(c.scene), alt: String(c.alt || "") }));
}

// Renders one candidate into _source-assets/blog-covers/<slug>/<id>.png (graded)
// plus a small JPEG preview for the studio page.
export async function renderCandidate(slug, id, scene) {
  const dir = path.join(COVERS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  const raw = path.join(dir, `${id}-raw.png`);
  fs.writeFileSync(raw, await render(scene, Math.floor(Math.random() * 2 ** 32)));
  const graded = path.join(dir, `${id}.png`);
  await ffmpeg(["-i", raw, "-vf", `${GRADE},scale=-2:900,crop=1600:900`, graded]);
  await ffmpeg(["-i", graded, "-vf", "scale=800:450", "-q:v", "3", path.join(dir, `${id}.jpg`)]);
  fs.unlinkSync(raw);
  return { png: graded, preview: path.join(dir, `${id}.jpg`) };
}

// Exports the chosen candidate to the three files the blog looks for.
export async function applyCover(slug, id) {
  const source = path.join(COVERS_DIR, slug, `${id}.png`);
  if (!fs.existsSync(source)) throw new Error(`No existe la portada ${id} de ${slug}.`);
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const out = (name) => path.join(IMAGES_DIR, name);
  await ffmpeg(["-i", source, "-c:v", "libwebp", "-quality", "82", out(`${slug}.webp`)]);
  await ffmpeg(["-i", source, "-vf", "scale=800:450", "-c:v", "libwebp", "-quality", "80", out(`${slug}-800.webp`)]);
  await ffmpeg(["-i", source, "-vf", "scale=1200:-2,crop=1200:630", "-q:v", "3", out(`${slug}-og.jpg`)]);
}

// Front matter edit without a YAML round trip, so comments and order survive.
export function setFrontMatterField(file, key, value) {
  const text = fs.readFileSync(file, "utf8");
  const end = text.indexOf("\n---", 4);
  let head = text.slice(0, end);
  const line = `${key}: ${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}:.*$`, "m");
  head = pattern.test(head) ? head.replace(pattern, line) : head.replace(/^(description:.*)$/m, `$1\n${line}`);
  fs.writeFileSync(file, head + text.slice(end));
}
