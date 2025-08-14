export default function handler(req, res) {
  // Only respond for OPTIONS so we don't shadow other routes
  if (req.method !== "OPTIONS") return res.status(405).end();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
}
