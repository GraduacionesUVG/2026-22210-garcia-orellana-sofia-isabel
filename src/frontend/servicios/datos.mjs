function dataSource() {
  switch (process.env.ANTROPOLOGIA_MODO ?? 'conectado') {
    case 'demo':
      return import('../../demo/router.mjs');
    case 'conectado':
      return import('../../conexion/backend.mjs');
    default:
      throw new Error('El modo del frontend debe ser demo o conectado.');
  }
}

export async function handleApiRequest(request) {
  const source = await dataSource();
  return source.handleApiRequest(request);
}

export async function handleAuthCallback(request) {
  const source = await dataSource();
  return source.handleAuthCallback(request);
}
