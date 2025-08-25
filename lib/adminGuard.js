// lib/adminGuard.js
import { parse } from 'cookie';

export function withAdminGuard(gssp) {
  return async (ctx) => {
    const cookies = parse(ctx.req?.headers?.cookie || '');
    const ok =
      cookies.admin === '1' ||
      cookies.admin_wide === '1' ||
      cookies.admin_client === '1' ||
      cookies.admin_auth === 'true';

    if (!ok) {
      return {
        redirect: {
          destination: '/admin/login?next=' + encodeURIComponent(ctx.resolvedUrl || '/admin'),
          permanent: false,
        },
      };
    }
    ctx.res.setHeader('Cache-Control', 'no-store, max-age=0');
    return gssp ? await gssp(ctx) : { props: {} };
  };
}