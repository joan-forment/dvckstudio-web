# AGENTS.md — dvckstudio.com

Guía para agentes de IA que trabajan en la web de DvckStudio. Léela entera antes de tocar código.

## Qué es

Web del estudio creativo DvckStudio (dominio `https://dvckstudio.com`, idioma `es-ES`).
Multi-page estática con Vite 8, JavaScript vanilla (ES modules), Three.js, GSAP y Lenis.
Sin framework, sin TypeScript y sin tests automáticos.

## Reglas de oro

1. **No es un repo git.** No hay historial ni `git revert`. Antes de un cambio grande o masivo, copia los archivos afectados al scratchpad o a una carpeta de backup.
2. **Cambios mínimos y verificados.** Cada cambio termina con `npm run build` sin errores y una comprobación visual (ver "Verificar").
3. **No borres archivos sin confirmar con el usuario**, aunque parezcan código muerto (ver "Deuda conocida").
4. **Mantén el estilo del código que rodea al cambio**: nombres, densidad de comentarios (comentarios en inglés que explican el *porqué*), `const` por defecto, módulos pequeños por feature.
5. **Todo el texto visible va en español de España.** El código y los comentarios, en inglés.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run host` | Dev accesible desde el móvil en la red local |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la build real |
| `npm run optimize:models` | Comprime con Draco los GLB de `_source-assets/models/` a `public/home/` |
| `npm run blog` | Estado del blog y "¿publicar el siguiente borrador?" (s/N) |
| `npm run blog:publish [-- slug]` | Publica el siguiente borrador (o ese) con fecha de hoy y hace el build |
| `npm run blog:unpublish -- slug` | Devuelve un post a borradores |
| `npm run blog:draft [-- N]` | Claude Code investiga y escribe un borrador nuevo (con N, solo si hay menos de N en cola) |
| `npm run blog:studio` | Estudio del blog en `localhost:5190`: 10 propuestas, portadas y programación |
| `npm run blog:propose` / `blog:release` | Tareas de las 07:00 y las 09:00 (L-V); ver "Blog" |
| `npm run blog:deploy` (`-- --full` o `-- --check`) | Sube `dist/` a Hostinger por FTP (solo lo que ha cambiado) |

`dist/` es salida generada. No la edites a mano.

## Estructura

```
*.html              Una página por archivo (raíz del proyecto)
css/                Un CSS por página o componente; globals.css define tokens y tipografía
js/                 Un módulo por feature; se cargan con <script type="module" src="/js/...">
public/             Assets servidos tal cual (ya optimizados)
_source-assets/     Originales sin comprimir (no se despliegan: .vercelignore)
content/blog/       Artículos del blog en Markdown: posts/ (publicados) y drafts/ (cola)
scripts/blog/       Generador del blog (plugin de Vite), CLI y encargo para redactar borradores
blog.html, blog/    GENERADOS por scripts/blog en cada dev/build. No los edites ni los borres a mano
vite.config.js      Entradas multi-page + plugin que crea /ruta/index.html en dist
vercel.json         Redirects, rewrites y cabeceras de caché/seguridad (Vercel)
public/.htaccess    Las mismas reglas para Hostinger (Apache/LiteSpeed)
```

### Páginas

| Ruta | HTML | CSS propio | JS propio |
| --- | --- | --- | --- |
| `/` | `index.html` | `home.css`, `home-journey.css`, `liquid-glass.css`, `site-footer.css` | `home-journey.js`, `home-model.js`, `home-backdrop.js` |
| `/studio` | `studio.html` | `studio.css`, `home.css`, `liquid-glass.css`, `footer.css` | `studio-hero.js`, `team-cards.js`, `clients.js` |
| `/work` | `work.html` | `work.css` | `work.js` (datos de proyectos al inicio del archivo) |
| `/contact` | `contact.html` | `contact.css`, `home-journey.css`, `footer.css` | `contact.js` (cubo 3D), `contact-form.js` |
| `/sample-project` | `sample-project.html` | `project.css`, `footer.css` | — |
| `/links` | `links.html` | `links.css` | — |
| `/blog`, `/blog/<slug>`, `/blog/categoria/<cat>` | generados desde `content/blog` | `blog.css`, `site-footer.css` | `blog.js` |
| 404 | `404.html` | `not-found.css` | — |

Todas las páginas (salvo `links` y `404`) comparten: `globals.css`, `nav.css`, `lenis-scroll.js`, `click-spark.js`, `animated-copy.js`, `nav.js`.

### Módulos clave

- `js/home-journey.js`: coreografía del scroll de la home con ScrollTrigger. Exporta `journeyState`, `dayCycle` y `applySky`. El 3D solo lee ese estado, nunca el DOM. En táctil (`touchQuery`) las tarjetas usan el sticky nativo y solo se desvanecen: no les pongas `y`, inclinación ni transforms que compensen el scroll, porque el scroll nativo va en el compositor y el JS llega un frame tarde (tiembla).
- `js/home-model.js`: escena Three.js (ciudad + pato). Las poses de cámara están en `POSES` y la ruta del pato en `DUCK_ROUTE`, en unidades de radio del mapa. Las constantes de ajuste fino están arriba del archivo con comentarios.
- `js/home-backdrop.js`: mundo low poly procedural alrededor de la ciudad (mar de nubes, islotes flotantes con casas de tejado naranja y montañas lejanas), en radios del mapa con `y = 0` en la base de la isla. Solo aparece en el recorrido: entra con `heroBlend`, así que el hero no cambia. Lo lejano se desvanece en alfa para que se vea el cielo CSS, y las nubes se tiñen con el color del cielo detrás (`SKY_GLSL`, exportado desde `liquid-glass-webgl.js`) para no quitar contraste al texto blanco de los paneles. Los islotes están en `ISLETS`, siempre detrás de la ciudad respecto a las cámaras del recorrido (que orbitan por el lado +Z); si añades una pose con otro acimut, comprueba que ningún islote se cruce.
- `js/liquid-glass.js`: efecto de cristal con filtros SVG. Chromium con puntero fino refracta con `backdrop-filter: url()`. WebKit no admite filtros SVG en `backdrop-filter`, así que en Safari y Firefox de escritorio (clase `lg-canvas`) la home refracta dentro del propio WebGL: `js/liquid-glass-webgl.js` copia el frame tras `renderer.render()` y redibuja el borde de cada panel con el mismo desplazamiento y separación RGB. Solo dobla la ciudad, no el DOM que haya entre el canvas y el cristal; si cambias los degradados de `.experience-sky`, `-dusk` o `-night`, actualiza `SKY_GLSL` en ese módulo (lo usan también las nubes de `home-backdrop.js`). El resto (móvil, `/studio` fuera de Chromium) usa el fallback CSS (blur mínimo y borde/aberración simulados con `box-shadow` en `--lg-fake-rim`). No quites ese fallback.
- `js/lead-form.js`: validación y envío AJAX a FormSubmit (`contact@dvckstudio.com`), con POST normal como fallback sin JS. Lo usan la home y `/contact`. Mantén el honeypot `_honey` y `_next`.
- `js/lead-modal.js`: en la home, los enlaces con `data-lead-modal` (el CTA del hero y los botones naranjas de las tarjetas que iban a `#contacto`) abren el formulario en un `<dialog>` sobre el fondo oscurecido (sin desenfoque, para que el cristal refracte la escena nítida). Sin JS siguen bajando a `#contacto`. Al abrirse, el título, la descripción y el botón del hero salen con un timeline GSAP reversible (SplitText por letras) que se invierte al cerrar. El botón solo se anima con `transform`: una opacidad menor que 1 vacía el cristal (backdrop root) y luego reaparece de golpe. Las sombras del hero son `filter: drop-shadow`, no `text-shadow`, para que el split no las parta. Si el botón está en una tarjeta del journey, la tarjeta baja un poco, encoge y se desvanece (clase `is-modal-away`, con `translate`, `scale` y la variable registrada `--j-modal`); el modal entra cuando la tarjeta ya se ha ido y la tarjeta vuelve cuando el modal ya se ha cerrado, nunca a la vez; su `data-service` sigue preseleccionando servicios. Para que otro botón abra el modal, añádele `data-lead-modal`. Solo se cierra con la X: ni clic en el fondo ni Escape (decisión del usuario, para no perder un formulario a medias). Al abrirse, el foco va al email (puntero fino) o al título (táctil, `tabindex="-1"`), nunca a la X; por eso el fade del contenido usa `opacity` y no `autoAlpha` (`visibility: hidden` impediría enfocar).
- `js/lenis-scroll.js`: scroll suave solo en escritorio. En táctil o `max-width: 1000px` se usa scroll nativo (`window.lenis = null`). Cualquier código que use Lenis debe tolerar `null`.
- `js/animated-copy.js`: animaciones de texto con SplitText mediante atributos `data-animate-*` en el HTML.

## Blog

- **Contenido:** un Markdown por artículo. `content/blog/posts/` se publica; `content/blog/drafts/` es la cola que espera el OK del usuario. El nombre del archivo es la URL (`/blog/<slug>`). Formato del front matter y reglas de redacción: `scripts/blog/writer-prompt.md` (lo usa también `npm run blog:draft`).
- **Generación:** `scripts/blog/vite-plugin.mjs` escribe `blog.html`, `blog/<slug>.html`, `blog/categoria/*.html` y `blog/pagina/N.html` antes de que Vite lea las entradas, emite `blog/rss.xml` y actualiza el bloque `blog:start … blog:end` de `public/sitemap.xml`. No toques ese bloque a mano. En `npm run dev` salen también los borradores, marcados y con `noindex`; en el build, nunca.
- **Plantillas:** `scripts/blog/templates.mjs` copia el `<head>`, la navegación y el pie de las páginas hechas a mano (`site-footer` de la home). Si cambias esas partes en los HTML, cámbialas también ahí.
- **Validación:** el build falla si falta `title`, `description` o una `category` válida (`ia`, `desarrollo`, `diseno`, `seo`, `negocio`), si el título lleva "Duck Studio" o si el cuerpo tiene un `#` (el título ya es el h1). Un enlace a `/blog/<slug>` que aún no está publicado sale como texto hasta que lo esté.
- **Imágenes:** una portada por post en `public/blog-images/`, con el slug como nombre: `<slug>.webp` (1600×900, portada del post y JSON-LD), `<slug>-800.webp` (800×450, tarjetas) y `<slug>-og.jpg` (1200×630, redes). Se detectan por nombre; no hace falta tocar el Markdown salvo `imageAlt` (alt descriptivo en español). Sin imagen, la tarjeta sale sin foto y el build avisa. En el post, la portada ocupa la mitad derecha del hero a toda altura (recorte centrado, casi vertical) y el hero llena el primer viewport, de modo que la hoja blanca (sin esquinas redondeadas) empieza justo debajo; en móvil la imagen va arriba a 16:9 (decisión del usuario, 2026-09-25). Si reemplazas una imagen, cámbiale el nombre o espera la caché de 7 días.
- **Lectura visual (decisión del usuario, 2026-09-25, pensada para TDAH):** los posts no pueden ser un muro de texto. `content.mjs` convierte `> [!TRUCO|OJO|VENTAJA|DATO|EJEMPLO] título` (y los párrafos que empiezan por `**La trampa**:`, `**Truco**:`…) en avisos, y `## 3. Título` en una chapa numerada. `blog.css` pinta las listas como tarjetas y pasos, la negrita como subrayador y el `tldr` como tarjetas. `blog.js` añade el "modo prisa" (solo encabezados, listas, avisos y el primer párrafo de cada sección; se recuerda en `localStorage`), la píldora "3/9 · quedan 2 min" y el confeti de la meta final. El pato de la barra de progreso es CSS (`animation-timeline`). Reglas de redacción en "Que se vea, no solo que se lea" de `writer-prompt.md`.
- **SEO:** cada post lleva `BlogPosting` + `BreadcrumbList` en JSON-LD con la organización de la home como autor y editor. Las categorías con menos de 3 posts son `noindex` y no van al sitemap.
- **Publicar es decisión del usuario.** Nunca muevas un borrador a `posts/` ni despliegues sin que lo pida. Lo aprueba en el estudio (Programar o Publicar ahora) o con `npm run blog`.
- **Flujo diario (decisión del usuario, 2026-09-25):** un post al día de lunes a viernes, solo de IA, programación y diseño, de actualidad y útil.
  1. 07:00: `npm run blog:propose` deja 10 propuestas verificadas en `content/studio/proposals/<fecha>.json` (`scripts/blog/proposer-prompt.md`).
  2. El usuario abre el estudio (`npm run blog:studio` o el acceso directo "Estudio del blog" del escritorio) y elige una propuesta o un borrador antiguo.
  3. Claude escribe y otra sesión verifica (`writer-prompt.md` con el tema asignado y `reviewer-prompt.md`). A la vez, `scripts/blog/covers.mjs` pide 3 escenas a Claude (`art-director-prompt.md`) y las genera en ComfyUI.
  4. El usuario lee, elige portada y pulsa Programar (siguiente día laborable libre a las 09:00) o Publicar ahora.
  5. 09:00: `npm run blog:release` publica lo que toca, hace el build y sube `dist/` a Hostinger (`scripts/blog/deploy.mjs`).
  El estado vive en `content/studio/state.json`. `scripts/blog/programar-blog.ps1` registra las dos tareas de Windows y el acceso directo (`-Quitar` las elimina). Claude Code corre sin hooks personales y solo puede escribir el archivo del borrador. Registros en `content/studio/logs/`.
- **Portadas (decisión del usuario, 2026-09-25; sustituye a la plastilina):** 3D low poly Y2K, como un fotograma de un juego callejero de PS2 o Dreamcast (Jet Set Radio): modelos facetados, sombreado cartoon con sombras duras, contornos negros de tinta, texturas pixeladas y sucias, efectos de cómic (estallidos, tramas de puntos, espirales), escenas ricas y cielo o fondo naranja de marca. Referencias en `_source-assets/references/low-poly-y2k-3d/`. No pidas "fisheye", "GoPro" ni "barrel distortion" en el prompt: pintan bordes negros redondos; la aberración cromática y el grano los pone `GRADE`. Se generan en local con ComfyUI Desktop (`http://127.0.0.1:8188`) y Z-Image Turbo (Apache 2.0, uso comercial permitido; no uses modelos con licencia no comercial como FLUX dev). El estilo fijo (`STYLE`) y la corrección de color a `#FF8222` (`GRADE`, ffmpeg) están en `covers.mjs`. Los renders van a `_source-assets/blog-covers/<slug>/`; al publicar solo se guarda el elegido.
- **Hostinger:** las credenciales FTP están fuera del proyecto, en el almacén de credenciales de Windows (recurso `dvckstudio`, nombre `hostinger.env`). Nunca las copies al repo ni a `dist/`. El despliegue nunca borra archivos del servidor. Tras subir, `deploy.mjs` avisa a IndexNow (Bing, DuckDuckGo, Yandex) de las páginas cambiadas; la clave es `public/09279787d54e3e2a018813dbe1869c63.txt`: no la borres ni la renombres.
- **Colores (decisión del usuario):** nunca texto negro sobre naranja. Sobre el naranja, texto blanco; tarjetas blancas con acentos naranjas; el negro solo como tinta sobre blanco o como fondo (TL;DR, código, CTA).
- **Rutas:** `vercel.json` reescribe `/blog/:path` a `.html` y redirige `.html` y la barra final; en Hostinger lo resuelve `public/.htaccess` de forma genérica.

## Añadir una página nueva

Todos estos pasos son obligatorios; si falta uno, la ruta limpia se rompe en algún hosting.

1. Crea `nueva.html` copiando el `<head>` de una página existente (meta, OG, Twitter, canonical, JSON-LD, iconos, `speculationrules`).
2. Añade la entrada en `build.rollupOptions.input` de `vite.config.js`.
3. Añade la ruta a `cleanRoutes` en el plugin de `vite.config.js`.
4. En `vercel.json`: rewrite `/nueva` → `/nueva.html` y redirects de `/nueva.html` y `/nueva/` → `/nueva`.
5. `public/.htaccess` resuelve rutas limpias de forma genérica; comprueba que no hace falta una regla nueva.
6. Añade la URL a `public/sitemap.xml` con `lastmod` actualizado.
7. Enlázala desde la navegación (`nav` en cada HTML) si procede.

## Voz de marca

Todo texto de marca (blog, redes, copys nuevos) sigue `VOZ-DE-MARCA.md`: vacilona, irónica, clickbait honrado, con tacos e insultos de colega, y siempre útil. Sus límites (nada de hechos falsos ni insultos a personas reales o colectivos) no se negocian. Los textos legales y los formularios siguen siendo claros y neutros.

## Estilo y diseño

- Tokens en `css/globals.css`: `--l` naranja `#FF8222` (fondo), `--d` blanco (texto), `--black` `#080808`, `--f-h` Humane (titulares, mayúsculas), `--f-nm` Neue Montreal (texto). Usa los tokens; no metas colores ni fuentes sueltas.
- Los titulares usan `clamp()` con `vw`. Revisa siempre móvil (390 px) y escritorio (1440 px).
- Las máscaras de SplitText tienen padding extra para no cortar tildes en mayúsculas (Í, Ó, Á, Ñ). No lo quites.
- `* { user-select: none }` es global; los campos, `mailto:` y `tel:` lo reactivan. Si añades texto que se deba poder copiar, reactívalo ahí.
- Respeta `prefers-reduced-motion`: toda animación nueva necesita versión reducida o desactivada.
- Las transiciones entre páginas usan `@view-transition { navigation: auto; }`, declarado al principio del `<head>`.

## Rendimiento

- **Presupuesto:** `public/` pesa unos 7 MB. No lo hagas crecer sin motivo.
- **Imágenes:** en WebP dentro de `public/<sección>/`, con `width`/`height` o `aspect-ratio`, `loading="lazy"` fuera del primer viewport y `alt` descriptivo en español. El original va a `_source-assets/originals/`.
- **Modelos 3D:** el GLB original va a `_source-assets/models/`; después ejecuta `npm run optimize:models`. El decoder Draco está en `public/draco/`.
- **Fuentes:** solo WOFF2 en `public/fonts/`. Precarga únicamente las que se ven en el primer pantallazo.
- **JS:** importa desde `node_modules` (`gsap`, `three`, `lenis`), nunca desde un CDN. Carga Three.js solo en páginas que lo usan.
- **Bucles de animación:** pausa `requestAnimationFrame` y los renders WebGL cuando el canvas no está visible o la pestaña está oculta. Limita el `devicePixelRatio` en móvil.
- **Caché:** `vercel.json` sirve `/assets`, `/fonts` y `/draco` como inmutables. Si reemplazas un archivo de `public/` manteniendo el nombre, las carpetas de imágenes tienen caché de 7 días; cambia el nombre si el cambio debe verse ya.

## SEO (prioridad alta)

- Marca escrita siempre **DvckStudio** (con V). Término principal: "dvckstudio". "Duck Studio" es cobertura secundaria.
- **Nunca** pongas "Duck Studio" en `<title>`, `og:title` ni `twitter:title`. Esa variante va solo en meta description, `alternateName` del JSON-LD, FAQ y texto del cuerpo.
- La frase de la home "DvckStudio (se pronuncia Duck Studio) es un estudio creativo…" está aprobada. No la cambies.
- Cada página indexable necesita: `<title>` único, meta description, `canonical` sin barra final ni `.html`, OG + Twitter, `hreflang es-ES` y `x-default`, y JSON-LD coherente con el de la home (`@id` `https://dvckstudio.com/#organization`).
- Un solo `<h1>` por página. Jerarquía de encabezados sin saltos.
- Si cambias contenido de una página, actualiza su `lastmod` en `public/sitemap.xml`.
- Los datos de contacto (email, teléfono, redes con handle `@dvckstudio`) deben coincidir en HTML, JSON-LD y `links.html`.

## Accesibilidad

- Enlaces y botones con texto accesible; los iconos decorativos llevan `aria-hidden="true"`.
- Todo lo interactivo funciona con teclado y tiene foco visible.
- Contraste suficiente sobre el fondo naranja; verifica el texto blanco pequeño.
- Los formularios tienen `<label>` y mensajes de error asociados.

## Despliegue

- Vercel: `npm run build` → `dist/` (configurado en `vercel.json`). Hostinger: subir `dist/`, que incluye `.htaccess`.
- Si cambias un redirect o una cabecera, cámbialo en **los dos**: `vercel.json` y `public/.htaccess`.
- `www` redirige a la raíz. Las URLs canónicas no llevan barra final.
- No despliegues sin que el usuario lo pida. Cuando diga "actualiza la web", "sube la web" o algo equivalente, esa es la orden: `npm run web:subir` (build + subida a Hostinger de lo que ha cambiado). Antes, comprueba que el build no falla y dile qué se va a subir si hay cambios que no ha visto.

## Verificar

No hay tests. Antes de dar un cambio por terminado:

1. `npm run build` sin errores ni warnings nuevos.
2. `npm run preview` y revisa la página en 390×844 y 1440×900. Para capturas automáticas, usa `playwright-core` instalado en el scratchpad con el Chrome/Edge del sistema; no lo añadas a `package.json`.
3. Consola del navegador sin errores. En la home, el modelo 3D carga y el scroll del journey no salta.
4. Si tocaste SEO: valida el JSON-LD (Rich Results Test) y revisa el `<head>` de la página.
5. Si tocaste rendimiento: Lighthouse móvil antes y después, y apunta la diferencia.

## Deuda conocida (confirmar con el usuario antes de actuar)

- `/sample-project` es una plantilla de caso de estudio; conviene convertirla en casos reales por proyecto.
- El chunk de Three.js supera el límite de aviso de Vite (warning de chunk size en el build). Es esperado; no lo "arregles" subiendo el límite sin dividir el código.

Limpieza del 2026-09-24: se borraron 10 módulos JS sin uso, `js/shaders/`, `public/menu/`, `icons/cursor.png`, `icons/site-icon.png` y las dependencias `@dimforge/rapier3d`, `cannon-es` y `matter-js`. Antes de añadir un archivo o dependencia nueva, asegúrate de que alguna página lo carga.

## Cómo priorizar mejoras

Cuando el usuario pida "mejorar la web" sin concretar, sigue este orden y propone antes de ejecutar:

1. Bugs visibles y errores de consola.
2. Core Web Vitals en móvil (LCP del hero, CLS de fuentes e imágenes, INP del journey 3D).
3. SEO técnico y contenido que capte búsquedas ("diseño web España", casos de estudio reales).
4. Conversión: claridad de los CTA y del formulario de contacto.
5. Limpieza de la deuda conocida.
6. Pulido visual y animaciones nuevas.

Al terminar, resume qué cambiaste, cómo lo verificaste y qué queda pendiente. Si una decisión o preferencia del usuario debe perdurar, añádela a este archivo.
