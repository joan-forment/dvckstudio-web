# Componentes visuales del blog

Catálogo de bloques que la web convierte en gráficos, esquemas y piezas interactivas animadas. Los usan los redactores (`writer-prompt.md`), el revisor (`reviewer-prompt.md`) y cualquiera que escriba un post a mano. El código que los pinta está en `scripts/blog/components.mjs` (HTML), `css/blog-viz.css` (estilo) y `js/blog-viz.js` (animaciones e interacción).

## Cómo se escriben

Un bloque de código cuyo lenguaje es `@` + el nombre del componente, con los datos en YAML:

````markdown
```@bars
title: "Qué parte del código generado por IA trae fallos"
unit: "%"
items:
  - label: "Estudio A"
    value: 38
  - label: "Estudio B"
    value: 62
    highlight: true
note: "Fuente: …"
```
````

Reglas:

- **YAML válido.** Textos entre comillas dobles. Si el YAML está mal o falta un campo obligatorio, el build falla y dice qué pasa.
- Los textos admiten Markdown en línea: `**negrita**`, `` `código` `` y `[enlaces](/ruta)`. Nada de HTML.
- **Todo dato es real y tiene fuente.** Los números de gráficos, escalas y cifras salen de las fuentes del artículo; ponla en `note` o `source`. Nada de gráficos "ilustrativos" con cifras inventadas: si no hay datos, usa un componente sin números (flujo, comparación, checklist, test…).
- Todos funcionan sin JavaScript (se ven completos) y respetan `prefers-reduced-motion`.
- Sin emojis en ningún texto.

## Cuántos y cuáles

- **Entre 3 y 6 componentes por artículo**, cada uno donde de verdad explique algo mejor que un párrafo.
- **Nunca el mismo componente dos veces** en un artículo, salvo `@stats` o `@quote` si el tema lo pide.
- **Varía entre artículos**: no abras siempre con `@stats`. Mira qué forma tiene la idea (¿comparar?, ¿proceso?, ¿proporción?, ¿decisión?) y elige el que la cuente.
- Mínimo uno interactivo (`@quiz`, `@checklist`, `@tabs`, `@toggle`, `@calculator`) si encaja con el tema.

## Catálogo

### `@stats`: cifras grandes que cuentan hacia arriba

Para 1-4 datos que escuecen. `value` es un número (decimales con punto en el YAML; la web los pinta con coma).

```yaml
title: "Opcional"
items:
  - value: 58
    prefix: "-"        # opcional
    suffix: "%"        # opcional: "%", " s", " €", "x"…
    label: "de clics al primer resultado cuando sale un resumen de IA"
    source: "Ahrefs, 2026"   # opcional
```

### `@bars`: barras horizontales

Para comparar 2-8 valores de la misma magnitud. `highlight: true` pinta una barra en naranja. `max` es opcional (por defecto, el mayor valor).

```yaml
title: "…"
unit: "%"
max: 100
items:
  - label: "…"
    value: 38
  - label: "…"
    value: 62
    highlight: true
note: "Fuente: …"
```

### `@split`: de qué está hecho un total

Barra al 100 % partida en trozos, con leyenda. Para proporciones (reparto de tiempo, de tráfico, de presupuesto).

```yaml
title: "…"
unit: "%"
items:
  - label: "…"
    value: 60
  - label: "…"
    value: 30
  - label: "…"
    value: 10
note: "Fuente: …"
```

### `@scale`: dónde cae un valor en una escala

Escala con zonas (bien / regular / mal) y un marcador que se desliza hasta su sitio. Para umbrales oficiales (Core Web Vitals, puntuaciones, contraste).

```yaml
title: "…"
min: 0
max: 6
unit: " s"
zones:
  - to: 2.5
    label: "Bien"
  - to: 4
    label: "Mejorable"
  - to: 6
    label: "Mal"
marker:
  value: 3.1
  label: "Tu web, a ojo de buen cubero"
note: "Umbrales: web.dev"
```

Las zonas van de mejor a peor. El marcador es opcional. Si el rango que se pinta bajo una zona no cuadra con la fuente (por ejemplo, 4,0-6,9), pon el texto exacto en `range: "4,0–6,9"`.

### `@compare`: esto contra esto

Dos columnas: antes/después, mito/realidad, sí/no, opción A/opción B. `tone`: `bad`, `good` o `neutral`.

```yaml
title: "…"
left:
  label: "Lo que hace todo el mundo"
  tone: bad
  items: ["…", "…", "…"]
right:
  label: "Lo que funciona"
  tone: good
  items: ["…", "…", "…"]
```

### `@flow`: un proceso de principio a fin

3-6 pasos unidos por flechas que se dibujan al hacer scroll. En móvil, en vertical.

```yaml
title: "…"
steps:
  - title: "Llega el email"
    text: "Frase corta opcional."
  - title: "La IA lo etiqueta"
  - title: "Ventas lo recibe"
```

### `@timeline`: qué pasó y cuándo

Línea temporal vertical que se dibuja al bajar. Para noticias con historia (anuncio, parche, reacción…).

```yaml
title: "…"
items:
  - date: "9 sept 2026"
    title: "…"
    text: "…"
```

### `@checklist`: lista para marcar

Casillas que el lector marca, con barra de progreso. Se recuerda en su navegador. Para "haz esto mañana".

```yaml
title: "…"
items:
  - "…"
  - "…"
```

### `@quiz`: ¿mito o verdad?

Tarjetas con una afirmación; al tocarla se descubre si es verdad o mito y por qué. `answer: true` = verdad, `false` = mito.

```yaml
title: "¿Mito o verdad?"
items:
  - claim: "…"
    answer: false
    explain: "…"
```

### `@matrix`: cuadrante de decisión

Dos ejes y puntos colocados en ellos (0-100). Para priorizar (esfuerzo/impacto, riesgo/beneficio).

```yaml
title: "…"
x: { low: "Poco esfuerzo", high: "Mucho esfuerzo" }
y: { low: "Poco impacto", high: "Mucho impacto" }
quadrants: ["Hazlo ya", "Planifícalo", "Si sobra tiempo", "Ni lo toques"]   # arriba-izq, arriba-der, abajo-izq, abajo-der
items:
  - label: "…"
    x: 20
    y: 85
```

### `@tier`: ranking por niveles

Filas S/A/B/C con chips. Para clasificar herramientas, prácticas o ideas con gracia.

```yaml
title: "…"
tiers:
  - tier: "S"
    label: "Imprescindible"
    items: ["…", "…"]
  - tier: "C"
    label: "Humo"
    items: ["…"]
```

### `@tabs`: según tu caso

Pestañas con contenido distinto por perfil ("Si tienes una tienda", "Si vendes servicios"…). `text` admite Markdown de bloque (párrafos y listas).

```yaml
title: "…"
tabs:
  - label: "Tienda online"
    text: |
      Párrafo corto.

      - punto
      - punto
  - label: "Servicios"
    text: "…"
```

### `@toggle`: antes y después con interruptor

Un interruptor cambia entre dos versiones. Ideal para prompts, textos de botones, código malo/bueno. `text` admite Markdown de bloque.

```yaml
title: "…"
a:
  label: "Prompt de cuñado"
  text: "…"
b:
  label: "Prompt que funciona"
  text: "…"
```

### `@calculator`: haz tus cuentas

Deslizadores que multiplican entre sí y por `factor`. El resultado se anima. Las suposiciones van en `note`.

```yaml
title: "¿Cuánto te cuesta no automatizar?"
inputs:
  - label: "Horas a la semana en la tarea"
    value: 5
    min: 1
    max: 40
    step: 1
    unit: " h"
  - label: "Lo que vale tu hora"
    value: 25
    min: 10
    max: 120
    step: 5
    unit: " €"
factor: 46
result:
  label: "Al año, tirados a la basura"
  unit: " €"
note: "46 semanas laborables al año."
```

### `@chat`: una conversación

Burbujas que aparecen en orden, con "escribiendo…". `from`: `user` o `ai`. Para enseñar prompts y respuestas.

```yaml
title: "…"
messages:
  - from: user
    text: "…"
  - from: ai
    text: "…"
```

### `@serp`: así te ve el buscador

Resultados de búsqueda de mentira (sin logos) para enseñar títulos y descripciones buenos y malos. `highlight: true` marca el bueno.

```yaml
title: "…"
query: "diseño web valencia"
results:
  - site: "tuweb.com"
    path: "servicios"
    title: "…"
    text: "…"
    highlight: true
```

### `@terms`: diccionario para humanos

Término técnico y su traducción al idioma de la calle.

```yaml
title: "…"
items:
  - term: "RCE"
    text: "Que alguien de fuera ejecuta lo que quiera en tu servidor. Como darle las llaves de casa a un desconocido."
```

### `@quote`: frase gorda

Una frase real (con fuente) o la idea clave del artículo, enorme, que se ilumina palabra a palabra al hacer scroll.

```yaml
text: "…"
author: "Nombre, cargo"        # solo si es una cita real y literal
source: "https://…"            # obligatorio si hay author
```

### `@marquee`: cinta de palabras

Cinta que se desliza con 4-8 palabras o frases cortas. Solo como separador con gracia, como mucho una por artículo.

```yaml
items: ["…", "…", "…", "…"]
```

## Además, sin componentes

- `## 3. Título`: sección numerada, para artículos que son una lista.
- Avisos: `> [!TRUCO]`, `> [!OJO]`, `> [!VENTAJA]`, `> [!DATO]`, `> [!EJEMPLO]`, con título opcional en la misma línea.
- Tablas Markdown, listas de viñetas (tarjetas) y numeradas (pasos).
