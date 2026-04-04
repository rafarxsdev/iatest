import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { clientApiUrl } from '@lib/api';
import styles from './LoginForm.module.css';

type LoginErrorJson = {
  success: false;
  message: string;
  data?: { blockedUntil?: string };
};

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function parseErrorBody(text: string): LoginErrorJson | null {
  const j = parseJson(text);
  if (typeof j === 'object' && j !== null && 'success' in j && (j as { success: unknown }).success === false) {
    return j as LoginErrorJson;
  }
  return null;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [blockedCountdown, setBlockedCountdown] = useState('');

  const updateBlockedLabel = useCallback((until: Date) => {
    const ms = until.getTime() - Date.now();
    if (ms <= 0) {
      setBlockedCountdown('');
      setBlockedUntil(null);
      return;
    }
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0) {
      setBlockedCountdown(`${min} min ${sec} s`);
    } else {
      setBlockedCountdown(`${sec} s`);
    }
  }, []);

  useEffect(() => {
    if (!blockedUntil) {
      setBlockedCountdown('');
      return;
    }
    updateBlockedLabel(blockedUntil);
    const id = window.setInterval(() => updateBlockedLabel(blockedUntil), 1000);
    return () => window.clearInterval(id);
  }, [blockedUntil, updateBlockedLabel]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(clientApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      const json = text ? parseJson(text) : null;

      if (res.ok && json && typeof json === 'object' && 'success' in json && (json as { success: boolean }).success) {
        window.location.href = '/dashboard';
        return;
      }

      if (res.status === 401) {
        setBlockedUntil(null);
        setError('Email o contraseña incorrectos');
        return;
      }

      if (res.status === 403) {
        const parsed = parseErrorBody(text);
        const untilIso =
          parsed?.data && typeof parsed.data === 'object' && 'blockedUntil' in parsed.data
            ? (parsed.data as { blockedUntil?: string }).blockedUntil
            : undefined;
        if (untilIso) {
          setBlockedUntil(new Date(untilIso));
          setError(null);
          return;
        }
        setError(parsed?.message ?? 'No puedes iniciar sesión en este momento.');
        return;
      }

      if (res.status === 500) {
        setError('Error del servidor. Intenta más tarde.');
        return;
      }

      const parsed = parseErrorBody(text);
      setError(parsed?.message ?? 'No se pudo iniciar sesión.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Correo
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button
            className={styles.submit}
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
      {blockedUntil ? (
        <p className={styles.blocked} role="status">
          Cuenta bloqueada. Intenta de nuevo en {blockedCountdown || '…'}.
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
