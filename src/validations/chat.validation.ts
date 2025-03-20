import { IsString, IsOptional, IsArray, IsInt, IsJSON, ValidateNested, IsNotEmpty, MinLength, isObject, IsObject, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
// Metadata class to define the structure and validation of metadat
// Category validation class
export class ChatValidation {

    @IsString()
    @MinLength(1)  // Ensure name is not empty
    message: string;
}
