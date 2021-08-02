"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookieExpiry = void 0;
function getCookieExpiry() {
    return new Date(Date.now() + Number(process.env.COOKIE_EXPIRY_DURATION));
}
exports.getCookieExpiry = getCookieExpiry;
