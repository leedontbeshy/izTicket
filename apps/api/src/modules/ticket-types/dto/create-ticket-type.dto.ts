import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateTicketTypeDto {
    @IsString()
    @MinLength(1)
    @MaxLength(120)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    price!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    totalQuantity!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxPerOrder?: number;

    @IsDateString()
    saleStartsAt!: string;

    @IsDateString()
    saleEndsAt!: string;
}
