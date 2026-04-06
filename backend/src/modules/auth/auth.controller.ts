import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { getEnvConfig } from '@config/env.config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const dto = plainToInstance(LoginDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }

    const env = getEnvConfig();
    const result = await this.authService.login(dto, clientIp(req), clientUserAgent(req));

    const decoded = jwt.decode(result.token);
    const expSec =
      typeof decoded === 'object' && decoded !== null && 'exp' in decoded
        ? (decoded as { exp: number }).exp
        : undefined;
    const maxAgeMs = expSec !== undefined ? expSec * 1000 - Date.now() : undefined;

    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: 'strict',
      path: '/',
      ...(maxAgeMs !== undefined && maxAgeMs > 0 ? { maxAge: maxAgeMs } : {}),
    });

    res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const user = await this.authService.getMe(r.user.sub);
    res.status(200).json({ success: true, data: user });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const dto = plainToInstance(UpdateProfileDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const user = await this.authService.updateProfile(
      r.user.sub,
      dto,
      r.user.jti,
      clientIp(req),
      clientUserAgent(req),
    );
    res.status(200).json({ success: true, data: user });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const env = getEnvConfig();
    const r = req as AuthenticatedRequest;
    await this.authService.logout(r.user.jti, r.user.sub, clientIp(req), clientUserAgent(req));

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json({ success: true, data: null });
  };
}
