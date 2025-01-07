---
title: "Tu web hecha con vibe coding tiene agujeros (y hay datos)"
seoTitle: "Vibe coding y seguridad: los agujeros de tu web con IA"
description: "Miles de apps hechas con IA en producción y más de 2.000 fallos graves. Qué errores comete la IA por defecto, sin tecnicismos, y qué revisar antes de publicar."
date: 2026-09-25
updated: 2026-09-25
imageAlt: "Portátil de plastilina abierto del que escapan criaturas diminutas con llaves y papeles."
created: 2026-09-25
category: desarrollo
tags: [vibe coding, seguridad web, ia, desarrollo, vulnerabilidades]
tldr:
  - "Un escaneo de **5.600 apps** hechas con vibe coding encontró más de 2.000 fallos graves y más de 400 claves secretas a la vista."
  - "La IA genera código que **funciona**, no código que es **seguro**. Son dos objetivos distintos."
  - "Los fallos típicos: contraseñas dentro del código, formularios que se tragan cualquier cosa y protecciones básicas que nadie pidió."
  - "Web tarjeta de visita: riesgo bajo. Login, pagos o datos de clientes: **revisión humana antes de publicar**, sí o sí."
faq:
  - q: "¿Puedo hacer mi web con vibe coding aunque no sepa programar?"
    a: "Para una web informativa sin formularios ni datos de usuarios, el riesgo es bajo. En cuanto haya login, pagos o datos personales, necesitas que alguien con experiencia en seguridad revise el código antes de publicarlo."
  - q: "¿Hay alguna herramienta de vibe coding que sea segura?"
    a: "En la prueba de Tenzai con cinco agentes de programación populares, todos generaron código con fallos explotables. Ninguno añadió por su cuenta protecciones básicas como la defensa CSRF."
  - q: "¿Cómo sé si mi web tiene problemas de seguridad?"
    a: "Una primera pista gratuita es HTTP Observatory de MDN, que revisa las cabeceras de seguridad de tu web en segundos. No sustituye a una auditoría, pero te dice si falta lo más básico."
  - q: "¿Qué pasa si alguien entra en mi web por un fallo?"
    a: "Depende del fallo: desde cambiar tu web hasta llevarse la base de datos entera. Si hay datos personales, además tienes obligaciones con el RGPD, como notificar la brecha."
sources:
  - title: "Georgia Tech: Bad Vibes, AI-Generated Code is Vulnerable, Researchers Warn"
    url: "https://news.research.gatech.edu/2026/04/13/bad-vibes-ai-generated-code-vulnerable-researchers-warn"
  - title: "Escape: Methodology, 2k+ vulnerabilities in vibe-coded apps"
    url: "https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/"
  - title: "Tenzai: Bad Vibes, comparing the secure coding capabilities of popular coding agents"
    url: "https://tenzai.com/blog/bad-vibes-comparing-the-secure-coding-capabilities-of-popular-coding-agents"
  - title: "Cloud Security Alliance: Vibe Coding Security Crisis, Credential Sprawl and SDLC Debt"
    url: "https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-codegen-vulnerability-debt-20260406-csa/"
  - title: "MDN: HTTP Observatory"
    url: "https://developer.mozilla.org/es/observatory"
---

Alguien te ha dicho que una IA te monta la web en un fin de semana. Es verdad. Lo que no te cuentan es qué pasa el lunes, cuando un bot lleva horas probando la puerta que la IA dejó abierta.

## Qué es el vibe coding (para quien lo acaba de oír)

"Vibe coding" es describir lo que quieres y dejar que una IA (Cursor, Claude Code, Replit, Lovable, Bolt…) escriba todo el código. Tú no lo lees, ni falta que hace, total, funciona. Describes, la IA construye, tú publicas.

Para muchas cosas va de lujo. El problema es lo que hace por defecto: la IA optimiza para que **la cosa funcione**, no para que **sea segura**. Y si nadie se lo pide, lo segundo no llega.

## Los números que preferiría no haber encontrado

Escape, una empresa de seguridad, escaneó en octubre de 2025 miles de apps públicas hechas con herramientas de vibe coding. Todas en producción, con usuarios reales.

```@stats
title: "Lo que encontraron en apps reales"
items:
  - value: 5600
    label: "apps hechas con vibe coding escaneadas"
    source: "Escape, 2025"
  - value: 2000
    prefix: "+"
    label: "fallos de seguridad de **impacto alto**"
    source: "Escape, 2025"
  - value: 400
    prefix: "+"
    label: "claves secretas a la vista (API keys, tokens, credenciales)"
    source: "Escape, 2025"
```

Y hubo 175 casos de datos personales expuestos, con historiales médicos e IBAN entre ellos. No es un experimento de laboratorio: es lo que ya está publicado en internet.

El ritmo, además, va a más. El proyecto Vibe Security Radar de Georgia Tech rastrea los fallos de seguridad oficiales (los CVE) causados por código generado con IA.

```@bars
title: "Fallos oficiales atribuidos a código hecho con IA"
items:
  - label: "Segunda mitad de 2025 (7 meses)"
    value: 18
  - label: "Solo marzo de 2026"
    value: 35
    highlight: true
note: "Fuente: Vibe Security Radar, Georgia Tech (abril de 2026). La Cloud Security Alliance estima que la cifra real es entre 5 y 10 veces mayor, porque casi nadie etiqueta el código hecho con IA."
```

Un solo mes de 2026 superó todo lo detectado en 2025. Y eso son solo los que se pueden demostrar.

> [!OJO] Todas las herramientas, mismo fallo
> Tenzai pidió a cinco agentes de programación populares (Cursor, Claude Code, Codex, Replit y Devin) que hicieran 15 apps. Encontró 69 vulnerabilidades. Todos los agentes metieron un fallo SSRF y **ninguna** de las 15 apps traía protección CSRF.

## Los fallos más comunes, traducidos a la vida real

Suenan a sopa de letras. Son cosas muy terrenales.

```@terms
title: "El diccionario de los agujeros"
items:
  - term: "Claves en el código"
    text: "La contraseña de la base de datos escrita en el propio archivo. Como pegar el PIN en la tarjeta. Los bots la encuentran en minutos."
  - term: "Inyección SQL"
    text: "Alguien escribe algo raro en un formulario de tu web y se lleva la base de datos entera. Pasa cuando el código mezcla lo que escribe el usuario con las órdenes a la base de datos."
  - term: "XSS"
    text: "Colar código malicioso en tu web para atacar a tus visitantes desde ella. Tu web se convierte en el cebo."
  - term: "CSRF"
    text: "Engañar a un usuario con la sesión abierta para que haga algo sin querer: cambiar su email, borrar su cuenta, pagar."
  - term: "SSRF"
    text: "Usar tu servidor de recadero para atacar otros sistemas. Como si alguien llamara a tu banco desde tu teléfono."
```

La IA no suele fallar en lo que le pides. Falla en lo que **no** le pides: las protecciones que un desarrollador con tablas pone sin pensar.

## ¿Te tienes que preocupar? Depende de tu web

No hace falta tirar la IA por la ventana. Hace falta saber en qué liga juegas.

```@tabs
title: "Según lo que haga tu web"
tabs:
  - label: "Tarjeta de visita"
    text: |
      Textos, fotos, un teléfono y un mapa. Sin formularios que guarden datos ni zona de clientes.

      **Riesgo bajo.** Revisa que no haya claves en el código y que las cabeceras de seguridad estén puestas. Y a correr.
  - label: "Con formularios"
    text: |
      Formulario de contacto, reservas o presupuestos. Ya hay datos de personas entrando.

      - Que los datos se validen **en el servidor**, no solo en el navegador.
      - Que el formulario tenga protección contra spam y abusos.
      - Que sepas dónde acaban esos datos y quién puede verlos.
  - label: "Login, pagos o datos"
    text: |
      Cuentas de usuario, pagos, historiales o cualquier dato sensible.

      **Aquí no se juega.** Revisión de seguridad por alguien con experiencia antes de publicar, no después del susto. Y si hay una brecha con datos personales, el RGPD te obliga a notificarla.
```

En DvckStudio usamos IA para programar, pero nada llega a producción sin que una persona con criterio lo haya leído. No por desconfianza: porque sabemos qué optimiza la herramienta y qué no.

> [!TRUCO] Comprobación rápida y gratis
> Mete la dirección de tu web en HTTP Observatory de MDN. Sin cuenta y en segundos te dice si faltan las cabeceras de seguridad más básicas. Si sale una nota baja, ya sabes por dónde empezar.

## La lista antes de darle a publicar

```@checklist
title: "Seguridad mínima antes de publicar"
items:
  - "No hay contraseñas, tokens ni API keys escritas en el código."
  - "Los formularios validan los datos en el servidor, no solo en el navegador."
  - "La base de datos no es accesible desde internet, solo desde tu aplicación."
  - "Las cabeceras de seguridad están configuradas (compruébalo en HTTP Observatory)."
  - "El panel de administración tiene algo más que una contraseña."
  - "Alguien que no escribió el código lo ha leído antes de publicarlo."
```

No es una auditoría completa. Es lo mínimo para no ser el blanco fácil que los bots buscan primero.

La IA acelera el desarrollo de verdad. El problema no es usarla: es publicar sin revisar. No firmarías un contrato redactado por una IA sin que lo leyera un abogado, ¿no? Pues con tu web, igual.

¿Tienes dudas de si tu web tiene agujeros? [Cuéntanos](/contact). Revisar antes siempre sale más barato que apagar fuegos después.
