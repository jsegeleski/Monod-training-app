// pages/admin/_debug.js  (temporary)
import { parse } from 'cookie';
export async function getServerSideProps(ctx) {
  return { props: { cookies: parse(ctx.req?.headers?.cookie || '') } };
}
export default function Debug({ cookies }) { return <pre>{JSON.stringify(cookies, null, 2)}</pre>; }