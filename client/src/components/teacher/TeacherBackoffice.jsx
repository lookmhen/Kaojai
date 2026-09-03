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
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={18} /> กลับหน้าหลัก
        </button>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
          🎓 Teacher Backoffice (ระบบจัดการคำถาม)
        </h1>

        <button
          type="button"
          onClick={handleCreateNewQuiz}
          style={{
            background: 'linear-gradient(135deg, #00CEC9 0%, #0984e3 100%)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} /> สร้างชุดคำถามใหม่
        </button>
      </div>

      {notification && (
        <div style={{ background: 'rgba(46, 204, 113, 0.25)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 700, textAlign: 'center' }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '300px 1fr' : '1fr', gap: '24px' }}>
        {/* Quiz List Panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'rgba(255,255,255,0.9)' }}>
            คลังชุดคำถามทั้งหมด ({quizzes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quizzes.map(q => (
              <div
                key={q.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: activeQuiz?.id === q.id ? 'var(--primary-purple)' : 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => { setActiveQuiz(q); setIsEditing(true); }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{q.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{q.questions.length} ข้อ</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id); }}
                  style={{ background: 'transparent', color: '#ff7675', padding: '4px' }}
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>แก้ไขชุดคำถาม</h2>
              <button
                type="button"
                onClick={handleSaveQuiz}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'var(--pulse-green)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={18} /> บันทึกชุดคำถาม
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>ชื่อชุดคำถาม:</label>
              <input
                type="text"
                value={activeQuiz.title}
                onChange={(e) => setActiveQuiz({ ...activeQuiz, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Questions Form List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
              {activeQuiz.questions.map((q, qIdx) => (
                <div key={q.id || qIdx} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>ข้อที่ {qIdx + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#ff7675', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={14} /> ลบข้อนี้
                    </button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>โจทย์คำถาม:</label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...activeQuiz.questions];
                        updated[qIdx].questionText = e.target.value;
                        setActiveQuiz({ ...activeQuiz, questions: updated });
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Clock size={14} /> กำหนดเวลาตอบ (วินาที):
                      </label>
                      <select
                        value={q.timeLimitSeconds}
                        onChange={(e) => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].timeLimitSeconds = parseInt(e.target.value, 10);
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        <option value={10}>10 วินาที</option>
                        <option value={15}>15 วินาที</option>
                        <option value={20}>20 วินาที</option>
                        <option value={30}>30 วินาที</option>
                        <option value={60}>60 วินาที</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <ImageIcon size={14} /> รูปภาพประกอบคำถาม (Image URL):
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
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>ตัวเลือก 4 ข้อ (คลิกเลือกปุ่มถูกสำหรับข้อที่ถูกต้อง):</label>
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
                              background: opt.isCorrect ? 'var(--pulse-green)' : 'rgba(255,255,255,0.1)',
                              color: opt.isCorrect ? '#000' : '#fff',
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
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem' }}
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
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px dashed rgba(255,255,255,0.3)',
                  color: '#fff',
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
