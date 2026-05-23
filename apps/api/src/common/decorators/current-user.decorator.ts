import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '../../generated/prisma/enums';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
    (
        property: keyof AuthenticatedUser | undefined,
        context: ExecutionContext,
    ) => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        const user = request.user;

        return property && user ? user[property] : user;
    },
);
