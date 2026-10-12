import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  createAccessToken,
  createRefreshToken,
  readRefreshToken,
} from "../utils/auth.utils.js";

function emailLookup(email) {
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return { email: { $regex: `^${escapedEmail}$`, $options: "i" } }
}

export async function register(req,res) {
    const {email,name,password}=req.body;
    const userAleadyExists = await userModel.findOne(emailLookup(email));

    if(userAleadyExists){
        return res.status(400).json({
            message:"User already Exists",
            errors:[
                {
                    path: "email",
                    msg:"already exists"
                }
            ]
            
        });
    }

    const user = await userModel.create({
        email: email.trim().toLowerCase(),
        name,
        passwordHash:await bcrypt.hash(password,12)
    });

    const accessToken = createAccessToken({
        userId: user._id,
        role: user.role
    })

    const refreshToken = createRefreshToken({
        userId:user._id,
        role:user.role
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })
    await userModel.findByIdAndUpdate(user._id,{
        refreshToken
    })
    res.status(200).json({
        message:"User registered Successfully",
        data:{
            user:{
                email:user.email,
                name:user.name,
                id:user._id
            }, accessToken
        }
    })
}

export async function login(req,res) {
    const {email,password} = req.body;
    const user = await userModel.findOne(emailLookup(email))
 
    if(!user){
        return res.status(400).json({
            message:"Invalid Email or Password!"
        })
    }

    const isPasswordValid =  await bcrypt.compare(password,user.passwordHash)

    if(!isPasswordValid){
        return res.status(400).json({
          message:"Invalid Email or Password!"
        })
    }

    const accessToken = createAccessToken({
        userId:user._id,
        role:user.role
    })

    const refreshToken = createRefreshToken({
        userId:user._id,
        role:user.role
    })

    await userModel.findByIdAndUpdate(user._id,
        {
            refreshToken
        }
    )

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })

    return res.status(200).json({
        message:"User loggedIn successfully",
        data:{
            user:{
                id:user._id,
                email:user.email,
                name:user.name
            },
            accessToken
        }
    })
}

export async function refresh(req,res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({
            message : "RefreshToken is required",
    });
    }
    try {
         const decoded = readRefreshToken(refreshToken);
         const user = await userModel.findById(decoded.userId);
             if (!user || refreshToken !== user.refreshToken) {
                return res.status(401).json({
                     message:"refresh token mismatched"
                })
       
             }
             const accessToken = createAccessToken({
                    userId: user._id,
                    role:user.role
                })
            
             const newRefreshToken = createRefreshToken({
                userId:user._id,
                role:user.role
             }) 
             
             await userModel.findByIdAndUpdate(user._id, {
                refreshToken: newRefreshToken
             })
             res.cookie("refreshToken", newRefreshToken, {
               httpOnly: true,
               sameSite: "lax",
               secure: process.env.NODE_ENV === "production"
               })
             return res.status(200).json({
                message:"Tokens Reeaded succesfully",
                data:{
                    user:{
                        id:user._id,
                        email:user.email,
                        name:user.name
                    },accessToken
                }
             })  
            }
        catch (error) {
            if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
                return res.status(401).json({ message: "Invalid or expired refresh token" })
            }
            throw error
        }
}  

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken
    if (refreshToken) {
        await userModel.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } })
    }
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    })
    return res.status(200).json({ message: "Logged out successfully" })
}

export async function getMe(req,res) {
    const {userId,role} = req.user

    const user = await userModel.findById(userId)
    return res.status(200).json({
        message:"User data fetched",
        data:{
            user:{
                id:user._id,
                email:user.email,
                name:user.name
            }
        }
    })
}