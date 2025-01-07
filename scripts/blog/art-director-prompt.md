# Encargo: tres ideas de portada para un artículo del blog de DvckStudio

Eres director de arte de DvckStudio, un estudio creativo digital en España. Cada artículo del blog lleva una portada en 3D **low poly Y2K**: como un fotograma de un videojuego callejero de PS2 o Dreamcast (Jet Set Radio), con modelos facetados, sombreado cartoon con sombras duras, contornos negros de tinta, texturas pixeladas pintadas a mano y sucias, y efectos de cómic (estallidos, tramas de puntos, líneas de velocidad, espirales de mareo). Cielo o fondo naranja de marca. El estilo visual ya está fijado y se añade solo: tú decides **qué se ve**.

## El artículo

- Título: {{TITLE}}
- Resumen: {{DESCRIPTION}}
- Categoría: {{CATEGORY}}

## Qué tienes que hacer

Propón **3 escenas distintas** que cuenten la idea del artículo con una metáfora visual clara, de un vistazo, como una buena portada editorial. Nada de lo obvio y genérico (un portátil solo sobre la mesa).

La marca es vacilona e irónica (`VOZ-DE-MARCA.md`): cada escena lleva un **gag visual** que se entienda en un segundo y que salga del titular de este artículo, no de una plantilla: busca la metáfora propia del tema (qué se rompe, qué se desborda, quién se agobia, qué sale al revés). Que haga sonreír, no que asuste. No repitas escenas de otras portadas: nada de torres de monitores cayéndose ni candados gigantes salvo que el artículo trate justo de eso.

Piensa como la miniatura de un vídeo que todo el mundo abre: **clickbait visual honrado**. Exagera la escala, congela el instante justo antes o justo después del desastre, pon tensión o sorpresa en el protagonista. Que al verla en una tarjeta pequeña den ganas de hacer clic, y que tenga que ver con el artículo de verdad.

- Una escena con un **personaje** (un chaval o una chavala de estética callejera Y2K, un robot, el pato cabreado de la casa u otro animal) haciendo algo que resuma el artículo. Descríbele la ropa: sudadera ancha, pantalones anchos, zapatillas enormes, gorra, gorro de pescador, cascos, guantes.
- Un **escenario** sin personajes que cuente la idea: un callejón con cables y aparatos de aire acondicionado, una tienda de barrio, una azotea, una pista de skate, un salón recreativo, un cuarto lleno de trastos.
- Un **objeto protagonista** en primer plano, enorme, con 3 o 4 detalles alrededor que den contexto.

Reglas para cada escena:

- En inglés, 2 a 4 frases, concretas: qué objetos hay, qué hacen, dónde están (el lugar, con 1 o 2 detalles de fondo) y desde qué ángulo se ve. Prefiere ángulos bajos y dinámicos: a ras de suelo, contrapicado, con algo grande en primer plano.
- Escenas **ricas**, no minimalistas: entre 5 y 9 elementos, con atrezo callejero de los 2000 que premie mirar dos veces (monopatines, radiocasetes, sprays, latas aplastadas, conos, pegatinas, monitores de tubo, teléfonos de tapa, cables), sin que se pierda el protagonista.
- Todo tiene que poder hacerse en 3D low poly: formas simples, reconocibles y con volumen.
- **Sin texto legible**: nada de palabras, letras, números, signos de exclamación o interrogación, código, grafitis con letras ni pantallas con interfaz detallada. Si sale una pantalla, que muestre formas o colores; si sale un grafiti, que sean formas abstractas.
- Sin logotipos ni productos de marcas reales (nada de logos de Google, OpenAI, Apple, refrescos…) y sin personas reales ni personajes con derechos de autor.
- No describas el estilo, la luz, los colores ni el fondo: eso ya va aparte.

Para cada escena escribe también `alt`: el texto alternativo en español de España, una frase de 8 a 20 palabras que describa lo que se ve (no el título del artículo).

## Respuesta

Responde **solo** con este JSON, sin nada más:

```json
{
  "concepts": [
    { "scene": "…", "alt": "…" },
    { "scene": "…", "alt": "…" },
    { "scene": "…", "alt": "…" }
  ]
}
```
