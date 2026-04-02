import { IsNumber, IsPositive, IsInt, Min, Max } from 'class-validator';

export class RequestTopUpDto {
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(1_000_000)
    amount: number;
}

export class ApproveRejectTopUpDto {
    @IsInt()
    topUpId: number;
}
