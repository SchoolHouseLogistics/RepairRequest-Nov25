import { Request } from 'express';
import { PAGINATION } from '../constants';
import { PaginationMeta } from './errors';

export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Extract and validate pagination parameters from request query
 */
export function getPaginationParams(req: Request): PaginationParams {
  let limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;
  let offset = parseInt(req.query.offset as string) || PAGINATION.DEFAULT_OFFSET;

  // Enforce limits
  limit = Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);
  offset = Math.max(0, offset);

  return { limit, offset };
}

/**
 * Build pagination metadata for response
 */
export function buildPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Create a paginated response object
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
) {
  return {
    success: true,
    data,
    pagination: buildPaginationMeta(total, limit, offset),
  };
}

/**
 * SQL helper to apply pagination to a query
 * Returns an object with limit and offset for use with Drizzle
 */
export function applyPagination(params: PaginationParams) {
  return {
    limit: params.limit,
    offset: params.offset,
  };
}

/**
 * Parse sorting parameters from request
 */
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function getSortParams(
  req: Request,
  allowedFields: string[],
  defaultSort: string = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): SortParams {
  let sortBy = (req.query.sort as string) || defaultSort;
  let sortOrder = ((req.query.order as string) || defaultOrder).toLowerCase() as 'asc' | 'desc';

  // Validate sort field
  if (!allowedFields.includes(sortBy)) {
    sortBy = defaultSort;
  }

  // Validate sort order
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    sortOrder = defaultOrder;
  }

  return { sortBy, sortOrder };
}

/**
 * Parse filter parameters from request
 * Supports filter[field]=value format
 */
export function getFilterParams(req: Request, allowedFilters: string[]): Record<string, string> {
  const filters: Record<string, string> = {};

  for (const key of Object.keys(req.query)) {
    // Check for filter[field] format
    const filterMatch = key.match(/^filter\[(\w+)\]$/);
    if (filterMatch) {
      const field = filterMatch[1];
      if (allowedFilters.includes(field)) {
        filters[field] = req.query[key] as string;
      }
    }
    // Also support direct field names for backward compatibility
    else if (allowedFilters.includes(key)) {
      filters[key] = req.query[key] as string;
    }
  }

  return filters;
}
