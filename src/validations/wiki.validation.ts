import { IsOptional, IsString } from 'class-validator';

export class WikiValidationDto {
    @IsString({ message: 'Repository URL must be a string' })
    repo_url: string;

    @IsString({ message: 'Prompt must be a string' })
    prompt: string;

    @IsOptional()
    @IsString({ message: 'Token must be a string' })
    token?: string;
}