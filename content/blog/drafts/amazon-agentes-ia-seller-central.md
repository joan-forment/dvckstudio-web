---
title: "Amazon deja que una IA lleve tu tienda. Qué puede hacer (y qué no)"
seoTitle: "Amazon abre Seller Central a agentes de IA: qué cambia"
description: "Amazon deja que Claude y su asistente Quick gestionen inventario, precios y fichas. Qué hace, qué no y qué aprende de esto una tienda online española."
created: 2026-09-25
category: ia
tags: [agentes de ia, ecommerce, amazon, tiendas online, automatización]
tldr:
  - "Amazon ha abierto sus herramientas de vendedor a **agentes de IA de fuera**: primero su asistente Quick y, en beta, Claude de Anthropic."
  - "El agente ve inventario, ventas y fichas, y puede **actuar**, pero cada acción la aprueba el vendedor antes de ejecutarse."
  - "De momento es una beta en las tiendas de Amazon en **EE. UU.**; la expansión internacional llegará después."
  - "Aunque no vendas en Amazon, la lección vale: la IA ya no solo aconseja, **hace cosas**. Y hay que ponerle límites."
faq:
  - q: "¿Qué ha anunciado Amazon exactamente?"
    a: "Un complemento que conecta los datos de vendedor de Amazon (fichas, métricas, inventario y ventas) con el agente de IA que elija el vendedor, empezando por Amazon Quick y, en beta, Claude de Anthropic. El agente puede proponer y ejecutar acciones, siempre con aprobación del vendedor."
  - q: "¿Está disponible en España?"
    a: "Según Amazon, de momento está en beta en sus tiendas de Estados Unidos, con expansión internacional prevista."
  - q: "¿Cuánto cuesta?"
    a: "Amazon regala 12 meses de Amazon Quick Plus a los titulares principales de cuentas de vendedor, con fecha límite el 31 de diciembre de 2026."
  - q: "¿Puede la IA cambiar mis precios sin preguntarme?"
    a: "Según Amazon, el vendedor decide si los flujos solo recomiendan o también actúan, y las acciones requieren su revisión y aprobación antes de ejecutarse."
sources:
  - title: "Amazon: Seller Assistant, nuevo complemento para Amazon Quick y Claude de Anthropic"
    url: "https://www.aboutamazon.com/news/innovation-at-amazon/seller-assistant-plugin-amazon-quick-claude"
  - title: "GeekWire: Amazon opens its seller tools to outside AI agents, starting with Anthropic's Claude"
    url: "https://www.geekwire.com/2026/amazon-opens-its-seller-tools-to-outside-ai-agents-starting-with-anthropics-claude/"
---

Llevas años peleándote con el panel de vendedor de Amazon. Ahora Amazon dice que no hace falta que lo abras: se lo puedes pedir a una IA.

Lo anunció el 23 de septiembre en Amazon Accelerate, su evento para vendedores. Y es más gordo de lo que parece: Amazon deja que **una IA de otra empresa** consulte y toque la tienda de sus vendedores.

## Qué ha anunciado Amazon, sin marketing

Un complemento que conecta los datos de tu cuenta de vendedor con el agente de IA que prefieras. De momento, Amazon Quick (el suyo) y, en beta, Claude de Anthropic.

```@stats
title: "El anuncio en tres cifras"
items:
  - value: 90
    suffix: " %"
    label: "de los vendedores ya usan herramientas de IA de terceros, según Amazon"
    source: "Amazon, septiembre de 2026"
  - value: 60
    suffix: " s"
    label: "tarda en conectarse, sin escribir código, según Amazon"
    source: "Amazon, septiembre de 2026"
  - value: 12
    label: "meses gratis de Amazon Quick Plus para los titulares de cuenta (hasta el 31 de diciembre)"
    source: "Amazon, septiembre de 2026"
```

El agente ve tus fichas, tus métricas, tu inventario y tus ventas. Y no solo mira: **puede actuar** igual que lo haría el asistente dentro de Seller Central. Con una condición importante: tú decides si solo recomienda o también ejecuta, y las acciones se revisan y aprueban antes de hacerse.

> [!OJO] Todavía no es para ti (si vendes en España)
> Es una beta en las tiendas de Amazon en Estados Unidos. Amazon habla de expansión internacional, pero sin fecha. Si vendes en amazon.es, de momento toca mirar y aprender.

## Cómo se le habla a una IA que gestiona una tienda

La gracia de estos agentes es que dejas de pinchar en menús y pasas a pedir cosas. Amazon pone ejemplos de flujos como estos:

```@chat
title: "Encargos al agente (ejemplos de Amazon)"
messages:
  - from: user
    text: "Avísame si alguno de mis 10 productos más vendidos baja de 4 estrellas y prepárame un plan de respuesta."
  - from: ai
    text: "Hecho. Vigilo las valoraciones de tus 10 productos más vendidos y, si alguno baja de 4 estrellas, te aviso con un borrador de plan para que lo revises."
  - from: user
    text: "Vigila mi categoría por si aparecen huecos frente a la competencia, y ajusta precios y fichas."
  - from: ai
    text: "De acuerdo. Cuando detecte una oportunidad, te propongo el cambio de precio y de ficha, y no lo aplico hasta que lo apruebes."
```

Las peticiones son las de Amazon; las respuestas, un ejemplo de cómo funciona el flujo con aprobación. Fíjate en la última frase: **no lo aplico hasta que lo apruebes**. Esa es la diferencia entre una ayuda y un susto.

## Cuánto tiempo te puede estar comiendo la tienda

Antes de emocionarte con los agentes, haz números. ¿Cuánto tiempo se va cada semana en tareas repetitivas de la tienda (revisar stock, actualizar precios, contestar reseñas, sacar informes)?

```@calculator
title: "Lo que te cuestan las tareas repetitivas de tu tienda"
inputs:
  - label: "Horas a la semana en tareas repetitivas"
    value: 6
    min: 1
    max: 40
    step: 1
    unit: " h"
  - label: "Lo que vale una hora de tu tiempo"
    value: 25
    min: 10
    max: 100
    step: 5
    unit: " €"
factor: 46
result:
  label: "Al año, en tareas que podría preparar una IA"
  unit: " €"
note: "Cálculo orientativo: horas por semana × valor de la hora × 46 semanas de trabajo al año. Un agente no te ahorrará el 100 %: alguien tiene que revisar y aprobar."
```

Si la cifra te escuece, no hace falta esperar a que Amazon llegue a España: muchas de esas tareas se pueden automatizar hoy en cualquier tienda online, con o sin Amazon.

## Lo que un agente de IA puede y no puede hacer en tu tienda

```@quiz
title: "¿Mito o verdad?"
items:
  - claim: "Con este complemento, la IA cambia tus precios por su cuenta."
    answer: false
    explain: "Según Amazon, el vendedor elige si el flujo solo recomienda o también actúa, y las acciones pasan por su revisión y aprobación."
  - claim: "Ya se puede usar en amazon.es."
    answer: false
    explain: "De momento es una beta en las tiendas de Amazon en Estados Unidos, con expansión internacional prevista."
  - claim: "El agente trabaja con datos reales de tu cuenta: inventario, ventas y métricas."
    answer: true
    explain: "Esa es precisamente la novedad: el agente accede a tus datos de vendedor en tiempo real y puede actuar sobre ellos."
  - claim: "Si la IA se equivoca, la responsabilidad es de la IA."
    answer: false
    explain: "La tienda es tuya y la aprobación también. Por eso tiene sentido que ninguna acción importante se ejecute sin que la revise una persona."
```

> [!TRUCO] La regla de oro con agentes en una tienda
> Que el agente **proponga** todo y **ejecute** solo lo que tenga vuelta atrás fácil. Un borrador de respuesta a una reseña, sí. Bajar el precio de todo el catálogo a las tres de la mañana, no.

## Qué aprende de esto una tienda online española

Aunque no vendas en Amazon, esta noticia marca por dónde va el comercio electrónico: **la IA pasa de aconsejar a hacer**. Y eso te afecta aunque tu tienda sea un Shopify o un WooCommerce.

1. **Ordena tus datos.** Un agente solo es tan bueno como la información a la que accede. Fichas completas, stock al día y categorías claras.
2. **Empieza por lo que tiene vuelta atrás.** Informes, alertas y borradores antes que precios o pedidos.
3. **Pon siempre una aprobación humana** en lo que llega al cliente o toca dinero.
4. **Mide antes y después.** Horas ahorradas y errores detectados. Si en un mes no ahorra tiempo de verdad, fuera.

Amazon ha puesto la primera piedra; el resto de plataformas irán detrás. La pregunta no es si tu tienda acabará trabajando con agentes, sino si estarás preparado cuando pase.

Si quieres automatizar partes de tu tienda online con IA sin perder el control, en DvckStudio [te ayudamos a montarlo](/contact). Y lo de bajar precios de madrugada, mejor lo dejamos en manos humanas.
