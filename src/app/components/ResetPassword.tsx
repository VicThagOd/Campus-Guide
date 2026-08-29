import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckmarkCircle02Icon, Loading01Icon } from 'hugeicons-react';
import { supabase } from '../../lib/supabase';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    setSuccess(true);
    window.setTimeout(() => navigate('/dashboard'), 1800);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F4EA2]">Campus Guide</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use at least eight characters and avoid passwords you use elsewhere.</p>

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckmarkCircle02Icon size={20} className="mb-2" />
            Password updated. Taking you to your dashboard...
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-[#2F4EA2]" required />
            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-[#2F4EA2]" required />
            <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F4EA2] py-3 font-semibold text-white disabled:opacity-60">
              {saving && <Loading01Icon size={18} className="animate-spin" />}
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This reset link is invalid or has expired. Request a fresh link from the login page.</div>
        )}
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-[#2F4EA2] hover:underline">Back to login</Link>
      </section>
    </main>
  );
}
