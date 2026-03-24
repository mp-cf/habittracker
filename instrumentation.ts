export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dbVars = Object.entries(process.env)
      .filter(
        ([k]) =>
          k.includes('DATABASE') ||
          k.includes('POSTGRES') ||
          k.includes('PG') ||
          k.includes('RAILWAY'),
      )
      .map(([k, v]) => `${k}=${v ? v.slice(0, 20) + '...' : '(empty)'}`);

    console.log('[instrumentation] DB-related env vars:', dbVars.length ? dbVars.join(', ') : 'NONE FOUND');
  }
}
