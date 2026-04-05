import { IsInt, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateAdminCardDto {
  @IsString()
  title!: string;

  @IsString()
  htmlContent!: string;

  @IsUUID()
  filterId!: string;

  @IsUUID()
  widgetTypeId!: string;

  @IsOptional()
  @IsObject()
  widgetConfiguration?: Record<string, unknown>;

  /** Nombre del glifo Material Symbols Outlined (ej. `dashboard`). */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(100)
  iconName?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
