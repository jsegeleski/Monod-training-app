// lib/adminGuard.js
import { parse } from 'cookie';

export function requireAdmin(ctx) {
  const cookies = parse(ctx?.req?.headers?.cookie || '');
  const isAdmin = cookies.admin === '1' || cookies.admin_embed === '1';
  if (!isAdmin) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
  return { props: {} };
}