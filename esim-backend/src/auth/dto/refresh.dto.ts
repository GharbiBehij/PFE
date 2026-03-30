import { IsInt, IsString } from "class-validator";

export class refreshDto {
    @IsString()
    refreshToken: string

    @IsInt()
    id: number
}