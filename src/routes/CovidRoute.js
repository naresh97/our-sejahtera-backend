const { User } = require("../db/db");

function CovidRoute(req, res){
    if(!req.session.user){
        res.status(401).send("Not logged in");
        return;
    }

    console.log(`SetPositive: ${req.body.setPositive}`);

    if(req.body.setPositive){
        setUserCovidPositive(req.session.user, true, response=>{
            res.send({covidPositive: response});
        });
    }else{
        getUserCovidPositivity(req.session.user, (success, positivity)=>{
            res.status(success ? 200 : 400).send({covidPositive: positivity});
        });
    }
}

function getUserCovidPositivity(telegramID, callback){
    User.findOne({
            where: {telegram: telegramID},
    })
    .then(user=>{
        if(user){
            const infectionDuration = user.infectionDate - Date.now();
            if(infectionDuration > 60 * 60 * 24 * 14){
                setUserCovidPositive(telegramID, false, res=>{
                    callback(res, res ? false : null);
                });
            }else{
                callback(true, user.isInfected);
            }
        }else{
            callback(false, null);
        }
    })
    .catch(()=>{
        callback(false, null);
    })
}

function setUserCovidPositive(telegramID, infectionState, callback){
    User.findOne({
        where: {telegram: telegramID},
    })
    .then(user=>{
        if(user){
            user.isInfected = infectionState;
            user.infectionDate = Date.now();
            user.save().then(()=>callback(true)).catch(()=>callback(false));
        }else{
            callback(false);
        }
    })
    .catch(()=>callback(false));
}

exports.CovidRoute = CovidRoute;