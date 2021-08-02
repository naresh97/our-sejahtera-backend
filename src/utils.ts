export function getCookieExpiry(): Date {
  return new Date(Date.now() + Number(process.env.COOKIE_EXPIRY_DURATION));
}
