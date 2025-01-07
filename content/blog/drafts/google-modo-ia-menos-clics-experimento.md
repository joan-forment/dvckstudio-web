---
title: "Modo IA de Google: menos clics y peor experiencia. Hay datos."
seoTitle: "Modo IA de Google: menos clics y peor experiencia"
description: "Un experimento con 1.100 personas mide lo que el Modo IA de Google le hace a tu tráfico: casi 19 puntos menos de clics. Qué dice el estudio y qué hacer."
date: 2026-09-25
updated: 2026-09-25
imageAlt: "Clientes de plastilina abarrotan una máquina expendedora ignorando los puestos del mercado vacíos."
created: 2026-09-25
category: ia
tags: [modo ia google, clics, ai overviews, seo, tráfico web]
tldr:
  - "Un experimento preregistrado con 1.100 personas midió que el Modo IA de Google baja los clics a webs externas **18,8 puntos**."
  - "Quitar el Modo IA y los resúmenes con IA los sube **8,8 puntos**: el tráfico no se esfuma, se queda dentro de Google."
  - "Y el usuario tampoco sale ganando: con el Modo IA, **menos satisfacción, menos utilidad y menos confianza**."
  - "Lo que la IA no puede darte en un resumen (herramientas, tiendas, casos propios, tu marca) es lo que hay que reforzar ya."
faq:
  - q: "¿Qué es el Modo IA de Google?"
    a: "Es un modo de búsqueda en el que Google responde con una conversación generada por IA en lugar de la lista de resultados de siempre. Los AI Overviews son los resúmenes con IA que aparecen encima de los resultados normales."
  - q: "¿Cuánto tráfico puedo perder con el Modo IA?"
    a: "En el experimento de la Universidad de Pensilvania y Northeastern, los clics a webs externas bajaron 18,8 puntos porcentuales cuando toda la búsqueda pasaba por el Modo IA. En tu web dependerá del sector y del tipo de búsquedas que te traen visitas."
  - q: "¿Puedo sacar mi web del Modo IA y de los AI Overviews?"
    a: "Google empezó a probar en junio de 2026 un control en Search Console para excluir una web de sus funciones de IA sin afectar a su posición en la búsqueda normal. Si lo tienes disponible, valora lo que pierdes: también desapareces de esos resúmenes."
  - q: "¿Qué contenido resiste mejor a los resúmenes con IA?"
    a: "El que no cabe en un párrafo: herramientas y calculadoras, tiendas, presupuestos, casos de estudio propios y todo lo que alguien busca por tu nombre."
sources:
  - title: "Wang et al.: AI in Search Reduces Publisher Referrals Without Improving User Experience (arXiv, agosto de 2026)"
    url: "https://arxiv.org/abs/2608.18352"
  - title: "Investigating Click Behaviors On Google Search Result Pages That Produce an AI Overview (arXiv, agosto de 2026)"
    url: "https://arxiv.org/abs/2608.04831"
  - title: "Search Engine Journal: Google pushes “bounce clicks” explanation for AI Overview traffic loss"
    url: "https://www.searchenginejournal.com/google-pushes-bounce-clicks-explanation-for-ai-overview-traffic-loss/572986/"
  - title: "9to5Google: Google will let websites opt-out of AI Mode & Overviews in Search"
    url: "https://9to5google.com/2026/06/02/google-ai-mode-overviews-opt-out/"
---

Si llevas meses viendo cómo baja el tráfico de Google sin haber tocado nada, enhorabuena: ya tienes el diagnóstico. Un experimento con 1.100 personas confirma que el Modo IA de Google recorta los clics que llegan a las webs. Y no poco.

No es que la gente no quiera entrar en tu web. Es que ya tiene la respuesta en pantalla y no le hace falta.

## Qué midieron (y por qué este estudio es serio)

Investigadores de la Universidad de Pensilvania y de Northeastern publicaron el experimento en arXiv el 18 de agosto de 2026. Fue **preregistrado**: primero dejaron por escrito qué iban a medir y luego midieron. Así no hay forma de maquillar los resultados a posteriori.

Los participantes buscaron en Google con una extensión de navegador que les cambiaba la experiencia. Tres grupos: Google sin funciones de IA, Google tal cual (el grupo de control) y Google solo con el Modo IA.

```@stats
title: "Lo que pasa con los clics"
items:
  - value: 18.8
    prefix: "-"
    suffix: " pp"
    label: "de clics a webs externas cuando todo pasa por el **Modo IA**"
    source: "Wang et al., arXiv, 2026"
  - value: 8.8
    prefix: "+"
    suffix: " pp"
    label: "de clics cuando se quitan el Modo IA y los resúmenes con IA"
    source: "Wang et al., arXiv, 2026"
  - value: 36
    suffix: "%"
    label: "de las búsquedas del grupo de control mostraban un resumen con IA"
    source: "Wang et al., arXiv, 2026"
```

Lee la segunda cifra otra vez. Si Google quita la IA, la gente vuelve a hacer clic. **Las visitas no han desaparecido**: se las queda Google.

> [!DATO] Que te citen no es que te visiten
> Otro estudio publicado en arXiv el mismo mes siguió durante un mes la navegación de 900 adultos en EE. UU. Resultado: solo en torno al 1 % de las visitas a un resumen con IA terminan en un clic a alguna de las fuentes citadas.

## Y encima, al usuario le gusta menos

Aquí viene lo bueno. El experimento no solo contó clics: también preguntó a la gente cómo le había ido. Con el Modo IA, todas las medidas de experiencia empeoraron, y con diferencias estadísticamente claras.

```@bars
title: "Cuánto empeora la experiencia con el Modo IA"
unit: " DE"
items:
  - label: "Satisfacción con la búsqueda"
    value: 0.73
    highlight: true
  - label: "Sensación de control"
    value: 0.66
  - label: "Utilidad percibida"
    value: 0.59
note: "Caída frente a la búsqueda normal, en desviaciones típicas (DE). Todas con p < 0,001. Fuente: Wang et al., arXiv, 2026."
```

La confianza en la información también bajó. Resumiendo: el Modo IA es peor para quien tiene una web, que pierde la visita, y **tampoco es mejor para quien busca**. Negocio redondo.

## Lo que dice Google (y lo que no enseña)

La jefa de Búsqueda de Google, Liz Reid, lleva desde 2025 defendiendo una idea: la IA se come sobre todo los "clics de rebote", esos en los que entras, pillas un dato y te vas en cuatro segundos. Según Google, los clics buenos siguen llegando.

El problema, como señala Search Engine Journal, es que Google no ha publicado datos que lo demuestren. Mientras tanto, el experimento de Penn y Northeastern mide una caída de casi 19 puntos. Una afirmación sin números contra un estudio con 1.100 personas: tú decides a quién creer.

> [!OJO] El botón de salida tiene trampa
> Google empezó a probar en junio de 2026 un interruptor en Search Console para sacar tu web del Modo IA y de los resúmenes sin tocar tu posición normal. Empezó con editores de Reino Unido y no cubre la app de Gemini. Si lo tienes, piénsalo dos veces: sales del resumen, pero también de la conversación.

## Qué contenido aguanta y cuál se lo come la IA

La búsqueda no va a desaparecer. Pero hay contenido que un resumen despacha en dos líneas y contenido que obliga a entrar en tu web. Este es el ranking:

```@tier
title: "Contenido frente a los resúmenes con IA"
tiers:
  - tier: "S"
    label: "Blindado"
    items: ["Herramientas y calculadoras", "Tiendas: hay que ver y comprar", "Presupuestos y formularios", "Búsquedas con tu marca"]
  - tier: "A"
    label: "Aguanta"
    items: ["Casos de estudio propios", "Opinión con datos que solo tú tienes", "Comunidad y newsletter"]
  - tier: "B"
    label: "Sufre"
    items: ["Guías paso a paso genéricas", "Comparativas básicas"]
  - tier: "C"
    label: "Carne de resumen"
    items: ["Definiciones", "Preguntas frecuentes de manual", "Datos públicos sin análisis"]
```

Si la mitad de tu blog vive en la fila C, ya sabes por qué baja el tráfico. No es mala suerte: es que **Google responde eso mejor y más rápido que tu página**.

## Qué hacer a partir de mañana

1. **Entra en Search Console** y busca páginas con muchas impresiones y pocos clics. Ahí se nota el mordisco de la IA.
2. **Reescribe o fusiona** el contenido de la fila C: o le metes algo propio (datos, casos, opinión) o no compensa mantenerlo.
3. **Invierte en lo blindado**: una calculadora útil o un buen formulario de presupuesto valen más que diez artículos de definiciones.
4. **Construye canales propios**: newsletter, redes, referidos. Cada visita directa es una visita que no depende de Google.
5. **Mira las búsquedas de tu marca**. Si crecen, estás construyendo algo que ningún resumen puede sustituir.

Google no va a dar marcha atrás con la IA: ahora es su producto estrella. La pregunta ya no es si te afecta. Es cuánto tráfico puedes permitirte perder antes de moverte.

Si quieres que en DvckStudio revisemos qué partes de tu web resisten y cuáles están en la fila C, [cuéntanos](/contact).
