import type { ValidationError } from 'class-validator';

export interface ValidationErrorDetail {
    field: string;
    messages: string[];
}

export function toValidationErrorDetails(
    errors: ValidationError[],
): ValidationErrorDetail[] {
    return errors.flatMap((error) => flattenValidationError(error));
}

function flattenValidationError(
    error: ValidationError,
    parentPath = '',
): ValidationErrorDetail[] {
    const field = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

    const details: ValidationErrorDetail[] = [];
    const messages = Object.values(error.constraints ?? {});

    if (messages.length > 0) {
        details.push({
            field,
            messages,
        });
    }

    for (const child of error.children ?? []) {
        details.push(...flattenValidationError(child, field));
    }

    return details;
}
