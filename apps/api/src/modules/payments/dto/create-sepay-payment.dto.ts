import { IsUUID } from 'class-validator';

export class CreateSepayPaymentDto {
    @IsUUID()
    orderId!: string;
}
