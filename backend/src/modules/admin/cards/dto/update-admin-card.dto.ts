import { IsBoolean, Equals, IsInt, IsObject, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';

export class UpdateAdminCardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsUUID()
  filterId?: string;

  @IsOptional()
  @IsUUID()
  widgetTypeId?: string;

  @IsOptional()
  @IsObject()
  widgetConfiguration?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /** Enviar `null` para restaurar una card eliminada (soft delete). */
  @IsOptional()
  @ValidateIf((_o, v) => v !== undefined)
  @Equals(null)
  deletedAt?: null;
}
