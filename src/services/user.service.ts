import { Service } from 'typedi';
import { User } from '../entities/user.entity';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { KeycloakService } from './keycloak.service';
import ApiError from '../utils/apiError';

@Service()
export class UserService extends BaseService<User> {

  constructor() {
    super(AppDataSource.getMongoRepository(User));
  }

  /**
   * Find a user by email.
   */
  async findOneByEmail(email: string): Promise<User | null> {
    const repository = this.getRepository()
    return repository.findOneBy({ email });
  }

}
