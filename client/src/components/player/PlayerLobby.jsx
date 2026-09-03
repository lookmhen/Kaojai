import React from 'react';
import { Users, Clock } from 'lucide-react';

export const PlayerLobby = ({ player, totalPlayers, mode }) => {
  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="glass-card animate-pop">
        <div style={{ margin: '20px auto', width: '100px', height: '100px', borderRadius: '50%', background: '#F8FAFC', padding: '6px', border: '3px solid var(--accent-earth-blue)' }}>
          <img
            src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
            alt={player.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
          />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
          {player.name}
        </h2>

        <p style={{ color: 'var(--accent-earth-green)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '24px' }}>
          คุณเข้าสู่ห้องสำเร็จแล้ว! 🎉
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 20px', borderRadius: '30px', marginBottom: '24px' }}>
          <Users size={18} color="var(--accent-earth-orange)" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            ผู้เข้าร่วมทั้งหมด: <strong style={{ color: 'var(--accent-earth-orange)', fontSize: '1.15rem' }}>{totalPlayers}</strong> คน
          </span>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '20px' }}>
          <Clock size={28} color="var(--accent-earth-blue)" style={{ marginBottom: '8px' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {mode === 'PULSE' ? 'โหมด Training Pulse' : 'รอวิทยากรเริ่มเกม (Waiting for Host...)'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            หน้าจอจะอัปเดตอัตโนมัติเมื่อ Host เริ่มกิจกรรม
          </p>
        </div>
      </div>
    </div>
  );
};
