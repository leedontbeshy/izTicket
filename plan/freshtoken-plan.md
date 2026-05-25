# Triển Khai Refresh Token Cho Auth API

## Summary

- Thêm refresh token dạng opaque random token, lưu trong HttpOnly cookie `izticket_refresh_token`; access token vẫn trả trong JSON.
- Hỗ trợ multi-session: mỗi lần login tạo một session riêng; logout chỉ revoke session hiện tại.
- Access token đổi default từ `1h` sang `15m`; refresh token default `7d`.
- Không thêm production dependency mới; dùng Node `crypto` để generate/hash token và tự parse cookie từ header.

## Key Changes

- Prisma thêm model `AuthSession` map bảng `auth_sessions`: `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `createdAt`, `updatedAt`; liên kết `User.authSessions`.
- Auth API:
    - `POST /api/v1/auth/login`: giữ body response hiện tại `{ accessToken, user }`, đồng thời set HttpOnly refresh cookie.
    - `POST /api/v1/auth/refresh`: đọc refresh cookie, verify session còn hạn/chưa revoked/user active, rotate token, set cookie mới, trả `{ accessToken, user }`.
    - `POST /api/v1/auth/logout`: revoke session hiện tại nếu có, clear cookie, trả `204 No Content`; idempotent.
- Auth internals:
    - Thêm service/helper quản lý refresh token: generate raw token, hash bằng SHA-256, tạo session, rotate session, revoke session.
    - Cookie options: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/api/v1/auth'`, `maxAge` theo refresh TTL.
    - `AuthTokenPayload` giữ nguyên cho access token; không đưa refresh token vào response body.
- Env/config:
    - `.env.example`: `JWT_ACCESS_TOKEN_EXPIRES_IN="15m"`, thêm `JWT_REFRESH_TOKEN_EXPIRES_IN="7d"`.
    - `env.validate.ts`: validate/default refresh TTL.
    - `auth.module.ts`: access token expiry dùng default mới.

## Test Plan

- Unit tests `AuthService`:
    - login đúng credentials tạo session, set refresh cookie data, trả access token + user.
    - refresh hợp lệ rotate token và trả access token mới.
    - refresh thiếu cookie, token sai, expired, revoked, hoặc user disabled đều trả unauthorized.
    - logout revoke session và clear cookie, kể cả khi cookie thiếu vẫn không lỗi.
- E2E tests:
    - login nhận `Set-Cookie` HttpOnly refresh token.
    - refresh bằng cookie trả access token mới và cookie mới.
    - refresh bằng cookie cũ sau rotation bị `401`.
    - logout xong refresh lại bị `401`.
- Checks cần chạy: `pnpm --dir apps/api exec prisma validate`, `pnpm --dir apps/api exec prisma format`, `pnpm --dir apps/api exec prisma generate`, `pnpm check-types`, `pnpm --filter api test`, `pnpm --filter api test:e2e -- --testTimeout=30000`.

## Assumptions

- Refresh token phục vụ web frontend trước, nên HttpOnly cookie là mặc định.
- Register chưa auto-login để tránh đổi behavior hiện tại; user vẫn login sau register.
- Không làm endpoint logout-all trong lượt này.
- Không thêm cookie-parser; parse cookie tối thiểu cho đúng cookie refresh token.
