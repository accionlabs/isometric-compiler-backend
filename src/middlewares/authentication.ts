import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken'
import ApiError from "../utils/apiError";
import {keycloakConfig} from "../configs/keycloak";
import axios from "axios";
import jwkToPem from 'jwk-to-pem'
import Container from "typedi";
import { UserService } from "../services/user.service";
import { User } from "../entities/user.entity";
import config from "../configs";

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}


export function authenticate (isAuthenticated: boolean) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try{
      if (!isAuthenticated) {
        return next()
      }
      if (req.headers['api-key']) {
        if (config.API_KEY === req.headers['api-key']) {
          return next()
        }
      }
      
      if (isAuthorizationHeader(req)) {
  
        const payload: any = await getPayload(req, next);
  
        if (!payload) throw new ApiError("You are not Authorized", 401);
  
        if (isExpired(payload.exp)) throw new ApiError("Token Expired!", 401);
        const profile = await getProfile(payload);
        if (!profile) throw new ApiError("Token not Valid", 401);

        const userInstance = Container.get(UserService)
        const userResp = await userInstance.findOneByEmail(profile.email)
        if (!userResp) throw new ApiError("You are not Authorized.", 401);
  
        req.user = userResp
        next();
      } else {
        throw new ApiError(
          "You are not Authorized, Please provide valid token",
          401
        );
      }
    }catch(e){
      next(e)
    }
    
  }
}

const isExpired = (expiration: number) => {
  if (Date.now() >= expiration * 1000) {
    return true;
  }
  return false;
};

const isAuthorizationHeader = (req: Request) => {
  if (req && req.headers && req.headers.authorization) {
    return true;
  }
  return false;
};

const getPayload = async (req: Request, next: NextFunction) => {
  const token = validateGetToken(req);
  if (token) {
    //decode token and add original token to payload and return payload
    const payload: any = decodeToken(token);
    if (payload) {
      payload.original_token = token;
      return payload;
    } else {
      return;
    }
  } else {
    return;
    // throw new Error('Invalid authorization header format. Format is Authorization: Bearer [token]');
  }
};

const getProfile = async (payload: any) => {
  if (payload.exp && payload.preferred_username) {
    const validUser = await isValidIssuer(payload.iss);
    if (!validUser) throw new ApiError("You are not valid user", 401);
    const key = await publicKey.get(payload.iss);
    jwt.verify(payload.original_token, key);
    return {
      username: payload.preferred_username,
      expiration: payload.exp,
      provider: "keycloak",
      email: payload.email || "test@test.com",
      roles: payload.resource_access?.accionconnect?.roles || ["EMPLOYEE"],
    };
  }
};

const isValidIssuer = async (issuerUrl: string) => {
  if (!keycloakConfig.KEYCLOAK_LOGIN_URL) {
    throw new Error("No login url!");
  }
  const url = new URL(issuerUrl);
  const loginUrl = new URL(keycloakConfig.KEYCLOAK_LOGIN_URL);
  if (url.host === loginUrl.host) {
    return true;
  }
  return false;
};

const publicKey = (() => {
  let publicKeys : any = {};
  return {
    get: async (url: string) => {
      if (publicKeys[url]) {
        return publicKeys[url];
      } else {
        const publicKeyUrl = `${url}/protocol/openid-connect/certs`;
        const {
          data: { keys: [key] = null },
        } = await axios.get(publicKeyUrl);
        publicKeys[url] = jwkToPem(key);
        return publicKeys[url];
      }
    },
    clear: () => {
      console.log("Clear IAM public key cache");
      publicKeys = {};
    },
  };
})();

// this method split authorization token and return token only by removing bearer keyword
const validateGetToken = (req: Request) => {
  const parts = req?.headers?.authorization?.split(" ");

  if (parts?.length === 2) {
    const [scheme, token] = parts;
    if (/^Bearer$/i.test(scheme)) {
      return token;
    }
  }
  return false;
};

const decodeToken = (token : string) => {
  return jwt.decode(token);
};