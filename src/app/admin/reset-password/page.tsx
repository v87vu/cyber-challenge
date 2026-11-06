'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function AdminResetPasswordPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('إعدادات Supabase العامة غير موجودة.');
      setChecking(false);
      return;
    }

    let alive = true;
    async function prepareSession() {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) await supabase!.auth.exchangeCodeForSession(code);
      const { data } = await supabase!.auth.getSession();
      if (!alive) return;
      setReady(Boolean(data.session));
      setChecking(false);
    }
    void prepareSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || loading) return;
    setError('');

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('تعذر تحديث كلمة المرور. قد يكون رابط الاسترجاع منتهيًا.');
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
  }

  return (
    <main dir="rtl" className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <div className="pxl w-full bg-white p-6">
        <h1 className="text-2xl font-black">تعيين كلمة مرور جديدة</h1>

        {checking && <p className="mt-4 font-bold text-[var(--fg-muted)]">جاري التحقق من رابط الاسترجاع…</p>}

        {!checking && success && <>
          <p className="mt-4 font-bold text-green-700">تم تحديث كلمة المرور بنجاح.</p>
          <Link href="/admin" className="mt-5 block w-full rounded-2xl bg-[var(--green)] px-5 py-3 text-center font-black text-white">
            تسجيل الدخول
          </Link>
        </>}

        {!checking && !success && !ready && <>
          <p className="mt-4 font-bold text-red-700">رابط الاسترجاع غير صالح أو انتهت صلاحيته.</p>
          <Link href="/admin" className="mt-5 block text-center font-black text-blue-700 underline">
            طلب رابط جديد
          </Link>
        </>}

        {!checking && !success && ready && <form onSubmit={updatePassword} className="mt-5">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة المرور الجديدة"
              autoComplete="new-password"
              dir="ltr"
              className="w-full rounded-2xl border-2 border-[var(--line)] py-3 pl-20 pr-4 text-left outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--fg-muted)]"
            >
              {showPassword ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="تأكيد كلمة المرور الجديدة"
            autoComplete="new-password"
            dir="ltr"
            className="mt-3 w-full rounded-2xl border-2 border-[var(--line)] px-4 py-3 text-left outline-none"
          />
          {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
          <button
            disabled={loading || !password || !confirmPassword}
            className="mt-4 w-full rounded-2xl bg-[var(--green)] px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ…' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>}
      </div>
    </main>
  );
}
