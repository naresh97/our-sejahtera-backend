const { default: axios } = require("axios");

function setTelegramWebHook(done) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`;
  axios
    .post(url, {
      url: `${process.env.SERVER_API_URL}/${process.env.TELEGRAM_SECRET}`,
      allowed_updates: [],
      drop_pending_updates: true,
    })
    .then((res) => {
      done(res);
    })
    .catch((err) => {
      done(err);
    });
}

function sendTelegramMessage(telegramID, message, done = () => {}) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  axios
    .post(url, {
      chat_id: telegramID,
      text: message,
    })
    .then((res) => {
      done(res);
    })
    .catch((err) => {
      console.error("Problem sending Telegram message.");
      done(err);
    });
}

setTelegramWebHook(() => {});

exports.sendTelegramMessage = sendTelegramMessage;
exports.setTelegramWebHook = setTelegramWebHook;
