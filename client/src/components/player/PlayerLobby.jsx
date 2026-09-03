import React from 'react';
import { Users, Clock } from 'lucide-react';

export const PlayerLobby = ({ player, totalPlayers, mode }) => {
  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop">
        <div style={{ margin: '20px auto', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: '8px', border: '3px solid var(--primary-purple)' }}>
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
          />
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          {player.name}
        </h2>

        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '24px' }}>
          คุณเข้าสู่ห้องสำเร็จแล้ว! 🎉
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '30px', marginBottom: '24px' }}>
          <Users size={18} color="var(--accent-yellow)" />
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>
            ผู้เข้าร่วมทั้งหมด: <strong style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem' }}>{totalPlayers}</strong> คน
          </span>
        </div>

        <div style={{ background: 'rgba(108, 92, 231, 0.2)', border: '1px dashed var(--primary-purple)', borderRadius: '16px', padding: '20px' }}>
          <Clock size={32} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {mode === 'PULSE' ? 'โหมด Training Pulse' : 'รอวิทยากรเริ่มเกม (Waiting for Host...)'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            เตรียมสมาร์ทโฟนให้พร้อม หน้าจอจะอัปเดตอัตโนมัติเมื่อ Host เริ่มกิจกรรม
          </p>
        </div>
      </div>
    </div>
  );
};
