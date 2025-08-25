// lib/adminGuard.js
import { parse } from 'cookie';

/**
 * Higher-order guard: wrap a GSSP to require admin.
 * Usage:
 *   export const getServerSideProps = withAdminGuard(async (ctx) => ({ props: {} }));
 */
export function withAdminGuard(gssp) {
  return async (ctx) => {
    const cookies = parse(ctx.req?.headers?.cookie || '');

    const ok =
      cookies.admin === '1' ||        // primary (SameSite=Lax)
      cookies.admin_auth === 'true' ||// legacy fallback
      cookies.admin_embed === '1';    // cross-site (SameSite=None)

    if (!ok) {
      return {
        redirect: {
          destination:
            '/admin/login?next=' + encodeURIComponent(ctx.resolvedUrl || '/admin'),
          permanent: false,
        },
      };
    }

    // Prevent caches from serving stale redirects
    if (ctx.res?.setHeader) {
      ctx.res.setHeader('Cache-Control', 'no-store, max-age=0');
    }

    return gssp ? await gssp(ctx) : { props: {} };
  };
}

/**
 * Convenience default export so you can do:
 *   import adminGuard from '../../lib/adminGuard'
 *   export const getServerSideProps = adminGuard;
 *
 * or still use the named HOC above.
 */
const adminGuard = withAdminGuard();
export default adminGuard;