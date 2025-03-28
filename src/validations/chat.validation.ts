import { IsString, IsOptional, MinLength, IsObject, MaxLength, ValidateNested, IsArray, ValidateIf, IsBoolean } from 'class-validator';
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

export class GitRepoValidation {
    @IsString()
    @MinLength(1)
    repoUrl: string

    @IsString()
    @MinLength(1)
    uuid: string

    @IsOptional()
    @IsBoolean()
    isCloudStore: boolean
}
