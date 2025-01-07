---
title: "Tu botón de «Enviar» te está costando clientes"
seoTitle: "Textos de botones y formularios que convierten"
description: "Los textos de botones, formularios y errores deciden si alguien te escribe o se va. Cómo escribirlos bien, con ejemplos y lo que dice la investigación de UX."
created: 2026-09-25
category: diseno
tags: [microcopy, ux writing, textos de botones, formularios, conversión]
tldr:
  - "El texto de un botón es una promesa. «Enviar» no promete nada; «Pedir presupuesto gratis», sí."
  - "Un error que dice «Datos incorrectos» echa a la gente. Uno que dice **qué falla y cómo arreglarlo**, la retiene."
  - "El placeholder no sustituye a la etiqueta del campo: desaparece en cuanto escribes."
  - "Orden de prioridad según Nielsen Norman Group: **claro**, luego **breve**, y la gracia al final. Nunca al revés."
faq:
  - q: "¿Cuántas palabras debe tener el texto de un botón?"
    a: "No hay un número mágico. Lo importante es que describa lo que pasa al pulsarlo. Si hacen falta dos palabras más para que se entienda, ponlas."
  - q: "¿Por qué «Enviar» es un mal texto de botón?"
    a: "Porque no dice qué consigue quien lo pulsa ni qué pasa después. Nielsen Norman Group ha documentado cómo los botones genéricos generan expectativas equivocadas."
  - q: "¿Qué dicen las pautas de accesibilidad sobre los errores de formulario?"
    a: "Las WCAG piden que el error se identifique y se describa con texto (criterio 3.3.1) y que, si se sabe cómo corregirlo, se sugiera la corrección (criterio 3.3.3). El color solo no basta (criterio 1.4.1)."
sources:
  - title: "Nielsen Norman Group: “Get Started” Stops Users"
    url: "https://www.nngroup.com/articles/get-started/"
  - title: "Nielsen Norman Group: The 3 C's of Informational Microcopy"
    url: "https://www.nngroup.com/articles/3-cs-microcopy/"
  - title: "Nielsen Norman Group: The 3 I's of Microcopy"
    url: "https://www.nngroup.com/articles/3-is-of-microcopy/"
  - title: "W3C WAI: User Notifications in Forms"
    url: "https://www.w3.org/WAI/tutorials/forms/notifications/"
  - title: "W3C: Understanding Success Criterion 3.3.1 Error Identification"
    url: "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html"
  - title: "Baymard Institute: Current State of Checkout UX"
    url: "https://baymard.com/blog/current-state-of-checkout-ux"
---

Alguien entra en tu web, rellena el formulario y, al llegar al botón, se para. Cinco segundos. Cierra la pestaña.

No era un formulario difícil. Es que «Enviar» no le decía qué iba a pasar con lo que acababa de escribir. Bienvenido al microcopy: los textos pequeños que nadie ve hasta que están mal. Y los tuyos, casi seguro, lo están.

## Qué es el microcopy (y por qué manda más de lo que crees)

Son los textos de los botones, las etiquetas de los formularios, los mensajes de error y la confirmación de "recibido". No es el titular de tu portada: es lo que hay **entre el usuario y la acción** que quieres que haga.

Nielsen Norman Group le da tres trabajos: **informar** (qué es esto), **influir** (por qué me interesa) e **interactuar** (qué pasa si lo toco). La mayoría de webs solo intentan el tercero. Y regular.

```@stats
title: "El dinero que se queda por el camino"
items:
  - value: 64
    suffix: " %"
    label: "de las webs de tiendas online analizadas tienen un proceso de compra **mediocre o peor** en escritorio"
    source: "Baymard Institute, 2025"
  - value: 35
    suffix: " %"
    label: "más de conversión puede ganar una tienda grande media solo mejorando el diseño del pago"
    source: "Baymard Institute, 2025"
```

Esas cifras son de tiendas online, pero la lección vale para cualquier formulario: **cada duda es una salida**.

## El botón que no dice nada

«Enviar». «Más información». «Aceptar». «Haga clic aquí». Ninguno dice qué vas a recibir, cuándo ni si hay letra pequeña. Y la gente no salta al vacío si puede evitarlo.

Nielsen Norman Group estudió el botón «Get Started» (nuestro «Empezar») y vio que atrae clics, pero lleva a la gente a donde no esperaba. Un participante pulsó para enterarse de qué era la web y se encontró un test de estilo que no había pedido. Su recomendación: textos concretos que digan qué pasa, como «Haz nuestro test de estilo».

La regla: **el botón describe lo que consigues**, no la mecánica de pulsar. Este es el ranking:

```@tier
title: "Textos de botón, del peor al mejor"
tiers:
  - tier: "S"
    label: "Dice qué consigues"
    items: ["Pedir presupuesto gratis", "Reservar mi cita", "Descargar la guía en PDF"]
  - tier: "A"
    label: "Dice a dónde vas"
    items: ["Ver nuestros proyectos", "Hablar con el equipo"]
  - tier: "B"
    label: "Vago"
    items: ["Más información", "Continuar", "Empezar"]
  - tier: "C"
    label: "Salto al vacío"
    items: ["Enviar", "Aceptar", "Haga clic aquí"]
```

> [!TRUCO] La prueba del «¿y qué?»
> Lee el botón en voz alta y añade «¿y qué?». «Enviar, ¿y qué?» no tiene respuesta. «Pedir presupuesto gratis, ¿y qué?» se explica solo.

## Formularios que echan para atrás

Un formulario largo ya cansa antes de empezar. Pero uno corto con los textos equivocados, también. Hay tres sitios donde las palabras hacen más daño (o más bien):

1. **La etiqueta del campo.** «Nombre» o «Tu nombre y apellidos». La segunda quita la duda de si basta con el nombre de pila.
2. **El placeholder.** Solo para un ejemplo del formato: «hola@tuempresa.com». Nunca como etiqueta, porque desaparece en cuanto escribes.
3. **El texto de ayuda.** La línea pequeña bajo el campo que explica por qué lo pides: «Te llamamos solo si lo prefieres, en menos de 24 h». Así un campo que da mal rollo deja de darlo.

Dale al interruptor y mira el mismo formulario escrito de dos maneras:

```@toggle
title: "El mismo formulario, dos formas de escribirlo"
a:
  label: "Sin microcopy"
  text: |
    **Nombre**

    **Email**

    **Teléfono**

    Botón: `Enviar`
b:
  label: "Con microcopy"
  text: |
    **Tu nombre**

    **Tu email**, solo para responderte. Nada de newsletter.

    **Tu teléfono (opcional)**, por si prefieres que te llamemos.

    Botón: `Pedir presupuesto gratis`
```

> [!OJO] El placeholder no es una etiqueta
> Si el placeholder hace de etiqueta, en cuanto el usuario escribe se queda sin saber qué iba en ese hueco. El tutorial de formularios del W3C recomienda etiquetas visibles y asociadas a cada campo.

## Mensajes de error que culpan al usuario

«Error. Revise los datos introducidos.» ¿Cuáles? ¿Qué tienen de malo? Es el equivalente digital de un portazo.

Las pautas de accesibilidad WCAG lo dejan claro: el error se tiene que **identificar y describir con texto** y, si se sabe cómo arreglarlo, hay que decirlo. Y nada de marcarlo solo en rojo: el color no le llega a quien no distingue colores ni a quien usa un lector de pantalla.

```@compare
title: "El mismo error, dos formas de decirlo"
left:
  label: "Portazo"
  tone: bad
  items: ["Error en el formulario.", "Datos incorrectos.", "Campo inválido (y el borde en rojo)."]
right:
  label: "Mano tendida"
  tone: good
  items: ["Falta tu email: lo necesitamos para responderte.", "El teléfono tiene 8 cifras y le falta una.", "Escribe la fecha así: 25/09/2026."]
```

> [!VENTAJA] Un buen error salva la venta
> Quien entiende qué ha fallado en cinco segundos termina el formulario. Quien no lo entiende, se va con la competencia. No hay más.

## La regla de las 3 C (sin ponerse pesado)

Nielsen Norman Group lo resume en tres palabras con un orden estricto: **claridad**, **concisión** y **carácter**. Primero que se entienda. Luego, que sea corto (aunque si dos palabras más lo aclaran, se ponen). Y la gracia, al final.

El error más típico es empezar por el carácter: botones muy de marca que nadie sabe qué hacen. Nuestro consejo en DvckStudio: antes de escribir un botón, contesta a la pregunta más aburrida del mundo. ¿Qué pasa exactamente cuando alguien lo pulsa? Luego ya le pones la voz de tu marca.

## Qué puedes revisar esta misma tarde

No hace falta rediseñar nada. Esto se cambia en cualquier gestor de contenidos:

```@checklist
title: "Auditoría exprés de microcopy"
items:
  - "Cada botón dice lo que consigue quien lo pulsa."
  - "Ni un «Enviar», «Aceptar» o «Más información» a pelo."
  - "Ningún campo usa el placeholder como etiqueta."
  - "Los campos que dan reparo (teléfono, empresa, presupuesto) explican para qué se piden."
  - "Cada mensaje de error dice qué falla y cómo arreglarlo, con texto y no solo en rojo."
  - "Tras enviar, un mensaje claro: qué has recibido y cuándo vas a responder."
```

Si al terminar la lista ves más cosas que arreglar de las que caben en una tarde, en DvckStudio revisamos los textos como parte del [diseño y desarrollo de webs](/studio). [Pídenos presupuesto](/contact), que para eso el botón dice lo que hace.

El buen microcopy no se nota. Es exactamente la idea.
