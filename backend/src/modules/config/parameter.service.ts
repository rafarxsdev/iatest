import { AppError } from '@common/errors/app-error';
import { ParameterRepository } from './parameter.repository';

export type ParameterValueType = 'number' | 'boolean' | 'json' | 'string';

/**
 * Resolución de parámetros: `user_parameters` → `role_parameters` → `parameters`.
 * Sin router ni controller; solo inyectado en otros servicios.
 */
export class ParameterService {
  constructor(private readonly parameterRepository: ParameterRepository) {}

  /**
   * 1. `user_parameters` por `(user_id, key)`
   * 2. Si no: `role_parameters` por `(role_id del usuario, key)`
   * 3. Si no: `parameters.value` por `key`
   * 4. Si `key` no existe en `parameters` → AppError 500
   */
  async resolve(key: string, userId: string): Promise<string> {
    const user = await this.parameterRepository.findUserWithRole(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const base = await this.parameterRepository.findParameterByKey(key);
    if (!base) {
      throw new AppError(`Parámetro no configurado en el sistema: ${key}`, 500);
    }

    const userValue = await this.parameterRepository.findUserParameterValueByUserAndKey(userId, key);
    if (userValue !== null) {
      return userValue;
    }

    const roleValue = await this.parameterRepository.findRoleParameterValueByRoleAndKey(user.role.id, key);
    if (roleValue !== null) {
      return roleValue;
    }

    return base.value;
  }

  /**
   * Resuelve y convierte el valor según `data_type` del registro en `parameters` y el tipo solicitado.
   * El `type` debe coincidir con `parameter.dataType` en base de datos.
   */
  async resolveAs<T>(key: string, userId: string, type: ParameterValueType): Promise<T> {
    const parameter = await this.parameterRepository.findParameterByKey(key);
    if (!parameter) {
      throw new AppError(`Parámetro no configurado en el sistema: ${key}`, 500);
    }

    if (parameter.dataType !== type) {
      throw new AppError(
        `El parámetro "${key}" tiene data_type "${parameter.dataType}"; se solicitó cast a "${type}"`,
        400,
      );
    }

    const raw = await this.resolve(key, userId);
    return this.castRaw(raw, type) as T;
  }

  private castRaw(raw: string, type: ParameterValueType): unknown {
    switch (type) {
      case 'string':
        return raw;
      case 'number': {
        const n = Number(raw);
        if (Number.isNaN(n)) {
          throw new AppError(`Valor numérico inválido para parámetro`, 500);
        }
        return n;
      }
      case 'boolean': {
        const t = raw.trim().toLowerCase();
        if (t === 'true' || t === '1') {
          return true;
        }
        if (t === 'false' || t === '0') {
          return false;
        }
        throw new AppError(`Valor booleano inválido para parámetro`, 500);
      }
      case 'json': {
        try {
          return JSON.parse(raw) as unknown;
        } catch {
          throw new AppError('JSON inválido en valor de parámetro', 500);
        }
      }
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }
}
