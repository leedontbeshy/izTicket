import { useState, type FormEvent, type ReactNode } from 'react';
import './AuthPage.css';

type AuthMode = 'login' | 'register';
type UserRole = 'CUSTOMER' | 'ORGANIZER';

type PublicUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'ADMIN';
};

type LoginResponse = {
    accessToken: string;
    user: PublicUser;
};

type RegisterResponse = PublicUser;

type ValidationDetail = {
    field: string;
    messages: string[];
};

type AuthFormState = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    acceptedTerms: boolean;
};

const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3000/api/v1';

const initialFormState: AuthFormState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    acceptedTerms: false,
};

function MaterialIcon({
    children,
    className = '',
}: {
    children: string;
    className?: string;
}) {
    return (
        <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
            {children}
        </span>
    );
}

function AuthLogo() {
    return (
        <a className="auth-logo" href="/">
            <span aria-hidden="true">
                <MaterialIcon>confirmation_number</MaterialIcon>
            </span>
            izTicket
        </a>
    );
}

function AuthPage({ mode }: { mode: AuthMode }) {
    const [form, setForm] = useState<AuthFormState>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const isLogin = mode === 'login';

    function updateField<K extends keyof AuthFormState>(
        field: K,
        value: AuthFormState[K],
    ) {
        setForm((current) => ({ ...current, [field]: value }));
        setError('');
        setMessage('');
    }

    async function submitAuthForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setMessage('');

        const validationError = validateForm(form, mode);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                const response = await postJson<LoginResponse>('/auth/login', {
                    email: form.email.trim(),
                    password: form.password,
                });

                sessionStorage.setItem(
                    'izticket_access_token',
                    response.accessToken,
                );
                sessionStorage.setItem(
                    'izticket_user',
                    JSON.stringify(response.user),
                );
                setMessage('Đăng nhập thành công. Đang chuyển về trang chủ...');
                window.setTimeout(() => window.location.assign('/'), 600);
                return;
            }

            const response = await postJson<RegisterResponse>('/auth/register', {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role: form.role,
            });

            setMessage(
                `Tài khoản ${response.email} đã được tạo. Bạn có thể đăng nhập ngay.`,
            );
        } catch (authError) {
            setError(
                authError instanceof Error
                    ? authError.message
                    : 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={`auth-page ${isLogin ? 'login-page' : 'register-page'}`}>
            <div className="auth-background" aria-hidden="true">
                <div className="dot-grid" />
                <div className="flight-card">
                    <MaterialIcon>flight</MaterialIcon>
                </div>
                <div className="suitcase">
                    <span />
                    <span />
                    <span />
                </div>
            </div>

            <section className="auth-card" aria-labelledby="auth-title">
                <AuthLogo />
                <header className="auth-heading">
                    <h1 id="auth-title">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h1>
                    <p>
                        {isLogin
                            ? 'Chào mừng bạn quay trở lại! Vui lòng đăng nhập để tiếp tục sử dụng izTicket.'
                            : 'Tạo tài khoản izTicket để đặt vé dễ dàng và tận hưởng nhiều ưu đãi hấp dẫn.'}
                    </p>
                </header>

                <form className="auth-form" onSubmit={submitAuthForm}>
                    {!isLogin ? (
                        <AuthInput
                            icon="person"
                            label="Họ và tên"
                            name="name"
                            onChange={(value) => updateField('name', value)}
                            placeholder="Nhập họ và tên"
                            value={form.name}
                        />
                    ) : null}

                    <AuthInput
                        icon={isLogin ? 'person' : 'mail'}
                        label="Email"
                        name="email"
                        onChange={(value) => updateField('email', value)}
                        placeholder="Nhập email"
                        type="email"
                        value={form.email}
                    />

                    {!isLogin ? (
                        <div className="role-field">
                            <span>Loại tài khoản</span>
                            <div className="role-options">
                                <button
                                    className={
                                        form.role === 'CUSTOMER' ? 'active' : ''
                                    }
                                    type="button"
                                    onClick={() => updateField('role', 'CUSTOMER')}
                                >
                                    Khách hàng
                                </button>
                                <button
                                    className={
                                        form.role === 'ORGANIZER' ? 'active' : ''
                                    }
                                    type="button"
                                    onClick={() =>
                                        updateField('role', 'ORGANIZER')
                                    }
                                >
                                    Tổ chức sự kiện
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <AuthInput
                        action={
                            <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={
                                    showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                                }
                            >
                                <MaterialIcon>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </MaterialIcon>
                            </button>
                        }
                        icon="lock"
                        label="Mật khẩu"
                        name="password"
                        onChange={(value) => updateField('password', value)}
                        placeholder="Nhập mật khẩu"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                    />

                    {isLogin ? (
                        <a className="forgot-link" href="#forgot-password">
                            Quên mật khẩu?
                        </a>
                    ) : (
                        <>
                            <AuthInput
                                action={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword((value) => !value)
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? 'Ẩn xác nhận mật khẩu'
                                                : 'Hiện xác nhận mật khẩu'
                                        }
                                    >
                                        <MaterialIcon>
                                            {showConfirmPassword
                                                ? 'visibility_off'
                                                : 'visibility'}
                                        </MaterialIcon>
                                    </button>
                                }
                                icon="lock"
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                onChange={(value) =>
                                    updateField('confirmPassword', value)
                                }
                                placeholder="Nhập lại mật khẩu"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.confirmPassword}
                            />

                            <label className="terms-row">
                                <input
                                    checked={form.acceptedTerms}
                                    onChange={(event) =>
                                        updateField(
                                            'acceptedTerms',
                                            event.currentTarget.checked,
                                        )
                                    }
                                    type="checkbox"
                                />
                                <span>
                                    Tôi đồng ý với <a href="#terms">Điều khoản sử dụng</a>{' '}
                                    và <a href="#privacy">Chính sách bảo mật</a> của
                                    izTicket.
                                </span>
                            </label>
                        </>
                    )}

                    {error ? <p className="auth-alert error">{error}</p> : null}
                    {message ? (
                        <p className="auth-alert success">{message}</p>
                    ) : null}

                    <button
                        className="auth-submit"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting
                            ? 'Đang xử lý...'
                            : isLogin
                              ? 'Đăng nhập'
                              : 'Đăng ký'}
                    </button>
                </form>

                {isLogin ? (
                    <div className="social-login">
                        <div className="divider">
                            <span />
                            Hoặc đăng nhập với
                            <span />
                        </div>
                        <div className="social-buttons">
                            <button type="button">
                                <strong>G</strong>
                                Google
                            </button>
                            <button type="button">
                                <strong>f</strong>
                                Facebook
                            </button>
                        </div>
                    </div>
                ) : null}

                <p className="auth-switch">
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                    <a href={isLogin ? '/auth/register' : '/auth/login'}>
                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                    </a>
                </p>
            </section>
        </main>
    );
}

function AuthInput({
    action,
    icon,
    label,
    name,
    onChange,
    placeholder,
    type = 'text',
    value,
}: {
    action?: ReactNode;
    icon: string;
    label: string;
    name: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    value: string;
}) {
    return (
        <label className="auth-field">
            <span>{label}</span>
            <div className="auth-input-shell">
                <MaterialIcon>{icon}</MaterialIcon>
                <input
                    autoComplete={getAutocomplete(name)}
                    name={name}
                    onChange={(event) => onChange(event.currentTarget.value)}
                    placeholder={placeholder}
                    type={type}
                    value={value}
                />
                {action}
            </div>
        </label>
    );
}

function validateForm(form: AuthFormState, mode: AuthMode) {
    if (mode === 'register' && form.name.trim().length === 0) {
        return 'Vui lòng nhập họ và tên.';
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        return 'Vui lòng nhập email hợp lệ.';
    }

    if (mode === 'login') {
        return form.password.length > 0 ? '' : 'Vui lòng nhập mật khẩu.';
    }

    if (
        form.password.length < 8 ||
        !/[a-z]/.test(form.password) ||
        !/[A-Z]/.test(form.password) ||
        !/[0-9]/.test(form.password)
    ) {
        return 'Mật khẩu cần tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.';
    }

    if (form.password !== form.confirmPassword) {
        return 'Mật khẩu xác nhận chưa khớp.';
    }

    if (!form.acceptedTerms) {
        return 'Vui lòng đồng ý điều khoản trước khi đăng ký.';
    }

    return '';
}

async function postJson<TResponse>(
    path: string,
    body: Record<string, unknown>,
): Promise<TResponse> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }

    return (await response.json()) as TResponse;
}

async function readApiError(response: Response) {
    try {
        const payload: unknown = await response.json();
        const message = extractApiMessage(payload);

        if (message) {
            return message;
        }
    } catch {
        return `Yêu cầu thất bại với mã ${response.status}.`;
    }

    return `Yêu cầu thất bại với mã ${response.status}.`;
}

function extractApiMessage(payload: unknown) {
    if (!isRecord(payload)) {
        return '';
    }

    const details = payload.details;
    if (Array.isArray(details)) {
        const validationMessage = details
            .filter(isValidationDetail)
            .flatMap((detail) => detail.messages)
            .at(0);

        if (validationMessage) {
            return validationMessage;
        }
    }

    const message = payload.message;
    if (typeof message === 'string') {
        return message;
    }

    if (Array.isArray(message)) {
        return message.filter((item) => typeof item === 'string').join(' ');
    }

    return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isValidationDetail(value: unknown): value is ValidationDetail {
    return (
        isRecord(value) &&
        typeof value.field === 'string' &&
        Array.isArray(value.messages) &&
        value.messages.every((message) => typeof message === 'string')
    );
}

function getAutocomplete(name: string) {
    if (name === 'email') return 'email';
    if (name === 'password') return 'current-password';
    if (name === 'confirmPassword') return 'new-password';
    if (name === 'name') return 'name';
    return 'off';
}

export default AuthPage;
