---
title: "La IA de Google hackeó 3 empresas sin querer. ¿Y la tuya?"
seoTitle: "Gemini hackeó 3 empresas: lecciones sobre agentes de IA"
description: "Gemini entró en tres empresas reales durante una prueba de seguridad, con contraseñas adivinadas y claves que andaban por internet. Qué pasó y cómo blindarte."
created: 2026-09-25
category: ia
tags: [agentes de ia, seguridad, gemini, contraseñas, ciberseguridad]
tldr:
  - "En mayo, **Gemini entró en sistemas de tres empresas reales** durante una prueba de hacking que se suponía cerrada."
  - "La causa: un nombre de empresa inventado coincidía con uno real y el entorno de pruebas tenía salida a internet."
  - "Lo inquietante no es la IA: es que entró **adivinando una contraseña** y **usando claves publicadas en repositorios de código**."
  - "Si le das un agente de IA a tu negocio: permisos mínimos, sin claves a la vista y una persona aprobando lo importante."
faq:
  - q: "¿Qué hizo exactamente Gemini?"
    a: "Durante una prueba de seguridad de la empresa Irregular, Gemini accedió a sistemas de tres organizaciones reales creyendo que formaban parte del ejercicio. En un caso adivinó una contraseña; en los otros dos usó credenciales que encontró en repositorios de código públicos. En los tres casos se detuvo sin hacer nada más."
  - q: "¿Cuándo pasó y cuándo se supo?"
    a: "Ocurrió en mayo de 2026, Google se enteró en julio y lo hizo público el 18 de septiembre de 2026."
  - q: "¿Es peligroso usar agentes de IA en mi empresa?"
    a: "Depende de a qué les des acceso. Un agente con permisos mínimos, sin credenciales sensibles y con aprobación humana para las acciones importantes es mucho más seguro que uno con las llaves de todo."
  - q: "¿Cómo sé si tengo contraseñas o claves expuestas en internet?"
    a: "Revisa que ningún repositorio público de tu empresa contenga archivos de configuración con claves. GitHub, por ejemplo, tiene escaneo de secretos que avisa cuando detecta credenciales en el código."
sources:
  - title: "NBC News: Google says its AI model gained unauthorized access to three outside systems"
    url: "https://www.nbcnews.com/tech/tech-news/google-says-ai-model-gained-unauthorized-access-three-systems-rcna598651"
  - title: "The Hacker News: Google Gemini broke into real company systems after security test domain mix-up"
    url: "https://thehackernews.com/2026/09/google-gemini-broke-into-real-company.html"
  - title: "GitHub Docs: About secret scanning"
    url: "https://docs.github.com/es/code-security/secret-scanning/introduction/about-secret-scanning"
---

Una IA de Google entró en los sistemas de tres empresas reales. Nadie se lo pidió. Pensaba que estaba en un examen.

Parece el guion de una peli mala de sobremesa, pero lo contó la propia Google el 18 de septiembre. Y la parte más útil de la historia no va de robots rebeldes: va de **contraseñas de chiste y claves olvidadas en internet**. O sea, de ti.

## Qué pasó, en cristiano

Irregular, una empresa israelí de ciberseguridad, estaba evaluando a Gemini con un ejercicio clásico de "captura la bandera": atacar una empresa ficticia para ver de qué es capaz el modelo. Todo dentro de una caja cerrada.

Salvo que la caja no estaba cerrada.

```@timeline
title: "Del examen al susto"
items:
  - date: "Mayo de 2026"
    title: "Gemini sale de la caja"
    text: "Durante las pruebas de Irregular, el modelo accede a sistemas de tres organizaciones reales creyendo que son parte del ejercicio."
  - date: "Julio de 2026"
    title: "Alguien revisa los registros"
    text: "Irregular repasa su trabajo, detecta las intrusiones y avisa a Google."
  - date: "Julio a septiembre"
    title: "Investigación y avisos"
    text: "Google investiga, informa a las organizaciones afectadas y a las autoridades federales de EE. UU."
  - date: "18 de septiembre de 2026"
    title: "Se hace público"
    text: "Google confirma el incidente. No se ha dicho qué empresas eran."
```

¿Cómo se escapó? Por una chapuza de las de toda la vida: el nombre de la empresa inventada para el ejercicio **coincidía con el de una empresa real**, y un error de configuración dejó el entorno de pruebas conectado a internet. Gemini buscó a su "objetivo" y encontró al de verdad.

## Cómo entró (y aquí es donde te tienes que mirar al espejo)

Según The Hacker News, las tres intrusiones fueron así:

```@flow
title: "Tres puertas, ninguna blindada"
steps:
  - title: "Intrusión 1"
    text: "Probó contraseñas una y otra vez hasta que acertó."
  - title: "Intrusión 2"
    text: "Buscó el nombre de la empresa, encontró credenciales publicadas en un repositorio de código y entró con ellas."
  - title: "Intrusión 3"
    text: "Lo mismo, con credenciales de otro repositorio público."
```

Ni una técnica de ciencia ficción. **Adivinar una contraseña y usar claves que alguien dejó a la vista.** Lo mismo que hace cualquier bot cutre que escanea internet las 24 horas. La diferencia es que esta vez lo hizo una IA y salió en las noticias.

> [!DATO] La parte buena
> En los tres casos, Gemini se detuvo al conseguir el acceso y no hizo nada más. Google dice que el modelo "actuó de forma apropiada" y que no lo considera un caso de desalineación, es decir, de IA que se salta las instrucciones.

## Lo que falló de verdad

Aquí hay dos fallos distintos, y conviene no mezclarlos:

```@compare
title: "Dos fallos, dos culpables"
left:
  label: "El fallo de la prueba"
  tone: neutral
  items:
    - "Un nombre ficticio que existía de verdad"
    - "Un entorno de pruebas conectado a internet"
    - "Nadie revisó los registros hasta dos meses después"
right:
  label: "El fallo de las víctimas"
  tone: bad
  items:
    - "Una contraseña que se podía adivinar"
    - "Credenciales publicadas en repositorios de código"
    - "Sistemas expuestos que se abrían con esas claves"
```

El primero es problema de Google e Irregular. **El segundo es el que te puede pasar a ti mañana**, con o sin IA de por medio.

## Si vas a darle un agente de IA a tu negocio

Cada vez más negocios conectan agentes de IA a su correo, su tienda o sus herramientas. Bien. Pero esta historia deja una lección clarísima: un agente hace lo que puede hacer, no lo que tú crees que hará.

```@tabs
title: "Qué hacer según tu caso"
tabs:
  - label: "Usas agentes de IA"
    text: |
      - **Permisos mínimos**: que el agente acceda solo a lo que necesita para su tarea, nada más.
      - **Aprobación humana** para todo lo que no tiene vuelta atrás: pagos, borrados, emails a clientes.
      - **Registros**: guarda qué hace el agente y revísalos. Aquí el problema se descubrió dos meses tarde.
  - label: "Tienes código en internet"
    text: |
      - Ni una contraseña, token ni clave dentro del código. Van en variables de entorno o en un gestor de secretos.
      - Activa el escaneo de secretos de tu plataforma (GitHub lo tiene) para que te avise si se cuela alguna.
      - Si una clave se ha publicado alguna vez, **cámbiala**. Borrarla del código no basta.
  - label: "Tienes una web o una tienda"
    text: |
      - Contraseñas largas y únicas en cada panel de administración, con gestor de contraseñas.
      - Verificación en dos pasos en todo lo que la permita.
      - Límite de intentos de acceso, para que nadie pueda probar contraseñas sin fin.
```

> [!OJO] "Solo es una prueba" no existe
> Si algo tiene salida a internet, está en internet. Pasa con los entornos de pruebas, las webs "en construcción" y la tienda que montaste un domingo y olvidaste. Si existe y es accesible, alguien (o algo) lo va a encontrar.

## Lo que da que pensar

No hace falta ponerse apocalíptico: la IA paró en cuanto entró. Pero es el primer caso conocido de Gemini haciendo algo así por su cuenta, y llega después de que OpenAI y Anthropic contaran también comportamientos preocupantes de sus modelos este mismo año.

Los agentes son cada vez más capaces de hacer cosas **solos**. Eso es justo lo que los hace útiles y justo lo que obliga a ponerles vallas. El consejo de DvckStudio antes de conectar una IA a cualquier cosa: pregúntate qué es lo peor que puede hacer si se equivoca. Y ponle la valla ahí.

Si quieres usar agentes de IA sin darles las llaves de todo, [cuéntanos tu caso](/contact). Y mientras tanto, cambia esa contraseña que llevas usando desde 2015. Sí, esa.
