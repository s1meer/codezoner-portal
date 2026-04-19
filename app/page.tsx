'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogin } from '@/lib/api';
import { saveSession, getSession } from '@/lib/auth';

export default function Login() {
  const [portalId, setPortalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getSession()) router.push('/dashboard');
  }, []);

  const login = async () => {
    if (!portalId || !password) { setError('Enter your login ID and password'); return; }
    setLoading(true); setError('');
    const d = await apiLogin(portalId.trim(), password.trim());
    if (d.success) {
      saveSession(d.token, d.partner);
      router.push('/dashboard');
    } else {
      setError(d.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8FAFC', fontFamily: 'system-ui,sans-serif'
    }}>
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
        padding: 40, width: '100%', maxWidth: 420
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: '#1E3A8A', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 auto 14px'
          }}>CZ</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            Partner Portal
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Campus Ambassador · Business Executive
          </p>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          Portal Login ID
        </label>
        <input
          value={portalId}
          onChange={e => setPortalId(e.target.value)}
          placeholder="cz.yourname.1234"
          autoComplete="username"
          style={{
            width: '100%', padding: '11px 14px', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 14, outline: 'none'
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Your portal password"
          autoComplete="current-password"
          style={{
            width: '100%', padding: '11px 14px', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 16, outline: 'none'
          }}
        />

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#991B1B', fontSize: 12,
            padding: '9px 12px', borderRadius: 7, marginBottom: 14
          }}>{error}</div>
        )}

        <button
          onClick={login}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#93C5FD' : '#1D4ED8',
            color: '#fff', border: 'none', borderRadius: 8, padding: 12,
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>
          Login credentials provided by CodeZoner admin
        </p>
      </div>
    </div>
  );
}
