# CLAUDE.md — dvckstudio.com

Las reglas del proyecto viven en `AGENTS.md` (fuente única, compartida con otros agentes). Léelas y síguelas:

@AGENTS.md

## Notas específicas de Claude Code

- **Entorno:** Windows 11, PowerShell 5.1 como shell principal (`&&` no existe: usa `A; if ($?) { B }`). El Bash tool (Git Bash) sirve para scripts POSIX.
- **Sin git:** antes de editar muchos archivos, copia los originales a una carpeta de backup en el scratchpad de la sesión. Menciona al usuario dónde quedó el backup.
- **Capturas y comprobación visual:** instala `playwright-core` en el scratchpad (nunca en `package.json`) y lanza el Chrome/Edge del sistema contra `npm run preview`. Revisa 390×844 y 1440×900.
- **Servidores:** `npm run dev` y `npm run preview` se quedan abiertos; lánzalos en segundo plano y ciérralos al terminar.
- **Idioma:** responde al usuario en español. Código y comentarios en inglés (ver AGENTS.md).
- **Mantén un solo origen de verdad:** si una regla nueva afecta a cualquier agente, añádela a `AGENTS.md`, no aquí. Aquí solo va lo exclusivo de Claude Code.
