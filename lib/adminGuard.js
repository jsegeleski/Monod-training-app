// lib/adminGuard.js
import { parse } from 'cookie';

export function withAdminGuard(gssp) {
  return async (ctx) => {
    const cookies = parse(ctx.req?.headers?.cookie || '');

    // Accept any of the cookies we might set
    const ok =
      cookies.admin === '1' ||          // host cookie (Lax or None, depending)
      cookies.admin_wide === '1' ||     // parent-domain cookie (.example.com)
      cookies.admin_lax === '1' ||      // explicit Lax cookie
      cookies.admin_client === '1' ||   // non-HttpOnly mirror
      cookies.admin_auth === 'true';    // legacy

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