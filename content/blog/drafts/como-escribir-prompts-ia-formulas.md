---
title: "Cómo escribir prompts de IA: 6 fórmulas con ejemplos reales"
seoTitle: "Cómo escribir prompts de IA: 6 fórmulas que funcionan"
description: "Si la IA te suelta respuestas de manual, el problema es tu prompt. 6 fórmulas con ejemplos listos para copiar: emails, presupuestos, textos, reuniones y más."
date: 2026-09-25
updated: 2026-09-25
imageAlt: "Pato de plastilina frustrado ante un escritorio lleno de bolas de papel arrugadas y una bombilla encendida"
created: 2026-09-25
category: ia
tags: [cómo escribir prompts, prompt engineering, chatgpt, productividad, inteligencia artificial]
tldr:
  - "Prompt genérico, respuesta genérica. La IA no lee mentes: **lee lo que escribes**."
  - "Un buen prompt lleva cuatro cosas: **rol, contexto, tarea y formato**. Si tienes un ejemplo, mejor que mejor."
  - "Pide lo que quieres en positivo (\"párrafos cortos y directos\") en vez de una lista de prohibiciones."
  - "Hay cosas para las que la IA no es la herramienta: firmar contratos, decidir sobre personas o tragarse datos de clientes."
faq:
  - q: "¿Estas fórmulas funcionan en cualquier IA?"
    a: "Sí. Los principios son los mismos en ChatGPT, Claude y Gemini: contexto claro, tarea concreta y formato definido. Cambia la interfaz, no la lógica."
  - q: "¿Cuántos ejemplos hay que ponerle?"
    a: "La guía oficial de Anthropic recomienda entre 3 y 5 ejemplos variados y relevantes para obtener los mejores resultados. Con uno bien elegido ya se nota."
  - q: "¿Puede la IA revisar un contrato?"
    a: "Puede ayudarte a entenderlo, resumirlo y señalar cláusulas que conviene preguntar. No sustituye a un abogado cuando el contrato tiene consecuencias legales."
  - q: "¿Por qué la IA me responde con textos tan largos?"
    a: "Porque sin instrucciones de formato tiende a cubrirlo todo. Dile cuánto quieres (palabras, frases, puntos) y con qué estructura."
sources:
  - title: "Anthropic: Prompting best practices"
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"
  - title: "OpenAI: Prompt engineering guide"
    url: "https://developers.openai.com/api/docs/guides/prompt-engineering"
---

ChatGPT, Claude o Gemini, da igual. Si le escribes "dame ideas para mi negocio", te devuelve siete puntos de manual que llevan en internet desde 2018. La culpa no es de la IA. Es que le hablas como a Google, y Google no necesita contexto. La IA, sí.

Estas 6 fórmulas salen de las guías oficiales de Anthropic y OpenAI, traducidas al idioma de la gente que tiene presupuestos que mandar, textos que escribir y reuniones que sobrevivir. Todos los prompts se pueden copiar con un clic.

```@flow
title: "Los ingredientes de un prompt que funciona"
steps:
  - title: "Rol"
    text: "Qué papel juega: redactor, asesor, jefe de ventas…"
  - title: "Contexto"
    text: "Quién eres, para qué es y quién lo va a leer."
  - title: "Tarea"
    text: "Qué tiene que hacer exactamente. Cuanto más concreto, mejor."
  - title: "Formato"
    text: "Longitud, estructura y tono. Sin esto, improvisa."
```

## 1. Para contestar un email difícil

El prompt típico: "escríbeme un email rechazando una propuesta". Resultado: algo correcto, frío y que no suena ni a ti ni a tu empresa.

La fórmula: **situación + rol + tono + límite de longitud**. Dale al interruptor y compara.

```@toggle
title: "El mismo email, dos prompts"
a:
  label: "Prompt de cuñado"
  text: |
    Escríbeme un email rechazando una propuesta de colaboración.
b:
  label: "Prompt que funciona"
  text: |
    Eres mi redactor de emails de negocio. Tengo que rechazar la propuesta de una agencia de diseño que ya me ha escrito dos veces. No quiero cerrar la puerta porque pueden sernos útiles más adelante, pero ahora no tenemos presupuesto ni encaje. Escribe un email de menos de 120 palabras, en español de España, con tono directo y amable, que vaya al grano desde la primera frase.
```

> [!TRUCO] Pide en positivo
> La guía de Anthropic lo dice claro: mejor decirle qué hacer que qué no hacer. En vez de "no uses listas", pide "párrafos cortos y seguidos". Si hay una muletilla que odias, nómbrala una vez, pero que el grueso del prompt describa lo que sí quieres.

## 2. Para redactar un presupuesto o una propuesta

La IA no sabe qué vendes, a quién ni cuánto cobras. Sin eso, fabrica una estructura de plantilla y acabas reescribiéndola tú.

La fórmula: **quién eres + qué ofreces + quién es el cliente + qué tiene que conseguir el texto**.

```txt
Eres especialista en propuestas comerciales. Soy diseñador freelance y voy a
enviar una propuesta a una clínica dental que quiere rediseñar su web. Su
problema: la web actual casi no genera citas online. Mi oferta: precio cerrado
y entrega en 6 semanas. Redacta la sección "Por qué elegirnos" en 3 párrafos
cortos que conecten su problema con mi solución, con un tono cercano y concreto.
```

> [!OJO] Cuidado con lo que pegas
> Antes de meter datos reales de un cliente en un chat de IA, mira las condiciones de la herramienta. Nombres, cifras de negocio o datos personales de terceros: resúmelos o anonimízalos.

## 3. Para escribir los textos de tu web

Aquí es donde más se nota un mal prompt. El texto de tu web no es una entrada de enciclopedia: tiene que hablarle a alguien concreto y conseguir que haga algo.

La fórmula: **a quién le hablas + qué quieres que haga + tono + qué te diferencia**.

```txt
Eres redactor de webs de servicios para empresas. Escribe el titular y el
subtítulo de la portada de una consultora de SEO para tiendas de moda online.
Cliente ideal: una tienda que ya factura pero no aparece en Google.
Titular: máximo 8 palabras. Subtítulo: dos frases que digan qué hacemos y para
quién, con verbos concretos. Dame 3 opciones distintas.
```

Nuestro consejo en DvckStudio: usa lo que te dé la IA como **borrador**, no como texto final. La estructura te la ahorra; la voz de tu marca la tienes que poner tú.

## 4. Para resumir reuniones y sacar los siguientes pasos

Pegar una transcripción de 40 minutos y escribir "resúmelo" es tirar la herramienta. Define el formato de salida y lo seguirá al pie de la letra.

La fórmula: **el material primero, la instrucción después, el formato al final**. Así queda la conversación:

```@chat
title: "Resumen de reunión en 20 segundos"
messages:
  - from: user
    text: |
      [Transcripción de la reunión]

      Extrae de esta transcripción: 1) decisiones tomadas, una frase cada una; 2) tareas: quién, qué y para cuándo, solo si se dijo; 3) temas sin cerrar. Tres secciones en ese orden, sin introducción.
  - from: ai
    text: |
      **Decisiones**: lanzar la web nueva el 15 de octubre. Mantener el precio actual hasta enero.

      **Tareas**: Marta revisa los textos (viernes). Luis prepara las fotos (sin fecha).

      **Sin cerrar**: si se traduce la web al inglés.
```

> [!DATO] Documento arriba, pregunta abajo
> La guía de Anthropic recomienda poner los documentos largos al principio del prompt, por encima de las instrucciones y la pregunta. Según la propia guía, mejora el rendimiento en todos sus modelos.

## 5. Para sacar ideas de contenido

"Dame ideas para mi Instagram" es el prompt más inútil del mundo. La IA no sabe qué vendes, a quién ni qué has publicado ya.

La fórmula: **plataforma + audiencia + objetivo + qué evitar + cuántas ideas**.

```txt
Necesito 10 ideas de publicaciones para LinkedIn dirigidas a responsables de
marketing de empresas medianas en España. Objetivo: que me vean como referente
en SEO técnico. Quiero ángulos concretos y basados en casos reales del sector.
Formato: título de la publicación y, en una frase, el enfoque.
```

## 6. Para leer un contrato (con cabeza)

La IA puede leerse un contrato de servicios, explicarte las cláusulas raras y decirte qué preguntar. Lo que no puede es darte asesoramiento legal. Eso lo firma una persona con colegiatura.

La fórmula: **tipo de documento + qué riesgos buscas + cómo quieres la respuesta**.

```txt
Soy autónomo y voy a firmar un contrato de servicios de diseño con una empresa.
Léelo y explícame en lenguaje sencillo: 1) cláusulas de exclusividad o de no
competencia, 2) a quién pertenece el diseño final, 3) plazos de pago y
penalizaciones. Si algo es poco habitual, dímelo lo primero.
```

## Cuándo la IA no es la herramienta

No todo se arregla con un buen prompt. Antes de lanzarte, mira dónde cae cada tarea:

```@matrix
title: "¿Se lo das a la IA?"
x: { low: "Poco tiempo ahorrado", high: "Mucho tiempo ahorrado" }
y: { low: "Error barato", high: "Error carísimo" }
quadrants: ["Ni se te ocurra", "Borrador y revisión experta", "Si te apetece", "Dáselo sin miedo"]
items:
  - label: "Ideas de contenido"
    x: 80
    y: 12
  - label: "Resumen de reuniones"
    x: 88
    y: 30
  - label: "Emails difíciles"
    x: 62
    y: 44
  - label: "Textos de la web"
    x: 72
    y: 62
  - label: "Leer un contrato"
    x: 55
    y: 86
  - label: "Decidir un despido"
    x: 18
    y: 94
```

La regla es sencilla: cuanto más caro sale un error, más humano hace falta. Y hay cosas (despidos, sanciones, comunicados de crisis) que llevan tu nombre y tu responsabilidad, no la de un modelo.

```@checklist
title: "Antes de darle a enviar"
items:
  - "Le he dado un rol claro."
  - "He explicado quién soy y para qué es el resultado."
  - "He dicho exactamente qué tiene que hacer, no solo el tema."
  - "He fijado el formato: longitud, estructura y tono."
  - "Si tenía un buen ejemplo, lo he puesto."
  - "No he pegado datos confidenciales de nadie."
```

¿Quieres meter la IA en el día a día de tu negocio sin que suene a robot? En DvckStudio ayudamos a integrarla en flujos de trabajo reales. Sin humo. [Cuéntanos qué necesitas](/contact).
