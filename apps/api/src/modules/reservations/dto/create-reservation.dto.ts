import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReservationItemDto } from './create-reservation-item.dto';

export class CreateReservationDto {
    @IsUUID()
    eventId!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateReservationItemDto)
    items!: CreateReservationItemDto[];
}
