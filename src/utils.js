function getCookieExpiry() {
  return new Date(Date.now() + process.env.COOKIE_EXPIRY_DURATION);
}

exports.getCookieExpiry = getCookieExpiry;
