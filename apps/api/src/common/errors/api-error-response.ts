export interface ApiErrorResponse {
    statusCode: number;
    error: string;
    message: string;
    code: string;
    details: unknown;
}
