import { IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
