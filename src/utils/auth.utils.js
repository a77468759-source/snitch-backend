import config from "../config/config.js";
import jwt from "jsonwebtoken";

export function createAccessToken({ userId, role } = {}) {
  if (!userId) {
    throw new Error("userId is required to create access token");
  }

  const accessToken = jwt.sign({ userId, role }, config.ACCESS_TOKEN, { expiresIn: "15m" });
  return accessToken;
}

export function createRefreshToken({ userId, role } = {}) {
  if (!userId) {
    throw new Error("userId is required to create refresh token");
  }

  const refreshToken = jwt.sign({ userId, role }, config.REFRESH_TOKEN, { expiresIn: "7d" });
  return refreshToken;
}

export function readRefreshToken(refreshToken) {
  
  return jwt.verify(refreshToken, config.REFRESH_TOKEN);
}

export function readAccessToken(accessToken){
    return jwt.verify(accessToken,config.ACCESS_TOKEN)
}