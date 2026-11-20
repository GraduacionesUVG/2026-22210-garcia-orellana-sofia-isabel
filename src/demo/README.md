# Demostración local del frontend

La demo usa las mismas pantallas del frontend con una cuenta y un estudio ficticios. Los datos se guardan en memoria, así que se puede probar todo sin instalar una base de datos, configurar claves ni iniciar otro servicio.

## Abrir la demo

Con Node.js 22 y npm instalados, ejecutar desde la raíz del repositorio.

```sh
cd src
npm ci
npm run demo
```

Abrir [la pantalla de acceso](http://localhost:3000/login) e ingresar con **demo@example.test** y la contraseña **Antropologia2026!**. Son credenciales de prueba que solo existen en la demo local. La [aplicación publicada](https://antropologia.vercel.app/login) tiene su propio sistema de acceso.

## Probar un recorrido completo

1. En el panel de proyectos, abrir **Memoria y cuidados en Las Jacarandas**. Las primeras tres etapas contienen el tema, la pregunta, los objetivos y la muestra de un estudio ficticio.
2. Entrar a **Corpus** y abrir **Entrevista P01 · Historias del patio**. Buscar «patio» en la transcripción. La ficha conserva la fuente, el alias y la fecha de la entrevista. En **Segmentos** se puede ver dónde empieza y termina cada cita.
3. En **Codificación**, abrir un segmento y revisar los códigos asignados. En **Explorar**, recorrer las pestañas de evidencia, patrones y relaciones para ver qué citas comparten códigos.
4. En **Memos** y **Hallazgos**, abrir una interpretación y seguir sus vínculos. En **Reporte** se pueden revisar los resultados y descargar archivos con los datos actuales del ejemplo.
5. Para empezar de cero, crear un proyecto desde el panel. También se puede registrar otra cuenta local y usar una invitación del equipo para probar el acceso compartido.

## Datos, cuentas y servicios simulados

El estudio incluye dos documentos, seis segmentos y tres códigos vinculados a citas del corpus. Los cambios se mantienen al navegar, actualizar la página y volver a iniciar sesión mientras el proceso siga activo. Al detenerlo y volver a iniciarlo, regresan los ejemplos iniciales.

El registro habilita la cuenta de inmediato. Para probar la recuperación de contraseña, solicitar el enlace desde el formulario y abrir la dirección que aparece en la terminal local. Las invitaciones se comparten copiando su enlace. El asistente muestra respuestas de ejemplo e indica que son simuladas. Los archivos de exportación se generan con los datos de la sesión local.

Las fuentes y los símbolos de la interfaz se cargan desde Google Fonts, igual que en la aplicación publicada. Por eso se necesita conexión a internet la primera vez que se abre.

## Configuración y pruebas

La demo usa el puerto 3000 por defecto. Para usar otro, copiar la [plantilla](../.env.example) a `.env.local` en `src/`, ajustar `NEXT_PUBLIC_APP_URL` al origen que se abrirá en el navegador y ejecutar, por ejemplo, `npm run demo -- --port 3001`.

Desde `src/`, ejecutar `npm run test:demo` para comprobar cuentas, proyectos, corpus, metodología, equipo, codificación, vínculos y exportaciones. Las [pruebas de la demo](pruebas/) están junto a los datos ficticios. Las [pantallas](../frontend/) son las mismas que usa el modo conectado.
