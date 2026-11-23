# Backend

Desde `Backend`:

```powershell
npm install
npm run dev
```

El servidor guarda las cuentas, eventos, stands, concursos, reservas e inscripciones en `data/fuwafuwacon.json`. Ese archivo no se versiona. La sesión dura ocho horas y se invalida al reiniciar el servidor.

Desde Administración se pueden agregar eventos, stands y concursos.

En otra terminal, desde `frontend`, ejecutá `npm install` una vez y luego `npm run dev`. Vite publica la interfaz en `http://localhost:5173` y deriva `/api` al servidor local.

Rutas principales:

- `POST /api/auth/registro`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/eventos`, `GET /api/eventos/:id/stands`, `GET /api/eventos/:id/concursos`
- `POST /api/reservas`, `GET /api/reservas/mias`, `DELETE /api/reservas/:id`
- `POST /api/concursos/:id/inscripciones`, `GET /api/concursos/inscripciones/mias`
- `/api/admin/*` para administración de eventos, mesas, concursos, reservas y usuarios

Para correr las pruebas:

```powershell
npm test
```
