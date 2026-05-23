import type { PaginationQueryDto } from './pagination-query.dto';

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface PageMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PageResult<T> {
    data: T[];
    meta: PageMeta;
}

export function getPaginationParams(
    query: PaginationQueryDto,
): PaginationParams {
    const page = query.page;
    const limit = query.limit;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
}

export function createPage<T>(
    data: T[],
    totalItems: number,
    params: Pick<PaginationParams, 'page' | 'limit'>,
): PageResult<T> {
    const totalPages = Math.ceil(totalItems / params.limit);

    return {
        data,
        meta: {
            page: params.page,
            limit: params.limit,
            totalItems,
            totalPages,
            hasNextPage: params.page < totalPages,
            hasPreviousPage: params.page > 1,
        },
    };
}
