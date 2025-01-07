---
title: "Shopify se queda con Tailwind: ¿se acaba el CSS gratis?"
seoTitle: "Tailwind se une a Shopify: qué cambia y qué no"
description: "La IA le hundió los ingresos a Tailwind y ahora el equipo se va a Shopify. Qué cambia, qué no, qué pasa con tu web y la lección que nadie quería oír."
created: 2026-09-25
category: desarrollo
tags: [tailwind, shopify, open source, css, desarrollo web]
tldr:
  - "Tailwind CSS **sigue siendo gratis**: todo el código abierto mantiene la licencia MIT."
  - "La IA reventó su negocio: **-40 %** de visitas a la documentación en dos años y casi **-80 %** de ingresos."
  - "Los productos de pago (Tailwind Plus, ui.sh) cierran a clientes nuevos; los que ya pagaron conservan el acceso."
  - "Tu web hecha con Tailwind no tiene que hacer nada. Nada. Cero."
faq:
  - q: "¿Tailwind CSS pasa a ser de pago?"
    a: "No. Según el anuncio oficial, Tailwind CSS y el resto de proyectos de código abierto del equipo seguirán siempre con licencia MIT, gratis para cualquier uso."
  - q: "¿Qué pasa con Tailwind Plus y ui.sh?"
    a: "Cierran el registro a clientes nuevos. Los clientes que ya los tenían mantienen su acceso."
  - q: "¿Por qué Tailwind Labs se une a Shopify?"
    a: "Porque la IA hundió su modelo de negocio: menos gente visitaba la documentación y menos gente descubría sus productos de pago. Shopify usa Tailwind en su propio stack y le da un hogar estable."
  - q: "¿Tengo que cambiar de framework?"
    a: "No hay ningún motivo técnico. El framework lo sigue manteniendo el mismo equipo y con la misma licencia."
sources:
  - title: "Tailwind CSS: Tailwind Labs is joining Shopify (9 de septiembre de 2026)"
    url: "https://tailwindcss.com/blog/tailwind-is-joining-shopify"
  - title: "DevClass: Tailwind Labs lays off 75 percent of its engineers thanks to brutal impact of AI"
    url: "https://devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/"
---

En enero, Tailwind Labs despidió al 75 % de su equipo de ingeniería. Motivo, según su fundador: el "brutal impacto" de la IA en el negocio. Ocho meses después, el 9 de septiembre, anunciaron que se van a Shopify.

Internet hizo lo de siempre: titulares de "se acabó Tailwind gratis" y gente migrando proyectos por si acaso. Vamos a quitar el ruido.

## Cómo la IA se cargó un negocio que funcionaba

Tailwind Labs ganaba dinero con la fórmula de manual del código abierto: el framework gratis y los extras de pago. Su producto estrella, Tailwind Plus, vendía componentes y plantillas listos para usar.

El truco era que la gente entraba en la documentación, veía los componentes de pago y alguno compraba. Hasta que llegaron los asistentes de IA: si una IA te escribe el CSS en dos segundos, **no entras en la documentación**. Y si no entras, no ves lo que vendes.

```@stats
title: "El agujero, en números"
items:
  - value: 40
    prefix: "-"
    suffix: " %"
    label: "de visitas a la documentación en dos años"
    source: "Adam Wathan, enero de 2026"
  - value: 80
    prefix: "-"
    suffix: " %"
    label: "de ingresos, aproximadamente"
    source: "Adam Wathan, enero de 2026"
  - value: 110
    suffix: " M"
    label: "instalaciones **a la semana**: más uso que nunca"
    source: "Tailwind CSS, septiembre de 2026"
```

Lee las cifras juntas porque son lo más loco de la historia: Tailwind se usa más que nunca y la empresa que lo hace casi se queda sin poder pagar nóminas. **Éxito de uso, ruina de negocio.**

## De los despidos a Shopify, paso a paso

```@timeline
title: "Nueve meses de montaña rusa"
items:
  - date: "Enero de 2026"
    title: "Se van 3 de cada 4 ingenieros"
    text: "Tailwind Labs despide al 75 % de su equipo de ingeniería. Se quedan los tres cofundadores y dos ingenieros."
  - date: "Enero de 2026"
    title: "Llegan los patrocinios"
    text: "Tras el revuelo, Vercel y Google AI Studio anuncian que patrocinan el proyecto."
  - date: "9 de septiembre de 2026"
    title: "Tailwind Labs se une a Shopify"
    text: "El equipo pasa a Shopify, el código abierto sigue con licencia MIT y los productos de pago cierran a clientes nuevos."
```

Shopify no pasaba por allí. Según el anuncio, fue de las primeras empresas grandes en apostar por Tailwind, y hoy es una **pieza clave de su tecnología**. Tiene todo el interés del mundo en que no se muera.

## Lo que cambia (poco) y lo que no (casi todo)

La confusión viene de mezclar la empresa con el producto. Tailwind Labs es la empresa; Tailwind CSS, el framework. El anuncio oficial lo deja por escrito: nada cambia en Tailwind CSS ni en el resto de sus proyectos de código abierto, y todo seguirá con licencia MIT.

```@tabs
title: "Qué te toca según quién seas"
tabs:
  - label: "Tienes una web con Tailwind"
    text: |
      **Nada.** Tu web no se rompe, no hay que pagar nada y las actualizaciones siguen saliendo del mismo equipo.

      Si alguien te dice que hay que rehacerla "porque ahora es de Shopify", te está vendiendo una moto.
  - label: "Pagabas Tailwind Plus"
    text: |
      Conservas el acceso a lo que compraste. Lo que cierra es el registro de **clientes nuevos**, porque el equipo se va a centrar en Tailwind CSS dentro de Shopify.

      No cuentes con grandes novedades en esos productos.
  - label: "Vas a empezar un proyecto"
    text: |
      Tailwind sigue siendo una opción perfectamente válida: licencia MIT, equipo original y una empresa enorme que lo necesita para su propio negocio.

      Elige framework por lo que necesita tu proyecto, no por titulares.
```

> [!VENTAJA] Una buena noticia disfrazada de susto
> En enero, el futuro de Tailwind dependía de que una empresa diminuta cuadrara cuentas. Ahora lo mantiene el mismo equipo con Shopify pagando las facturas. Para quien trabaja con Tailwind, es mejor escenario que el de principios de año.

## La lección que el código abierto no quería oír

Tailwind era el ejemplo que todo el mundo ponía de código abierto sostenible. La IA lo rompió en dos años.

Si tu negocio depende de que la gente te visite para aprender a usar tu herramienta, **la IA ya es tu competencia**. Tutoriales, documentación, fragmentos de código: todo eso lo genera en segundos y sin que nadie pase por tu web.

Los proyectos que aguantan suelen tener detrás una empresa que los necesita para su propio negocio: React tiene a Meta, TypeScript a Microsoft y, desde septiembre, Tailwind a Shopify. Los que no tienen a nadie van a pasar un invierno largo.

> [!DATO] No es solo cosa de programadores
> Es el mismo patrón que sufren muchas webs con la búsqueda con IA: la respuesta llega sin que nadie visite la fuente. Si tu negocio vive del tráfico a contenido de "cómo se hace", toma nota.

```@quiz
title: "¿Mito o verdad?"
items:
  - claim: "Tailwind CSS deja de ser gratis."
    answer: false
    explain: "El anuncio oficial dice que todo su código abierto seguirá siempre con licencia MIT."
  - claim: "La IA tuvo mucho que ver con que acabaran en Shopify."
    answer: true
    explain: "Su fundador atribuyó en enero la caída de ingresos y los despidos al impacto de la IA en el negocio."
  - claim: "Si ya pagaste Tailwind Plus, lo pierdes."
    answer: false
    explain: "Los clientes existentes mantienen el acceso. Solo se cierra a clientes nuevos."
```

El código abierto sobrevive cuando alguien con recursos decide que le compensa sostenerlo. Shopify usa Tailwind y necesita que siga siendo bueno. Resultado: uno de los frameworks más usados de la web tiene casa. Hay finales peores.

En DvckStudio hacemos webs sin dramas tecnológicos ni modas de temporada. [Cuéntanos qué necesitas](/contact).
