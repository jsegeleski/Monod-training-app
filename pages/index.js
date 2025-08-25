import { withAdminGuard } from '../../lib/adminGuard';
export const getServerSideProps = withAdminGuard();
export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1>Training App — Starter Kit</h1>
        <p>This app exposes two parts:</p>
        <ol>
          <li><b>Admin Dashboard:</b> <code>/admin</code> (password protected with <code>ADMIN_PASSWORD</code>)</li>
          <li><b>Embeddable Portal:</b> <code>/embed.js</code> (drop on a Shopify page)</li>
        </ol>
        <p>Deploy this on Vercel, set the <code>ADMIN_PASSWORD</code>, then paste the script on a hidden Shopify page.</p>
      </div>
    </div>
  );
}
