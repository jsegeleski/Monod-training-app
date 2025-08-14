import { parseCookies } from './cookies';

export function requireAdmin(ctx) {
  const { req } = ctx;
  const cookies = parseCookies(req);
  if (cookies['admin_auth'] !== 'true') {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return null;
}
