import { Request, Response } from "express";
import { getUserCovidPositivity, setUserCovidPositivity } from "../db/models/User.helper";

interface CovidRouteRequest extends Request {
    body:{
        setPositive: boolean;
    }
}

export function CovidRoute(req: CovidRouteRequest, res:Response){
    if(!req.session.userTelegramID){
        res.status(401).send("Not logged in");
        return;
    }

    if(req.body.setPositive){
        setUserCovidPositivity(req.session.userTelegramID, true, success=>{
            res.send({covidPositive: true});
        });
    }else{
        getUserCovidPositivity(req.session.userTelegramID, isInfected=>{
            res.status(isInfected ? 200 : 400).send({covidPositive: isInfected});
        });
    }
}

