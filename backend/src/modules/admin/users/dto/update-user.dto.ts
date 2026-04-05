import { UUID_STRING_REGEX } from '@common/validators/uuid-string';
import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @Matches(UUID_STRING_REGEX, { message: 'roleId debe ser un UUID válido' })
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
