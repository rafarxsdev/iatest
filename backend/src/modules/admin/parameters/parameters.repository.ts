import type { DataSource } from 'typeorm';
import { Parameter } from '@database/entities/parameter.entity';
import { User } from '@database/entities/user.entity';

export class ParametersRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllOrdered(): Promise<Parameter[]> {
    return this.dataSource.getRepository(Parameter).find({
      relations: { category: true },
      order: { key: 'ASC' },
    });
  }

  async findById(id: string): Promise<Parameter | null> {
    return this.dataSource.getRepository(Parameter).findOne({
      where: { id },
      relations: { category: true },
    });
  }

  async updateValue(id: string, value: string, updatedByUserId: string): Promise<Parameter | null> {
    const param = await this.findById(id);
    if (!param) {
      return null;
    }
    param.value = value;
    param.updatedAt = new Date();
    param.updatedBy = { id: updatedByUserId } as User;
    return this.dataSource.getRepository(Parameter).save(param);
  }
}
