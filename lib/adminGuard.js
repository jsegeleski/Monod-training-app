// lib/adminGuard.js
import { parse } from 'cookie';

/** Drop-in guard for getServerSideProps */
export default async function adminGuard(ctx) {
  const cookies = parse(ctx.req?.headers?.cookie || '');
  const ok = cookies.admin === '1' || cookies.admin_auth === 'true';
  if (!ok) {
    return {
      redirect: {
        destination: '/admin/login?next=' + encodeURIComponent(ctx.resolvedUrl || '/admin'),
        permanent: false,
      },
    };
  }
  // avoid bfcache issues and stale redirects
  ctx.res?.setHeader?.('Cache-Control', 'no-store, max-age=0');
  return { props: {} };
}

/** Wrapper if your page also needs to do server work */
export function withAdminGuard(gssp) {
  return async (ctx) => {
    const gate = await adminGuard(ctx);
    if ('redirect' in gate) return gate;
    return gssp ? await gssp(ctx) : { props: {} };
  };
}