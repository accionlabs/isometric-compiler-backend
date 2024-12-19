import { IShape } from '../interfaces/Shape'
import { Length, IsString } from 'class-validator'

export class ValidShape implements IShape {
  @Length(2, 10)
  name: string;

  @IsString()
  description: string;
}