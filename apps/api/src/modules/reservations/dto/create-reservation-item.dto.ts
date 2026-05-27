import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class CreateReservationItemDto {
    @IsUUID()
    ticketTypeId!: string;

    @IsInt()
    @IsPositive()
    quantity!: number;
}
