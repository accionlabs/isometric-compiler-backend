import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsOptional()
  @IsEnum(['DESIGNER', 'END_USER', 'ADMIN', 'COMPONENT_AUTHOR'], {
    message: 'Role must be one of DESIGNER, END_USER, ADMIN, COMPONENT_AUTHOR',
  })
  role?: 'DESIGNER' | 'END_USER' | 'ADMIN' | 'COMPONENT_AUTHOR';

  @IsOptional()
  @IsEnum(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  })
  status?: 'active' | 'inactive';
}

export class LoginUserDto{
    @IsNotEmpty({message: 'token is required!'})
    token: string
}
