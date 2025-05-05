import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Agents } from '../enums';
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
    @IsEnum(Agents)
    agents?: Agents

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

enum Key {
    diagram = 'diagram',
    blueprint = 'blueprint',

}

export class ChatGenerateValidation {
    @IsString()
    @MinLength(10)
    @MaxLength(50)
    uuid: string

    @IsNumber()
    @IsOptional()
    documentId?: number

    @IsEnum(Key)
    key: string

    @IsString()
    @IsOptional()
    fileUrl?: string
}
