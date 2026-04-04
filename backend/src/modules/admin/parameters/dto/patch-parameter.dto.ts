import { IsString, MinLength } from 'class-validator';

export class PatchParameterDto {
  @IsString()
  @MinLength(1)
  value!: string;
}
