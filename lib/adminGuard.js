// lib/adminGuard.js
import { parse } from 'cookie';

export function withAdminGuard(gssp) {
  return async (ctx) => {
    const cookies = parse(ctx.req?.headers?.cookie || '');
    const ok =
      cookies.admin === '1' ||             // primary (SameSite=Lax)
      cookies.admin_auth === 'true';       // legacy fallback

    if (!ok) {
      return {
        redirect: {
          destination: '/admin/login?next=' + encodeURIComponent(ctx.resolvedUrl || '/admin'),
          permanent: false,
        },
      };
    }

    // prevent caches from serving a stale redirect
    ctx.res.setHeader('Cache-Control', 'no-store, max-age=0');

    return gssp ? await gssp(ctx) : { props: {} };
  };
}