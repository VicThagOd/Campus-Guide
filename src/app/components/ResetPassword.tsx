import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase"

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const passwordChecks = {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  // Supabase sends the token in the URL hash — this picks it up
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!passwordValid) {
      setError('Please meet all password requirements.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setInfo('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }

    setIsLoading(false);
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <p style={{ color: '#000000', opacity: 0.6 }}>Verifying reset link...</p>
          <p className="mt-2 text-sm" style={{ color: '#000000', opacity: 0.4 }}>
            If nothing happens,{' '}
            <button
              onClick={() => navigate('/login')}
              className="underline"
              style={{ color: '#2F4EA2' }}
            >
              go back to login
            </button>{' '}
            and request a new reset link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2F4EA2', marginBottom: '0.5rem' }}>
            Campus Guide - Post UTME
          </h1>
          <p style={{ color: '#000000', opacity: 0.6 }}>Set a new password</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700 text-sm">{error}</div>
          )}
          {info && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-700 text-sm">{info}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-black">New Password</label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="mb-2 block text-black">Confirm Password</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
              />
              {confirm && password !== confirm && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="mb-2 font-medium text-slate-800">Password requirements</p>
              <ul className="space-y-1">
                <li className={passwordChecks.minLength ? 'text-green-700' : 'text-red-600'}>• At least 8 characters</li>
                <li className={passwordChecks.lowercase ? 'text-green-700' : 'text-red-600'}>• At least one lowercase letter</li>
                <li className={passwordChecks.uppercase ? 'text-green-700' : 'text-red-600'}>• At least one uppercase letter</li>
                <li className={passwordChecks.number ? 'text-green-700' : 'text-red-600'}>• At least one number</li>
                <li className={passwordChecks.special ? 'text-green-700' : 'text-red-600'}>• At least one special character</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordValid || password !== confirm}
              className="w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#2F4EA2' }}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
