import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Clock, CheckCircle2 } from 'lucide-react';

export const TeacherBackoffice = ({ onBack }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = () => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (data.quizzes) setQuizzes(data.quizzes);
      })
      .catch(err => console.error('Fetch error:', err));
  };

  const handleCreateNewQuiz = () => {
    const newQuiz = {
      id: `quiz-${Date.now()}`,
      title: 'ชุดคำถามใหม่สำหรับวิทยากร',
      description: 'คำอธิบายชุดคำถาม...',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          questionText: 'คำถามข้อที่ 1...',
          timeLimitSeconds: 20,
          imageUrl: '',
          options: [
            { id: 'opt1', text: 'ตัวเลือก A', isCorrect: true },
            { id: 'opt2', text: 'ตัวเลือก B', isCorrect: false },
            { id: 'opt3', text: 'ตัวเลือก C', isCorrect: false },
            { id: 'opt4', text: 'ตัวเลือก D', isCorrect: false }
          ]
        }
      ]
    };
    setActiveQuiz(newQuiz);
    setIsEditing(true);
  };

  const handleAddQuestion = () => {
    if (!activeQuiz) return;
    const newQ = {
      id: `q-${Date.now()}-${activeQuiz.questions.length + 1}`,
      questionText: 'คำถามใหม่...',
      timeLimitSeconds: 20,
      imageUrl: '',
      options: [
        { id: 'opt1', text: 'ตัวเลือก A', isCorrect: true },
        { id: 'opt2', text: 'ตัวเลือก B', isCorrect: false },
        { id: 'opt3', text: 'ตัวเลือก C', isCorrect: false },
        { id: 'opt4', text: 'ตัวเลือก D', isCorrect: false }
      ]
    };
    setActiveQuiz({
      ...activeQuiz,
      questions: [...activeQuiz.questions, newQ]
    });
  };

  const handleRemoveQuestion = (qIdx) => {
    if (!activeQuiz) return;
    const updatedQ = activeQuiz.questions.filter((_, idx) => idx !== qIdx);
    setActiveQuiz({ ...activeQuiz, questions: updatedQ });
  };

  const handleSaveQuiz = () => {
    if (!activeQuiz || !activeQuiz.title.trim()) return;

    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz: activeQuiz })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotification('บันทึกชุดคำถามสำเร็จ! 🎉');
          fetchQuizzes();
          setTimeout(() => setNotification(''), 3000);
        }
      })
      .catch(err => console.error('Save error:', err));
  };

  const handleDeleteQuiz = (quizId) => {
    if (!window.confirm('คุณต้องการลบชุดคำถามนี้หรือไม่?')) return;

    fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchQuizzes();
          if (activeQuiz?.id === quizId) {
            setActiveQuiz(null);
            setIsEditing(false);
          }
        }
      });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: 'var(--text-main)',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={18} /> กลับหน้าหลัก
        </button>

        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-earth-orange)' }}>
          🎓 Teacher Backoffice (ระบบจัดการคำถาม)
        </h1>

        <button
          type="button"
          onClick={handleCreateNewQuiz}
          style={{
            background: 'var(--accent-earth-blue)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
          }}
        >
          <Plus size={18} /> สร้างชุดคำถามใหม่
        </button>
      </div>

      {notification && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 700, textAlign: 'center' }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '290px 1fr' : '1fr', gap: '24px' }}>
        {/* Quiz List Panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
            คลังชุดคำถามทั้งหมด ({quizzes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quizzes.map(q => (
              <div
                key={q.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: activeQuiz?.id === q.id ? '#EFF6FF' : '#F8FAFC',
                  border: activeQuiz?.id === q.id ? '2px solid var(--accent-earth-blue)' : '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => { setActiveQuiz(q); setIsEditing(true); }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{q.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.questions.length} ข้อ</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id); }}
                  style={{ background: 'transparent', color: '#991B1B', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Editor Panel */}
        {isEditing && activeQuiz && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>แก้ไขชุดคำถาม</h2>
              <button
                type="button"
                onClick={handleSaveQuiz}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: 'var(--accent-earth-green)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={18} /> บันทึกชุดคำถาม
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-main)' }}>ชื่อชุดคำถาม:</label>
              <input
                type="text"
                value={activeQuiz.title}
                onChange={(e) => setActiveQuiz({ ...activeQuiz, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', color: 'var(--text-main)', border: '1px solid #CBD5E1' }}
              />
            </div>

            {/* Questions Form List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
              {activeQuiz.questions.map((q, qIdx) => (
                <div key={q.id || qIdx} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 800, color: 'var(--accent-earth-blue)' }}>ข้อที่ {qIdx + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      <Trash2 size={14} /> ลบข้อนี้
                    </button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-main)' }}>โจทย์คำถาม:</label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...activeQuiz.questions];
                        updated[qIdx].questionText = e.target.value;
                        setActiveQuiz({ ...activeQuiz, questions: updated });
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: 'var(--text-main)' }}>
                        <Clock size={14} color="var(--accent-earth-blue)" /> กำหนดเวลาตอบ (วินาที):
                      </label>
                      <select
                        value={q.timeLimitSeconds}
                        onChange={(e) => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].timeLimitSeconds = parseInt(e.target.value, 10);
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid #CBD5E1' }}
                      >
                        <option value={10}>10 วินาที</option>
                        <option value={15}>15 วินาที</option>
                        <option value={20}>20 วินาที</option>
                        <option value={30}>30 วินาที</option>
                        <option value={60}>60 วินาที</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: 'var(--text-main)' }}>
                        <ImageIcon size={14} color="var(--accent-earth-blue)" /> รูปภาพประกอบคำถาม (Image URL):
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={q.imageUrl || ''}
                        onChange={(e) => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].imageUrl = e.target.value;
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>ตัวเลือก 4 ข้อ (คลิกเลือกปุ่มถูกสำหรับข้อที่ถูกต้อง):</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id || optIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...activeQuiz.questions];
                              updated[qIdx].options.forEach((o, i) => o.isCorrect = (i === optIdx));
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            style={{
                              background: opt.isCorrect ? 'var(--pulse-green)' : '#E2E8F0',
                              color: opt.isCorrect ? '#FFFFFF' : '#475569',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            <CheckCircle2 size={14} /> {opt.isCorrect ? 'ถูก' : 'ผิด'}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...activeQuiz.questions];
                              updated[qIdx].options[optIdx].text = e.target.value;
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuestion}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px dashed #CBD5E1',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={18} /> เพิ่มคำถามข้อใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
