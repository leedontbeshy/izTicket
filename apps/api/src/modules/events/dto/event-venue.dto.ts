import {
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';

export class EventVenueDto {
    @IsString()
    @MinLength(1)
    @MaxLength(160)
    name!: string;

    @IsString()
    @MinLength(1)
    address!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    city!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    district?: string;

    @IsOptional()
    @IsUrl()
    mapUrl?: string;
}
