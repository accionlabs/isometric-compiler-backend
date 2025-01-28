import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import { UserService } from '../services/user.service';
import { Controller, Delete, Get, Post, Put } from '../core'
import ApiError from '../utils/apiError';
import { User } from '../entities/user.entity';
import {  LoginUserDto } from '../validations/user.validation';
import jwt from 'jsonwebtoken'
import { KeycloakService } from '../services/keycloak.service';

@Service()
@Controller('/users')
export default class UserController {
  @Inject(() => UserService)
  private readonly userService: UserService;

  @Inject(() => KeycloakService)
  private readonly keycloakService: KeycloakService;


  @Post('/login', LoginUserDto,{
    isAuthenticated: false,
    authorizedRole: 'all',
  }, {})
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;


      // Decode the token
      let decodedToken: any;
      try {
        decodedToken = jwt.decode(token);
        if (!decodedToken) throw new Error('Invalid token');
      } catch (error) {
        throw new ApiError('Failed to decode token', 400);
      }

      // Check for token expiry
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        throw new ApiError('Token has expired', 401);
      }

      const email = decodedToken.email;
      if (!email) {
        throw new ApiError('Token does not contain email', 400);
      }

      // Check if user exists in the user collection
      let user = await this.userService.findOneByEmail(email);

      if (!user) {
        const accessToken = await this.keycloakService.getKeycloakAdminToken()
        // Fetch user details from Keycloak if not found in the database
        const userDetails = await this.keycloakService.getUserByEmail(email, accessToken);

        if (!userDetails) {
          throw new ApiError('User is not authenticated', 403);
        }

        // Create the user in the user collection
        user = await this.userService.create({
          email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName
        });
      }

      // Return success response
      res.status(200).json({
        message: 'Login successful',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
