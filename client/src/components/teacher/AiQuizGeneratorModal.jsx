import React, { useState } from 'react';
import { Sparkles, X, Wand2, Check, AlertCircle, Trash2, ArrowUpDown, HelpCircle } from 'lucide-react';

export const AiQuizGeneratorModal = ({ isOpen, onClose, onQuizGenerated }) => {
  const [topic, setTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState('MIXED'); // 'MIXED', 'CHOICE', 'SEQUENCE'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Review Stage State
  const [reviewQuiz, setReviewQuiz] = useState(null);
  const [generatedSource, setGeneratedSource] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim() && !textContent.trim()) {
      setError('กรุณาระบุหัวข้อคำถาม หรือวางเนื้อหาที่ต้องการให้ AI สรุป');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/quizzes/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          textContent: textContent.trim(),
          questionCount: Number(questionCount) || 5,
          questionTypes,
          difficulty,
          language: 'th'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'การสร้างข้อสอบด้วย AI ล้มเหลว');
      }

      setReviewQuiz(data.quiz);
      setGeneratedSource(data.source || 'gemini');
    } catch (err) {
      console.error('[AI Gen Error]:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการติดต่อระบบ AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuestion = (idxToRemove) => {
    if (!reviewQuiz) return;
    const updated = reviewQuiz.questions.filter((_, i) => i !== idxToRemove);
    setReviewQuiz({ ...reviewQuiz, questions: updated });
  };

  const handleTitleChange = (newTitle) => {
    if (!reviewQuiz) return;
    setReviewQuiz({ ...reviewQuiz, title: newTitle });
  };

  const handleSaveToBackoffice = () => {
    if (!reviewQuiz || reviewQuiz.questions.length === 0) {
      setError('ต้องมีคำถามอย่างน้อย 1 ข้อในชุดแบบทดสอบ');
      return;
    }
    onQuizGenerated(reviewQuiz);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: reviewQuiz ? '780px' : '580px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        transition: 'max-width 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#FDE047" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {reviewQuiz ? 'ตรวจทานและปรับแต่งข้อสอบ AI' : 'สร้างชุดข้อสอบอัตโนมัติด้วย AI'}
              </h2>
              <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.9 }}>
                {reviewQuiz
                  ? `ระบบสร้างคำถามเรียบร้อยแล้ว (${reviewQuiz.questions.length} ข้อ) สามารถปรับแก้ก่อนบันทึก`
                  : 'ระบุหัวข้อหรือวางเนื้อหาบทเรียนเพื่อสร้าง Choice & Sequence อัตโนมัติ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #F87171',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!reviewQuiz ? (
            /* CONFIGURATION FORM VIEW */
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', marginBottom: '6px' }}>
                  🎯 หัวข้อข้อสอบ (Topic) *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น การปฐมพยาบาลเบื้องต้น (CPR), Agile Scrum Framework, ความปลอดภัยไอที"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', marginBottom: '6px' }}>
                  📝 เอกสารหรือเนื้อหาบทเรียน (Paste Content) <span style={{ fontWeight: 400, color: '#64748B', fontSize: '0.82rem' }}>(ไม่บังคับ)</span>
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="วางเนื้อหาบรรยาย, SOP, เอกสารสรุป, หรือข้อความสำคัญที่ต้องการให้ออกข้อสอบตามนี้..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  disabled={isLoading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '6px' }}>
                    🔢 จำนวนข้อคำถาม ({questionCount} ข้อ)
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#4F46E5' }}
                    disabled={isLoading}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                    <span>2 ข้อ</span>
                    <span>5 ข้อ</span>
                    <span>10 ข้อ</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '6px' }}>
                    ⭐ ระดับความยาก
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                    disabled={isLoading}
                  >
                    <option value="easy">ง่าย (ความรู้พื้นฐาน)</option>
                    <option value="medium">ปานกลาง (วิเคราะห์/ประยุกต์)</option>
                    <option value="hard">ท้าทาย (เคสจำลอง/แก้ปัญหา)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '8px' }}>
                  🎲 รูปแบบของคำถาม
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'MIXED', label: '🔀 ผสมผสาน (Choice + Sequence)' },
                    { id: 'CHOICE', label: '🔘 ปรนัย 4 ช้อยส์ เท่านั้น' },
                    { id: 'SEQUENCE', label: '🔢 ลำดับขั้นตอน (Sequence) เท่านั้น' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuestionTypes(t.id)}
                      disabled={isLoading}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: questionTypes === t.id ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                        background: questionTypes === t.id ? '#EEF2FF' : '#F8FAFC',
                        color: questionTypes === t.id ? '#4338CA' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isLoading
                      ? '#94A3B8'
                      : 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                  }}
                >
                  <Wand2 size={18} />
                  {isLoading ? 'AI กำลังประมวลผลข้อสอบ...' : 'เริ่มสร้างชุดข้อสอบ ✨'}
                </button>
              </div>
            </form>
          ) : (
            /* REVIEW & QUICK EDIT VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                background: generatedSource === 'gemini' ? '#F0FDF4' : '#FFFBEB',
                border: generatedSource === 'gemini' ? '1px solid #86EFAC' : '1px solid #FCD34D',
                padding: '10px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: generatedSource === 'gemini' ? '#166534' : '#92400E'
              }}>
                <Sparkles size={16} />
                <span>
                  {generatedSource === 'gemini'
                    ? 'สร้างข้อสอบสำเร็จด้วย Google Gemini 1.5 Flash'
                    : 'สร้างข้อสอบสำเร็จผ่าน Smart Mock Engine (พร้อมใช้งาน)'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '4px' }}>
                  ชื่อชุดข้อสอบ (แก้ไขได้)
                </label>
                <input
                  type="text"
                  value={reviewQuiz.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#334155' }}>
                    รายการคำถามที่สร้าง ({reviewQuiz.questions.length} ข้อ)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    สามารถกดลบข้อที่ไม่ต้องการออกได้
                  </span>
                </div>

                {reviewQuiz.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      background: '#F8FAFC',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: q.questionType === 'SEQUENCE' ? '#8B5CF6' : '#2563EB',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {q.questionType === 'SEQUENCE' ? '🔢 SEQUENCE' : '🔘 CHOICE'}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
                          ข้อที่ {idx + 1}: {q.questionText}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        title="ลบคำถามข้อนี้"
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          color: '#DC2626',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {q.questionType === 'SEQUENCE' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {q.sequenceItems?.map((item, sIdx) => (
                          <div
                            key={item.id || sIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <span style={{ fontWeight: 800, color: '#8B5CF6', minWidth: '20px' }}>
                              {sIdx + 1}.
                            </span>
                            <span style={{ color: '#334155' }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                        {q.options?.map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            style={{
                              background: opt.isCorrect ? '#DCFCE7' : '#FFFFFF',
                              border: opt.isCorrect ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: opt.isCorrect ? '#166534' : '#475569',
                              fontWeight: opt.isCorrect ? 700 : 400
                            }}
                          >
                            <span>{opt.isCorrect ? '✓' : '•'}</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReviewQuiz(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← ย้อนกลับไปตั้งค่าใหม่
                </button>
                <button
                  type="button"
                  onClick={handleSaveToBackoffice}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <Check size={18} />
                  บันทึกเข้าสู่คลังข้อสอบ 💾
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
