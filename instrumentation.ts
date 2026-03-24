export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[instrumentation] DATABASE_URL starts with:', process.env.DATABASE_URL?.slice(0, 30));
    console.log('[instrumentation] All env var keys:', Object.keys(process.env).join(', '));
  }
}
