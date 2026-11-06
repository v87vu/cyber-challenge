'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import DashboardShell from '@/components/admin/DashboardShell';
import { demoStats } from '@/components/admin/data';
import type { AdminLanguage, StatsData } from '@/components/admin/types';

export default function AdminPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>('ar');
  const [explicitlySignedIn, setExplicitlySignedIn] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const ar = adminLanguage === 'ar';

  const fetchStats = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed');
      setData(result);
    } catch {
      setData(null);
      setError(ar ? 'تعذر تحميل الإحصائيات. تأكد أن هذا الحساب هو حساب الأدمن.' : 'Unable to load analytics. Make sure this is the admin account.');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).get('demo') === '1') {
      const timer = window.setTimeout(() => {
        setDemoMode(true);
        setData(demoStats());
        setExplicitlySignedIn(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && !session && !demoMode) {
        setData(null);
        setExplicitlySignedIn(false);
      }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [ar, demoMode, supabase]);

  useEffect(() => {
    if (!supabase || !explicitlySignedIn || !data || demoMode) return;
    const timer = window.setInterval(() => {
      void (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        try {
          const response = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
          if (!response.ok) return;
          setData(await response.json());
        } catch {
          // Keep the current dashboard visible if a background refresh fails.
        }
      })();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [data, demoMode, explicitlySignedIn, supabase]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim() || !password || loading) return;
    setLoading(true); setError(''); setNotice('');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !authData.session) {
      setLoading(false);
      setError(ar ? 'الإيميل أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.');
      return;
    }
    setExplicitlySignedIn(true);
    await fetchStats(authData.session.access_token);
  }

  async function sendResetLink(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim() || loading) return;
    setLoading(true); setError(''); setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/reset-password` });
    setLoading(false);
    if (resetError) {
      setError(ar ? 'تعذر إرسال رابط الاسترجاع. تأكد من الإيميل وإعدادات Supabase.' : 'Unable to send the reset link. Check the email and Supabase settings.');
      return;
    }
    setNotice(ar ? 'إذا كان الإيميل مسجلاً، سيصلك رابط لتعيين كلمة مرور جديدة.' : 'If the email is registered, a password reset link will be sent.');
  }

  async function refreshStats() {
    if (demoMode) { setData(demoStats()); return; }
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setData(null);
      setError(ar ? 'انتهت جلسة الدخول. سجل الدخول مرة أخرى.' : 'Your session has expired. Please sign in again.');
      return;
    }
    await fetchStats(token);
  }

  async function signOut() {
    if (!demoMode) await supabase?.auth.signOut();
    setData(null); setExplicitlySignedIn(false); setDemoMode(false); setPassword(''); setError('');
    setNotice(ar ? 'تم تسجيل الخروج.' : 'Signed out successfully.');
  }

  if (data && explicitlySignedIn) {
    return <DashboardShell data={data} language={adminLanguage} onLanguage={setAdminLanguage} onRefresh={() => void refreshStats()} onSignOut={() => void signOut()} loading={loading}/>;
  }

  const ui = {
    loginTitle: ar ? 'لوحة إحصائيات الأدمن' : 'Admin Analytics',
    loginHelp: ar ? 'سجل الدخول بحساب الأدمن لعرض إحصائيات جميع اللاعبين.' : 'Sign in with the admin account to view all player analytics.',
    forgotHelp: ar ? 'أدخل إيميل الأدمن وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.' : 'Enter the admin email and we will send you a password reset link.',
    adminEmail: ar ? 'إيميل الأدمن' : 'Admin email',
    password: ar ? 'كلمة المرور' : 'Password',
    hide: ar ? 'إخفاء' : 'Hide', show: ar ? 'إظهار' : 'Show',
    forgot: ar ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    working: ar ? 'جاري التنفيذ…' : 'Working…',
    sendReset: ar ? 'إرسال رابط الاسترجاع' : 'Send reset link',
    login: ar ? 'دخول' : 'Sign in',
    backLogin: ar ? 'الرجوع لتسجيل الدخول' : 'Back to sign in',
    backGame: ar ? 'الرجوع للعبة' : 'Back to game',
  };
  return <main dir={ar ? 'rtl' : 'ltr'} className="mx-auto flex min-h-dvh max-w-md items-center bg-[#f4f8f7] px-4 font-[family-name:var(--font-ar)]">
    <form onSubmit={forgotMode ? sendResetLink : signIn} className="w-full rounded-2xl border border-[#dfe9e7] bg-white p-6 shadow-[0_2px_10px_rgba(15,118,110,0.04)]">
      <div className="mb-5 flex justify-end"><select value={adminLanguage} onChange={(event) => setAdminLanguage(event.target.value as AdminLanguage)} className="min-h-10 rounded-xl border border-[#d8e4e2] bg-white px-3 text-sm font-bold"><option value="ar">العربية</option><option value="en">English</option></select></div>
      <h1 className="text-2xl font-black text-[#183b3a]">{ui.loginTitle}</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#657c7a]">{forgotMode ? ui.forgotHelp : ui.loginHelp}</p>
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={ui.adminEmail} autoComplete="email" dir="ltr" className="mt-5 min-h-12 w-full rounded-xl border border-[#d8e4e2] px-4 text-left outline-none focus:border-[#0f766e]"/>
      {!forgotMode && <div className="relative mt-3"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={ui.password} autoComplete="current-password" dir="ltr" className="min-h-12 w-full rounded-xl border border-[#d8e4e2] py-3 pl-20 pr-4 text-left outline-none focus:border-[#0f766e]"/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 min-h-9 -translate-y-1/2 text-xs font-black text-[#657c7a]">{showPassword ? ui.hide : ui.show}</button></div>}
      {!forgotMode && <button type="button" onClick={() => { setForgotMode(true); setError(''); setNotice(''); }} className="mt-3 min-h-10 text-sm font-black text-[#0f766e] underline">{ui.forgot}</button>}
      {(error || (!supabase && !demoMode)) && <p role="alert" className="mt-3 text-sm font-bold text-[#a52822]">{error || (ar ? 'إعدادات Supabase العامة غير موجودة في ملف .env.local.' : 'Supabase public settings are missing from .env.local.')}</p>}
      {notice && <p className="mt-3 text-sm font-bold text-[#0f766e]">{notice}</p>}
      <button disabled={!email.trim() || (!forgotMode && !password) || loading || !supabase} className="mt-4 min-h-12 w-full rounded-xl bg-[#0f766e] px-5 py-3 font-black text-white disabled:opacity-50">{loading ? ui.working : forgotMode ? ui.sendReset : ui.login}</button>
      {forgotMode && <button type="button" onClick={() => { setForgotMode(false); setError(''); setNotice(''); }} className="mt-3 min-h-11 w-full rounded-xl border border-[#d8e4e2] px-5 py-3 font-black">{ui.backLogin}</button>}
      <Link href="/" className="mt-4 block min-h-10 text-center text-sm font-bold text-[#657c7a]">{ui.backGame}</Link>
    </form>
  </main>;
}
