import { IsString, IsOptional, MinLength, IsObject, MaxLength, ValidateNested, IsArray, ValidateIf } from 'class-validator';
// Metadata class to define the structure and validation of metadat
// Category validation class
export class ChatValidation {

    @IsString()
    @MinLength(1)  // Ensure name is not empty
    query: string


    @IsString()
    @MinLength(10)
    @MaxLength(50)
    uuid: string

    @IsOptional()
    currentState?: any[]
}
