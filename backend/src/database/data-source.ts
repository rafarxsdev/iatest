import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getEnvConfig } from '@config/env.config';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import {
  ActionType,
  AuditLog,
  AuthLog,
  Card,
  CardInteractionPolicy,
  Filter,
  FilterType,
  InteractionLog,
  Parameter,
  ParameterCategory,
  Permission,
  ResetPolicy,
  Role,
  RoleParameter,
  RolePermission,
  Session,
  User,
  UserCardInteraction,
  UserParameter,
  UserSecurityStatus,
  WidgetType,
} from './entities';

const env = getEnvConfig();

/**
 * Esquemas de negocio (PostgreSQL). Las entidades usarán `schema` por tabla.
 * `search_path` facilita consultas y migraciones que referencian varios esquemas.
 */
const PG_SCHEMAS = ['security', 'config', 'content', 'interactions', 'logs', 'public'] as const;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  synchronize: false,
  logging: env.nodeEnv === 'development',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    ActionType,
    AuditLog,
    AuthLog,
    Card,
    CardInteractionPolicy,
    Filter,
    FilterType,
    InteractionLog,
    Parameter,
    ParameterCategory,
    Permission,
    ResetPolicy,
    Role,
    RoleParameter,
    RolePermission,
    Session,
    User,
    UserCardInteraction,
    UserParameter,
    UserSecurityStatus,
    WidgetType,
  ],
  migrations: [],
  extra: {
    // search_path para los 5 esquemas de aplicación + public (extensiones)
    options: `-c search_path=${PG_SCHEMAS.join(',')}`,
  },
});
