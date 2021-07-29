const { Op } = require("sequelize");
const { User, Contact } = require("../db/db");
const { strings_en } = require("../strings");
const { sendTelegramMessage } = require("../telegram");

function TelegramWebhookRoute(req, res) {

    try{
        if(req.body.message.connected_website){
            sendTelegramMessage(req.body.message.from.id, "Thanks for using OurSejahtera! Let's stay safer together <3");
        }else{
            const messageText = req.body.message.text;
            const telegramID = req.body.message.from.id;
            if (messageText.toLowerCase() == "/covidpositive") {
                userInfected(telegramID, (result) => {
                    if(result.saved){
                        sendTelegramMessage(telegramID, strings_en.telegram_inform_positive);
                        informContacts(telegramID);
                    }else{
                        sendTelegramMessage(telegramID, "Sorry, something went wrong.");
                    }
                });
            }
        }
    }catch(e){
        console.log("Could not get Telegram Message");
    }

  res.send();
}

function informContacts(telegramID, doneCallback=()=>{}){
    User.findOne({
        where: {
            telegram: telegramID,
        }
    }).then(user => {
        if(user){
            const userRowID = user.id;
            Contact.findAll({
                where: {
                    [Op.or]: [{user: userRowID}, {with: userRowID}],
                }
            })
            .then(result => {
                result.forEach(contact => {
                    const otherPersonID = contact.user == userRowID ? contact.with : contact.user;
                    User.findOne({
                        where: {
                            id: otherPersonID,
                        }
                    }).then(otherPerson => {
                        sendTelegramMessage(otherPerson.telegram, strings_en.telegram_inform_infect);
                    });
                });
            });
        }
    });

}

function userInfected(telegramID, doneCallback) {
  User.findOne({
    where: {
      telegram: telegramID,
    },
  })
    .then((user) => {
      if (!user) {
        done({ saved: false });
      } else {
        user.isInfected = true;
        user
          .save()
          .then((result) => {
            if (result) {
              doneCallback({ saved: true });
            }
          })
          .catch((err) => {
            doneCallback({ saved: false });
          });
      }
    })
    .catch((err) => {
      doneCallback({ saved: false });
    });
}

exports.TelegramWebhookRoute = TelegramWebhookRoute;
