# Conexión con la API

El frontend siempre envía sus solicitudes a rutas de su propio origen. En modo conectado, el conector las reenvía a la API real y mantiene las cookies de sesión, las redirecciones, las descargas y los mensajes del asistente.

## Ejecutar con una instancia del proyecto

1. Iniciar el backend del [proyecto original](https://github.com/Hayser8/Antropologia) en un puerto distinto al del frontend. Debe atender `/api/` y `/auth/callback`.
2. Desde la raíz de la entrega, ejecutar `cd src` y `npm ci`.
3. Copiar la [plantilla de variables](../.env.example) con `cp -n .env.example .env.local` si el archivo todavía no existe.
4. En `.env.local`, configurar `NEXT_PUBLIC_APP_URL` con el origen de la interfaz y `BACKEND_ORIGIN` con el origen de la API. Por ejemplo, `http://localhost:3000` y `http://localhost:3317`, respectivamente.
5. Ejecutar `npm run conectado`, abrir [el acceso local](http://localhost:3000/login) e ingresar con una cuenta de esa instancia.

Si el servicio de autenticación requiere registrar una dirección de retorno, usar la ruta `/auth/callback` del origen público de la interfaz. Las credenciales de la base de datos y del proveedor de IA se configuran en el backend.

Ambas variables admiten el origen HTTP o HTTPS, por ejemplo `http://localhost:3317`. Si falta el origen de la API o una dirección incluye una ruta como `/api`, el conector responde con el estado 503 e indica qué variable revisar. Para probar la interfaz con datos ficticios, usar el [modo demo](../demo/README.md).

## Pruebas

Desde `src/`, ejecutar `npm run test:conexion` para comprobar el manejo de la sesión, las redirecciones y las descargas con una API temporal local. Con `npm run test:modos` se comprueba también la selección de la fuente de datos.
