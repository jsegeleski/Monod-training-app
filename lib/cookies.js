const cookie = require("cookie");

function setCookie(res, name, value, days=1) {
  const serialized = cookie.serialize(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
  res.setHeader("Set-Cookie", serialized);
}

function parseCookies(req) {
  return cookie.parse(req.headers.cookie || "");
}

module.exports = { setCookie, parseCookies };
