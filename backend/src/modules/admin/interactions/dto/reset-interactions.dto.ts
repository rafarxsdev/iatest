import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResetInteractionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
