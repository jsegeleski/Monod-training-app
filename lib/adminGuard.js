import { parse } from 'cookie';

export default async function adminGuard(ctx) {
  const cookies = parse(ctx.req?.headers?.cookie || '');
  const ok = cookies.admin === '1' || cookies.admin_auth === 'true' || cookies.admin_client === '1';
  if (!ok) {
    return {
      redirect: {
        destination: '/admin/login?next=' + encodeURIComponent(ctx.resolvedUrl || '/admin'),
        permanent: false,
      },
    };
  }
  ctx.res?.setHeader?.('Cache-Control', 'no-store, max-age=0');
  return { props: {} };
}