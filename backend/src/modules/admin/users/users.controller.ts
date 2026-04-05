import type { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppError } from '@common/errors/app-error';
import type { AuthenticatedRequest } from '@common/types/request.type';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (ipFromForwarded ?? req.ip ?? req.socket.remoteAddress) ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : null;
}

function parseRoleId(req: Request): string | undefined {
  const raw = req.query.roleId;
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

function parseIsActive(req: Request): boolean | undefined {
  const raw = req.query.isActive;
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return undefined;
}

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const pageRaw = req.query.page;
    const pageParsed =
      pageRaw === undefined ? 1 : Number.parseInt(typeof pageRaw === 'string' ? pageRaw : String(pageRaw), 10);
    if (Number.isNaN(pageParsed) || pageParsed < 1) {
      throw new AppError('page debe ser un entero >= 1', 400);
    }
    const limitRaw = req.query.limit;
    const limitParsed =
      limitRaw === undefined ? 20 : Number.parseInt(typeof limitRaw === 'string' ? limitRaw : String(limitRaw), 10);
    if (Number.isNaN(limitParsed) || limitParsed < 1 || limitParsed > 100) {
      throw new AppError('limit debe ser un entero entre 1 y 100', 400);
    }
    const searchRaw = req.query.search;
    const search = typeof searchRaw === 'string' && searchRaw.length > 0 ? searchRaw : undefined;
    const roleId = parseRoleId(req);
    const isActive = parseIsActive(req);

    const result = await this.usersService.list(
      r,
      pageParsed,
      limitParsed,
      search,
      roleId,
      isActive,
      clientIp(req),
      clientUserAgent(req),
    );
    res.status(200).json({ success: true, data: result.data, meta: result.meta });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    const data = await this.usersService.getById(r, id);
    res.status(200).json({ success: true, data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const dto = plainToInstance(CreateUserDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.usersService.create(r, dto, clientIp(req), clientUserAgent(req));
    res.status(201).json({ success: true, data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    const dto = plainToInstance(UpdateUserDto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const msg = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
      throw new AppError(msg || 'Datos inválidos', 400);
    }
    const data = await this.usersService.update(r, id, dto, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    await this.usersService.remove(r, id, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data: null });
  };

  restore = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    const data = await this.usersService.restore(r, id, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };

  unlock = async (req: Request, res: Response): Promise<void> => {
    const r = req as AuthenticatedRequest;
    const id = req.params.id;
    if (!id) {
      throw new AppError('id requerido', 400);
    }
    const data = await this.usersService.unlock(r, id, clientIp(req), clientUserAgent(req));
    res.status(200).json({ success: true, data });
  };
}
