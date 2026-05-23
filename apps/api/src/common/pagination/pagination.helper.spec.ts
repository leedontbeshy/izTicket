import { createPage, getPaginationParams } from './pagination.helper';
import type { PaginationQueryDto } from './pagination-query.dto';

describe('pagination helper', () => {
    it('creates Prisma-friendly pagination params', () => {
        const query: PaginationQueryDto = {
            page: 3,
            limit: 25,
        };

        expect(getPaginationParams(query)).toEqual({
            page: 3,
            limit: 25,
            skip: 50,
            take: 25,
        });
    });

    it('creates response metadata', () => {
        const page = createPage(['event-a', 'event-b'], 42, {
            page: 2,
            limit: 20,
        });

        expect(page).toEqual({
            data: ['event-a', 'event-b'],
            meta: {
                page: 2,
                limit: 20,
                totalItems: 42,
                totalPages: 3,
                hasNextPage: true,
                hasPreviousPage: true,
            },
        });
    });
});
