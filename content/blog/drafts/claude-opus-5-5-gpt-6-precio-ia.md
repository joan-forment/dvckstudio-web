---
title: "Claude Opus 5.5 y GPT-6: la IA acaba de bajar de precio"
description: "Anthropic y OpenAI estrenaron modelos el mismo día y con precios más bajos. Qué ha salido, cuánto cuesta ahora y qué significa para quien usa IA en su negocio."
created: 2026-09-25
category: ia
tags: [claude opus 5.5, gpt-6, precios ia, modelos de ia, inteligencia artificial]
tldr:
  - "El 22 de septiembre, Anthropic sacó **Claude Opus 5.5** y, horas después, OpenAI lanzó **GPT-6 Sol y GPT-6 Luna**."
  - "Los dos bajan precios: Opus 5.5 cuesta un **20 % menos** por token que Opus 5; GPT-6 Sol, **la mitad** que su antecesor."
  - "Para un negocio, lo gordo no es quién gana la tabla: es que **automatizar con IA sale más barato cada trimestre**."
  - "Antes de cambiar de modelo, prueba con tus tareas reales. La tabla de un fabricante no es tu negocio."
faq:
  - q: "¿Qué es Claude Opus 5.5?"
    a: "Es el nuevo modelo de Anthropic, lanzado el 22 de septiembre de 2026. Según la empresa, rinde al nivel de Claude Fable 5.1 en la mayoría del trabajo, cuesta un 40 % menos de ejecutar que Opus 5 en cargas típicas y genera texto un 30 % más rápido."
  - q: "¿Qué son GPT-6 Sol y GPT-6 Luna?"
    a: "Dos modelos de OpenAI lanzados el mismo día: Sol para trabajo complejo y repetido (programar, revisar código, analizar datos) y Luna para tareas de mucho volumen como resúmenes o extracción de datos."
  - q: "¿Cuánto cuestan?"
    a: "En la API, por millón de tokens: Claude Opus 5.5, 4 dólares de entrada y 20 de salida; GPT-6 Sol, 2 y 10; GPT-6 Luna, 0,10 y 0,50."
  - q: "¿Qué es un token?"
    a: "El trozo de texto con el que miden y cobran los modelos: una palabra corta, parte de una palabra o un signo. Se cobra por lo que le mandas (entrada) y por lo que te responde (salida)."
sources:
  - title: "Anthropic: Introducing Claude Opus 5.5"
    url: "https://www.anthropic.com/news/claude-opus-5-5"
  - title: "OpenAI: Introducing GPT-6 Sol and Luna"
    url: "https://openai.com/index/introducing-gpt-6-sol-and-luna/"
  - title: "VentureBeat: OpenAI releases GPT-6 Sol and Luna models, slashing API costs 50% or more"
    url: "https://venturebeat.com/technology/openai-releases-gpt-6-sol-and-luna-models-slashing-api-costs-50-or-more"
---

El 22 de septiembre, Anthropic sacó su nuevo modelo por la mañana. A las 11:22 de la mañana, hora de California, OpenAI respondió con dos. Parecía un duelo del Oeste, pero con notas de prensa.

Y mientras ellos se pelean por la corona, pasa algo que te interesa mucho más: **la IA se está abaratando a toda velocidad**.

## Qué salió el 22 de septiembre

```@timeline
title: "Un martes cualquiera en Silicon Valley"
items:
  - date: "22 sept, por la mañana"
    title: "Claude Opus 5.5"
    text: "Anthropic presenta el primer modelo de su familia 5.5: más barato y más rápido que Opus 5."
  - date: "22 sept, 11:22 (hora de California)"
    title: "GPT-6 Sol y GPT-6 Luna"
    text: "OpenAI lanza dos modelos a la mitad de precio que sus antecesores."
  - date: "Ahora"
    title: "Tu turno"
    text: "Hacer las cuentas de lo que te cuesta la IA con los precios nuevos."
```

Resumen de lo que dicen los fabricantes (ojo: lo dicen **ellos**):

- **Claude Opus 5.5**: según Anthropic, rinde al nivel de Claude Fable 5.1 en la mayoría del trabajo, cuesta un 40 % menos de ejecutar que Opus 5 en cargas típicas y escribe un 30 % más rápido.
- **GPT-6 Sol**: el modelo de OpenAI para trabajo complejo que se repite a diario: programar, revisar código, analizar datos.
- **GPT-6 Luna**: el modelo barato para volumen: resúmenes, extracción de datos, clasificación.

## La guerra de precios, en una gráfica

Los modelos cobran por **tokens**, trozos de texto. Lo que más pesa en la factura suele ser la salida: lo que el modelo escribe. Así queda el precio por millón de tokens de salida:

```@bars
title: "Precio por millón de tokens de salida (API)"
unit: " $"
items:
  - label: "Claude Opus 5 (antes)"
    value: 25
  - label: "Claude Opus 5.5"
    value: 20
    highlight: true
  - label: "GPT-5.6 Sol (antes)"
    value: 20
  - label: "GPT-6 Sol"
    value: 10
    highlight: true
  - label: "GPT-6 Luna"
    value: 0.5
note: "Precios en dólares según Anthropic (Opus 5 y 5.5) y OpenAI vía VentureBeat (GPT-5.6 y GPT-6). OpenAI asegura que los precios nuevos son permanentes, no una promoción."
```

Mira la última barra. **Medio dólar por un millón de tokens de salida.** Para resumir o clasificar a lo bestia, eso es calderilla.

> [!OJO] Barato no es igual para todo
> Comparar solo el precio por token engaña: un modelo más caro que acierta a la primera puede salir más barato que uno económico al que hay que repetirle las cosas tres veces. Mide el coste **por tarea bien hecha**, no por token.

## ¿Cuál uso para qué?

Aquí no hay un ganador universal. Depende de lo que le vayas a pedir:

```@tabs
title: "Qué modelo encaja con tu tarea"
tabs:
  - label: "Mucho volumen"
    text: |
      Clasificar cientos de emails, resumir documentos, sacar datos de facturas.

      Aquí manda el precio. Un modelo de volumen como **GPT-6 Luna** está pensado justo para esto. Revisa por muestreo que no se le escape nada.
  - label: "Trabajo diario complejo"
    text: |
      Redactar propuestas, analizar datos, revisar código o textos largos.

      Modelos como **GPT-6 Sol** o **Claude Opus 5.5** juegan en esta liga. Prueba los dos con **tus** tareas reales y quédate con el que menos correcciones necesite.
  - label: "Agentes y tareas largas"
    text: |
      Un agente que trabaja solo durante horas: programa, usa herramientas, encadena pasos.

      Anthropic posiciona **Opus 5.5** justo para trabajo agéntico y de programación largo. Aquí pesa más que no se equivoque que el precio por token.
```

En DvckStudio no nos casamos con ningún fabricante. El modelo es una pieza que se cambia; lo que hay que diseñar bien es el proceso, las comprobaciones y quién revisa.

## Lo que esto significa para tu negocio

Cada bajada de precio cambia la cuenta de qué merece la pena automatizar. Lo que el año pasado no compensaba, hoy puede que sí.

1. **Recupera la lista** de tareas que descartaste por caras: clasificar el correo, resumir reuniones, preparar informes.
2. **Rehaz los números** con los precios nuevos. Probablemente alguna ya compense.
3. **Haz una prueba de una semana** con tus datos reales antes de decidir modelo.
4. **Deja la puerta abierta** a cambiar de modelo: a este ritmo, dentro de tres meses habrá otro más barato.

```@quiz
title: "¿Mito o verdad?"
items:
  - claim: "El modelo más barato siempre es la mejor opción."
    answer: false
    explain: "Si hay que repetirle las cosas o corregirle mucho, el ahorro por token se va en horas de revisión."
  - claim: "GPT-6 Sol cuesta la mitad que GPT-5.6 Sol en la API."
    answer: true
    explain: "Pasa de 4 y 20 dólares por millón de tokens (entrada y salida) a 2 y 10, según VentureBeat."
  - claim: "Las comparativas de los fabricantes dicen qué modelo es mejor para tu negocio."
    answer: false
    explain: "Las publica cada fabricante con sus pruebas. Tu negocio solo se mide con tus tareas y tus datos."
```

La IA no se va a quedar quieta y los precios, tampoco. La ventaja no la tiene quien usa el modelo más nuevo: la tiene quien sabe **qué tareas darle y cómo comprobar el resultado**.

Si quieres hacer esas cuentas con tu caso, [escríbenos](/contact) y en DvckStudio te decimos qué compensa automatizar hoy.
