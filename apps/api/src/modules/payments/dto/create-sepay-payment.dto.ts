import { IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateSepayPaymentDto {
    @IsUUID()
    orderId!: string;

    @IsOptional()
    @IsUrl({ require_tld: false })
    returnUrl?: string;
}
