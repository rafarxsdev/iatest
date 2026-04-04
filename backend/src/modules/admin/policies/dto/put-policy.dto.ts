import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class PutPolicyDto {
  /** Omitir o `null` = política por defecto de la card (`role_id` NULL). */
  @IsOptional()
  @IsUUID()
  roleId?: string | null;

  @IsInt()
  @Min(1)
  maxInteractions!: number;

  @IsUUID()
  resetPolicyId!: string;
}
