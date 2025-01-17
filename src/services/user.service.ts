import { Service } from 'typedi';
import { User } from '../entities/user.entity';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';

@Service()
export class UserService extends BaseService<User> {

  constructor() {
    super(AppDataSource.getMongoRepository(User));
    
  }


}
