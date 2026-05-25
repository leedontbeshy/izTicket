import {
    IsEmail,
    IsEnum,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class RegisterDto {
    @IsString()
    @MinLength(1)
    @MaxLength(120)
    name!: string;

    @IsEmail()
    @MaxLength(255)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/[a-z]/, {
        message: 'password must contain at least one lowercase letter',
    })
    @Matches(/[A-Z]/, {
        message: 'password must contain at least one uppercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'password must contain at least one number',
    })
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;
}
