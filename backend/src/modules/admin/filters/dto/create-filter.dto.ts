import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  IsString,
} from 'class-validator';

export class CreateFilterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^\S+$/, { message: 'value no debe contener espacios' })
  value!: string;

  @IsUUID()
  filterTypeId!: string;

  @IsOptional()
  @IsUUID()
  parentFilterId?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
