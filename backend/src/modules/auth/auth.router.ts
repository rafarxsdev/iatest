import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { asyncHandler } from '@common/middleware/async-handler';
import { jwtGuard } from '@common/guards/jwt.guard';
import { getEnvConfig } from '@config/env.config';
import { ParameterRepository, ParameterService } from '@modules/config';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

const env = getEnvConfig();
const authRepository = new AuthRepository(AppDataSource);
const parameterRepository = new ParameterRepository(AppDataSource);
const parameterService = new ParameterService(parameterRepository);
const authService = new AuthService(authRepository, parameterService, env);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post('/login', asyncHandler(authController.login));
authRouter.get('/me', jwtGuard, asyncHandler(authController.me));
authRouter.post('/logout', jwtGuard, asyncHandler(authController.logout));
