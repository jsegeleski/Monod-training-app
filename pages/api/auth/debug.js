// pages/api/auth/debug.js
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    cookiesHeader: req.headers.cookie || '(none)'
  });
}