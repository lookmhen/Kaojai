import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Download, Upload, X, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const DatabaseBackupModal = ({ isOpen, onClose }) => {
  const { authFetch, isAdmin } = useAuth();
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !isAdmin) return null;

  const handleDownloadBackup = () => {
    setIsProcessing(true);
    setStatusMsg('');
    setErrorMsg('');

    authFetch('/api/admin/backup')
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลดไฟล์สำรองได้');
        return res.blob();
      })
      .then(blob => {
        setIsProcessing(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `kaojai_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setStatusMsg('ดาวน์โหลดไฟล์สำรองฐานข้อมูล (.sqlite) สำเร็จเรียบร้อย! 💾');
      })
      .catch(err => {
        setIsProcessing(false);
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการดาวน์โหลด');
      });
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('⚠️ คำเตือนสำคัญ:\nการกู้คืนฐานข้อมูลจะเขียนทับข้อมูลห้อง ผู้เรียน และบัญชีผู้ใช้ปัจจุบันทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessing(true);
    setStatusMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer) {
        setIsProcessing(false);
        setErrorMsg('ไม่สามารถอ่านไฟล์ได้');
        return;
      }

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const sqliteBase64 = window.btoa(binary);

      authFetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sqliteBase64 })
      })
        .then(res => res.json())
        .then(data => {
          setIsProcessing(false);
          if (data.success) {
            setStatusMsg('🎉 กู้คืนฐานข้อมูลสำเร็จเรียบร้อยแล้ว! แนะนำให้รีเฟรชหน้าเว็บ');
          } else {
            setErrorMsg(data.message || 'ไม่สามารถกู้คืนฐานข้อมูลได้');
          }
        })
        .catch(err => {
          setIsProcessing(false);
          setErrorMsg('เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล');
        })
        .finally(() => {
          if (fileInputRef.current) fileInputRef.current.value = '';
        });
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#FEF3C7', color: '#D97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Database size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                สำรองและกู้คืนฐานข้อมูล (Database Backup)
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                เฉพาะสิทธิ์ผู้ดูแลระบบ (Admin Only)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px',
              padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {statusMsg && (
            <div style={{
              background: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534',
              padding: '12px 16px', borderRadius: '14px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626',
              padding: '12px 16px', borderRadius: '14px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px',
            padding: '18px', marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
              1. ดาวน์โหลดไฟล์สำรองข้อมูล (Backup)
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              ดาวน์โหลดสำเนาไฟล์ฐานข้อมูล SQLite (<code style={{ background: '#E2E8F0', padding: '1px 4px', borderRadius: '4px' }}>kaojai.sqlite</code>) เก็บไว้เพื่อความปลอดภัย
            </p>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDownloadBackup}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: '#FFFFFF', border: '1.5px solid #CBD5E1', color: '#1E293B',
                fontWeight: 800, fontSize: '0.9rem', cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <Download size={18} color="#2563EB" />
              {isProcessing ? 'กำลังประมวลผล...' : 'ดาวน์โหลดไฟล์ฐานข้อมูล (.sqlite)'}
            </button>
          </div>

          <div style={{
            background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '16px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ShieldAlert size={16} color="#EA580C" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#9A3412' }}>
                2. กู้คืนฐานข้อมูลจากไฟล์สำรอง (Restore)
              </h4>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#B45309', lineHeight: 1.5 }}>
              นำเข้าไฟล์สำรองเพื่อกู้คืนระบบกลับไปยังจุดที่สำรองไว้ ข้อมูลปัจจุบันจะถูกเขียนทับ
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreFile}
              accept=".sqlite,application/x-sqlite3,application/octet-stream"
              style={{ display: 'none' }}
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px',
                background: '#EA580C', border: 'none', color: '#FFFFFF',
                fontWeight: 800, fontSize: '0.9rem', cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
              }}
            >
              <Upload size={18} />
              {isProcessing ? 'กำลังกู้คืน...' : 'เลือกไฟล์ .sqlite เพื่อกู้คืน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
