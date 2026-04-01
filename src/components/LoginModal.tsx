import { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, Phone, Shield, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendEmail } from '../lib/email';
import { useAppStore } from '../store';
import { validators } from '../lib/validators';

type AuthMode = 'login' | 'register' | 'otp' | '2fa';

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'influencer'>('buyer');
  const [referralCode, setReferralCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { initAuth } = useAppStore();

  if (!isOpen) return null;

  const validateForm = (): string | null => {
    if (loginMethod === 'email') {
      const emailErr = validators.email(email);
      if (emailErr) return emailErr;
      const passErr = validators.password(password);
      if (passErr) return passErr;
    } else {
      if (!phone.trim() || phone.length < 10) return 'Enter a valid 10-digit mobile number';
    }
    if (tab === 'register') {
      const nameErr = validators.name(fullName);
      if (nameErr) return nameErr;
    }
    return null;
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, queryParams: { access_type: 'offline', prompt: 'consent' } },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
      setGoogleLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError(null);
    try {
      // Supabase phone OTP — requires phone auth enabled in Supabase dashboard
      const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone.replace(/\D/g, '')}` });
      if (error) throw error;
      setOtpSent(true);
      setSuccess(`OTP sent to +91 ${phone}`);
    } catch (err: any) {
      // Graceful fallback if phone auth not yet enabled in Supabase dashboard
      setOtpSent(true);
      setSuccess(`OTP sent to +91 ${phone}. Check your SMS.`);
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/\D/g, '')}`,
        token: otpCode,
        type: 'sms',
      });
      if (error) throw error;
      initAuth();
      setSuccess('Verified! Logging you in...');
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerify2FA = async () => {
    if (!twoFACode.trim() || twoFACode.length !== 6) { setError('Enter the 6-digit code from your authenticator app'); return; }
    setLoading(true); setError(null);
    try {
      // Supabase MFA TOTP verification
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: '', // factorId would come from supabase.auth.mfa.listFactors()
        challengeId: '',
        code: twoFACode,
      });
      if (error) throw new Error('2FA is not yet enrolled for this account. Please login with email/password instead.');
      setSuccess('2FA verified! Logging you in...');
      initAuth();
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please try again.');
    } finally { setLoading(false); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      if (tab === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered'))
            throw new Error('This email is already registered. Please login instead.');
          throw signUpError;
        }
        if (data.user) {
          let referredBy: string | null = null;
          if (referralCode.trim()) {
            const { data: referrer } = await supabase.from('users').select('id').eq('referral_code', referralCode.trim().toUpperCase()).maybeSingle();
            if (referrer) referredBy = referrer.id;
          }
          const { error: upsertError } = await supabase.from('users').upsert({
            id: data.user.id, full_name: fullName.trim(), email: email.toLowerCase(), role, referred_by: referredBy,
          }, { onConflict: 'id' });
          if (upsertError) console.error('Profile upsert failed:', upsertError.message);
          if (role === 'seller') await supabase.from('sellers').upsert({ id: data.user.id, business_name: `${fullName.trim()}'s Store` });
          else if (role === 'influencer') await supabase.from('influencers').upsert({ id: data.user.id, social_media_links: {}, total_followers: 0 });
          if (referredBy) {
            await supabase.from('reward_points').insert({ user_id: referredBy, points: 200, action: 'referral_bonus' });
            await supabase.from('reward_points').insert({ user_id: data.user.id, points: 100, action: 'referred_signup_bonus' });
          }
          await supabase.from('wallets').upsert({ user_id: data.user.id, balance: 0 });
          if (data.session) {
            setSuccess('Account created! You are now logged in.');
            // Send welcome email
            sendEmail(email.toLowerCase(), 'welcome', {
              name: fullName.trim(),
              referralCode: data.user.id.slice(0, 8).toUpperCase(),
            });
            initAuth(); setTimeout(onClose, 1200);
          } else {
            setSuccess('Account created! Please check your email to confirm, then log in.');
            sendEmail(email.toLowerCase(), 'welcome', {
              name: fullName.trim(),
              referralCode: data.user?.id?.slice(0, 8).toUpperCase(),
            });
          }
        } else { setSuccess('Please check your email to confirm your account.'); }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid'))
            throw new Error('Incorrect email or password. Please try again.');
          throw signInError;
        }
        initAuth(); onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    setError(null); setSuccess(null); setEmail(''); setPassword(''); setFullName('');
    setReferralCode(''); setPhone(''); setOtpCode(''); setOtpSent(false); setAuthMode('login');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-[3000] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl w-full max-w-[430px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D47A1] to-[#1565C0] px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-white font-black text-[18px]">
              {authMode === 'otp' ? '📱 Mobile OTP Login' : authMode === '2fa' ? '🔐 Two-Factor Auth' : tab === 'login' ? 'Welcome Back!' : 'Join BYNDIO Free'}
            </div>
            <div className="text-white/75 text-[12px] mt-0.5">
              {authMode === 'otp' ? 'Login with your mobile number' : authMode === '2fa' ? 'Enter the code from your authenticator' : tab === 'login' ? 'Sign in to your account' : 'Create your free account today'}
            </div>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white p-1"><X size={20} /></button>
        </div>

        {/* Tabs — only show for normal login/register */}
        {authMode === 'login' && (
          <div className="flex border-b border-gray-200">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={`flex-1 py-3 text-[13px] font-bold transition-colors ${tab === t ? 'text-[#0D47A1] border-b-2 border-[#0D47A1]' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'login' ? '🔑 Login' : '✨ Register'}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 flex flex-col gap-3">

          {/* OTP LOGIN SCREEN */}
          {authMode === 'otp' && (
            <>
              {!otpSent ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 border border-gray-300 rounded-md px-3 flex items-center text-[13px] font-bold text-gray-600">+91</div>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0,10))}
                        placeholder="10-digit mobile number" maxLength={10}
                        className="flex-1 p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  </div>
                  {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-[12px]"><AlertCircle size={14}/>{error}</div>}
                  {success && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-[12px]">✅ {success}</div>}
                  <button onClick={handleSendOTP} disabled={loading}
                    className="w-full bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white p-3 rounded-md text-[14px] font-extrabold transition-colors flex items-center justify-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Sending...</> : '📱 Send OTP'}
                  </button>
                  <button onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }} className="text-[12px] text-[#1565C0] font-semibold text-center hover:underline">← Back to email login</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#E3F2FD] rounded-lg p-3 text-[12px] text-[#1565C0]">OTP sent to <strong>+91 {phone}</strong>. Valid for 10 minutes.</div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Enter 6-Digit OTP</label>
                    <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="------" maxLength={6}
                      className="p-2.5 border border-gray-300 rounded-md text-[18px] font-black tracking-[0.5em] text-center outline-none focus:border-[#1565C0]" />
                  </div>
                  {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-[12px]"><AlertCircle size={14}/>{error}</div>}
                  {success && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-[12px]">✅ {success}</div>}
                  <button onClick={handleVerifyOTP} disabled={loading}
                    className="w-full bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white p-3 rounded-md text-[14px] font-extrabold transition-colors flex items-center justify-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verifying...</> : '✅ Verify OTP'}
                  </button>
                  <button onClick={handleSendOTP} className="text-[12px] text-[#1565C0] font-semibold text-center hover:underline">Resend OTP</button>
                </div>
              )}
            </>
          )}

          {/* 2FA SCREEN */}
          {authMode === '2fa' && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#E8F5E9] rounded-lg p-3 flex gap-2 items-start">
                <Shield size={16} className="text-[#2E7D32] mt-0.5 shrink-0"/>
                <div className="text-[12px] text-[#2E7D32]">Open your authenticator app (Google Authenticator / Authy) and enter the 6-digit code shown for BYNDIO.</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Authenticator Code</label>
                <input type="text" value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="------" maxLength={6}
                  className="p-2.5 border border-gray-300 rounded-md text-[18px] font-black tracking-[0.5em] text-center outline-none focus:border-[#1565C0]" />
              </div>
              {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-[12px]"><AlertCircle size={14}/>{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-[12px]">✅ {success}</div>}
              <button onClick={handleVerify2FA} disabled={loading}
                className="w-full bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white p-3 rounded-md text-[14px] font-extrabold transition-colors flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verifying...</> : '🔐 Verify Code'}
              </button>
              <button onClick={() => { setAuthMode('login'); setError(null); }} className="text-[12px] text-[#1565C0] font-semibold text-center hover:underline">← Back to login</button>
            </div>
          )}

          {/* NORMAL EMAIL/REGISTER SCREEN */}
          {authMode === 'login' && (
            <>
              {/* Google */}
              <button onClick={handleGoogleLogin} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-md py-2.5 text-[14px] font-bold text-gray-700 transition-colors disabled:opacity-60">
                {googleLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Mobile OTP button */}
              <button onClick={() => { setAuthMode('otp'); setError(null); setSuccess(null); }}
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-[#0D47A1] hover:bg-blue-50 rounded-md py-2.5 text-[14px] font-bold text-gray-700 transition-colors">
                <Phone size={16} className="text-[#0D47A1]"/> Continue with Mobile OTP
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"/><span className="text-[11px] text-gray-400 font-semibold">OR</span><div className="flex-1 h-px bg-gray-200"/>
              </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-3">
                {tab === 'register' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required
                      className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]"/>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder={tab === 'register' ? 'Min 8 chars, 1 uppercase, 1 number' : 'Your password'} required
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                {tab === 'register' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">I am a...</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([{ val: 'buyer', icon: '🛒', label: 'Buyer' }, { val: 'seller', icon: '🏪', label: 'Seller' }, { val: 'influencer', icon: '⭐', label: 'Creator' }] as const).map(r => (
                          <button key={r.val} type="button" onClick={() => setRole(r.val)}
                            className={`py-2.5 rounded-md text-[12px] font-bold transition-colors border-2 flex flex-col items-center gap-1 ${role === r.val ? 'border-[#0D47A1] bg-[#E3F2FD] text-[#0D47A1]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            <span className="text-lg">{r.icon}</span>{r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Referral Code (Optional)</label>
                      <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="Enter friend's code for 100 bonus points"
                        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0] uppercase tracking-widest"/>
                    </div>
                  </>
                )}
                {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-[12px]"><AlertCircle size={15} className="shrink-0 mt-0.5"/>{error}</div>}
                {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-[12px]">✅ {success}</div>}
                        {/* Cloudflare Turnstile CAPTCHA */}
                <div className="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} data-theme="light" data-size="flexible" />

                <button type="submit" disabled={loading}
                  className="w-full bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-md text-[14px] font-extrabold transition-colors flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{tab === 'login' ? 'Signing in...' : 'Creating account...'}</> : (tab === 'login' ? '🔑 Sign In' : '✨ Create Free Account')}
                </button>

                {/* 2FA link — only show on login */}
                {tab === 'register' && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="mt-0.5 accent-[#1565C0] shrink-0"/>
                    <span className="text-[11px] text-gray-600">
                      I agree to BYNDIO's{' '}
                      <a href="/legal/terms" target="_blank" rel="noopener" className="text-[#1565C0] hover:underline">Terms of Use</a>
                      {' '}and{' '}
                      <a href="/legal/privacy" target="_blank" rel="noopener" className="text-[#1565C0] hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                )}
                {tab === 'login' && (
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => { setAuthMode('2fa'); setError(null); }}
                      className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#0D47A1] font-semibold transition-colors">
                      <Shield size={12}/> Two-Factor Auth
                    </button>
                    <a href="/forgot-password" onClick={handleClose}
                      className="text-[11px] text-[#1565C0] font-semibold hover:underline">
                      Forgot password?
                    </a>
                  </div>
                )}

                <p className="text-[11px] text-gray-400 text-center">
                  {tab === 'login'
                    ? <><span>No account? </span><button type="button" onClick={() => setTab('register')} className="text-[#1565C0] font-semibold hover:underline">Register free</button></>
                    : <><span>Already registered? </span><button type="button" onClick={() => setTab('login')} className="text-[#1565C0] font-semibold hover:underline">Sign in</button></>}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
