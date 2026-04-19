'use client';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/auth';

interface NavbarProps {
  partnerName: string;
  role: string;
  portalId: string;
  activePage?: 'dashboard' | 'profile' | 'mou';
}

export default function Navbar({ partnerName, role, portalId, activePage }: NavbarProps) {
  const router = useRouter();
  const isExec = role?.toLowerCase() === 'executive';

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #0F2D5A 0%, #1a3a6e 100%)',
      padding: '0 28px', height: 64,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 2px 20px rgba(15,45,90,0.4)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 40, height: 40, background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, color: '#fff', fontSize: 15, letterSpacing: '-0.5px',
          boxShadow: '0 4px 12px rgba(29,78,216,0.4)', flexShrink: 0,
        }}>CZ</div>

        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { label: 'Dashboard', href: '/dashboard', page: 'dashboard' },
            { label: 'Profile', href: '/profile', page: 'profile' },
            ...(isExec ? [{ label: '🏛️ MOUs', href: '/mou', page: 'mou' }] : []),
          ] as const).map(item => (
            <a key={item.page} href={item.href} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
              background: activePage === item.page ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: activePage === item.page ? '#fff' : 'rgba(255,255,255,0.6)',
            }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {partnerName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
            <span style={{
              fontSize: 10, padding: '1px 8px', borderRadius: 99, fontWeight: 700,
              background: isExec ? '#7C3AED' : '#1D4ED8',
              color: '#fff',
            }}>
              {isExec ? '🏛️ Executive' : '⭐ Ambassador'}
            </span>
            <span style={{
              fontSize: 10, padding: '1px 8px', borderRadius: 99, fontWeight: 600,
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
            }}>
              {portalId}
            </span>
          </div>
        </div>

        <button onClick={() => { clearSession(); router.push('/'); }} style={{
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
          padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
