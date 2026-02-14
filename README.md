# Coachrun (Cholo Run)

Juego arcade construido con React + Canvas.

## Frontend-only

Este proyecto está diseñado para ejecutarse **solo en el navegador**:

- Usa `window`, eventos de teclado/táctiles y `window.localStorage` para progreso.
- Renderiza el juego en `<canvas>` en tiempo real.
- Módulos como `src/game/progression.js` deben considerarse de uso cliente.

> No importar la lógica del juego en handlers SSR/serverless futuros. Si se integra en un framework con SSR, mantener este juego detrás de un boundary cliente (por ejemplo, componente client-only/dynamic import sin SSR).

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
