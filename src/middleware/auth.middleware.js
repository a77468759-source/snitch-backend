import { readAccessToken } from "../utils/auth.utils.js";

export function authenticate(req,res,next){
    const authorization = req.headers.authorization
    const accessToken = authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : undefined

    if(!accessToken){
        return res.status(400).json({
            message:"Access Token not found in the request header"
        })
    }
    try{
        const decoded = readAccessToken(accessToken)
        req.user = decoded
        next()
    }catch(err){
        return res.status(401).json({
            message:"Invalid or Expire Access Token"
        })
    }
}