import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/** Injects the authenticated user (set by JwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const IS_PUBLIC_KEY = 'isPublic';
/** Marks a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restricts a route to the given roles (e.g. @Roles('admin')). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
