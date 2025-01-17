import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import { UserService } from '../services/user.service';
import { Controller, Delete, Get, Post, Put } from '../core'
import ApiError from '../utils/apiError';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../validations/user.validation';

@Service()
@Controller('/users')
export default class UserController {
  @Inject(() => UserService)
  private readonly userService: UserService;



  @Get('/:id', {
    isAuthenticated: true,
    authorizedRole: 'all',
  }, User)
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.findOneById(req.params.id);
      if (!user) throw new ApiError('User not found', 404);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  @Post('/',CreateUserDto, {
    isAuthenticated: false,
    authorizedRole: 'all',
  }, User)
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newUser = await this.userService.create(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  @Put('/:id', CreateUserDto, {
    isAuthenticated: true,
    authorizedRole: 'all',
  }, User || null)
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedUser = await this.userService.update(req.params.id, req.body);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  @Delete('/:id', {
    isAuthenticated: true,
    authorizedRole: 'all',
  },{})
  async deleteUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.findOneById(req.params.id);
      if (!user) throw new ApiError('User not found', 404);

      await this.userService.delete(req.params.id);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
