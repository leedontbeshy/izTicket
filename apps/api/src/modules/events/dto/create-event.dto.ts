import { Type } from 'class-transformer';
import {
    IsDateString,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { EventVenueDto } from './event-venue.dto';

export class CreateEventDto {
    @IsString()
    @MinLength(1)
    @MaxLength(180)
    title!: string;

    @IsString()
    @MinLength(1)
    description!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(80)
    category!: string;

    @ValidateNested()
    @Type(() => EventVenueDto)
    venue!: EventVenueDto;

    @IsDateString()
    startsAt!: string;

    @IsDateString()
    endsAt!: string;

    @IsOptional()
    @IsUrl()
    thumbnailUrl?: string;
}
