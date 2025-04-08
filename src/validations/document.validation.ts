import { IsEmail, IsOptional, IsString } from "class-validator";

export class SendEmailDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    subject?: string;
}
