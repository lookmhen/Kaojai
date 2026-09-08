import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Clock, CheckCircle2, Upload, X, Copy, ListOrdered, ArrowUp, ArrowDown, Download, FileUp } from 'lucide-react';

export const TeacherBackoffice = ({ onBack }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportQuizzes = () => {
    fetch('/api/quizzes/export')
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `kaojai_quizzes_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setNotification('ดาวน์โหลดไฟล์สำรองคลังข้อสอบ (JSON) สำเร็จเรียบร้อย! 💾');
        setTimeout(() => setNotification(''), 3500);
      })
      .catch(err => {
        console.error('Export error:', err);
        alert('เกิดข้อผิดพลาดในการส่งออกข้อสอบ');
      });
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) {
          alert('ไฟล์ไม่ถูกต้อง: ต้องเป็น Array ของชุดคำถาม');
          return;
        }

        fetch('/api/quizzes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizzes: parsed, replaceAll: false })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setNotification(`นำเข้าคลังข้อสอบสำเร็จ ${data.count} ชุด! 🎉`);
              fetchQuizzes();
              if (data.quizzes?.length > 0) {
                setActiveQuiz(data.quizzes[data.quizzes.length - 1]);
                setIsEditing(true);
              }
              setTimeout(() => setNotification(''), 4000);
            } else {
              alert(data.message || 'ไม่สามารถนำเข้าข้อมูลได้');
            }
          })
          .catch(err => {
            console.error('Import API error:', err);
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูลไปยังเซิร์ฟเวอร์');
          });
      } catch (err) {
        alert('ไฟล์ JSON มีรูปแบบไม่ถูกต้อง: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = () => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (data.quizzes) {
          setQuizzes(data.quizzes);
          if (data.quizzes.length > 0 && !activeQuiz) {
            setActiveQuiz(data.quizzes[0]);
            setIsEditing(true);
          }
        }
      })
      .catch(err => console.error('Fetch error:', err));
  };

  const handleDuplicateQuiz = (quizId) => {
    fetch(`/api/quizzes/${quizId}/duplicate`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.quiz) {
          setNotification(`คัดลอกชุดคำถาม "${data.quiz.title}" สำเร็จเรียบร้อย! 🎉`);
          fetchQuizzes();
          setActiveQuiz(data.quiz);
          setIsEditing(true);
          setTimeout(() => setNotification(''), 3500);
        } else {
          alert(data.message || 'ไม่สามารถคัดลอกชุดคำถามได้');
        }
      })
      .catch(err => {
        console.error('Duplicate error:', err);
        alert('เกิดข้อผิดพลาดในการคัดลอกชุดคำถาม');
      });
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

  const handleImageFileUpload = (e, qIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพเกิน 15MB กรุณาเลือกไฟล์ที่มีขนาดเล็กลง');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64Data, fileName: file.name })
      })
        .then(res => res.json())
        .then(data => {
          setIsUploading(false);
          if (data.success && data.imageUrl) {
            const updated = [...activeQuiz.questions];
            updated[qIdx].imageUrl = data.imageUrl;
            setActiveQuiz({ ...activeQuiz, questions: updated });
          } else {
            alert('ไม่สามารถอัปโหลดรูปภาพได้');
          }
        })
        .catch(err => {
          setIsUploading(false);
          console.error('Upload error:', err);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuiz = () => {
    if (!activeQuiz || !activeQuiz.title.trim()) {
      alert('กรุณากรอกชื่อชุดคำถาม');
      return;
    }

    // Question validation
    for (let i = 0; i < activeQuiz.questions.length; i++) {
      const q = activeQuiz.questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        alert(`ข้อที่ ${i + 1} ยังไม่ได้กรอกโจทย์คำถาม`);
        return;
      }
      if (q.questionType === 'SEQUENCE') {
        if (!q.sequenceItems || q.sequenceItems.length < 3) {
          alert(`ข้อที่ ${i + 1} ต้องมีขั้นตอนอย่างน้อย 3 ขั้นตอน`);
          return;
        }
        for (let j = 0; j < q.sequenceItems.length; j++) {
          if (!q.sequenceItems[j].text || !q.sequenceItems[j].text.trim()) {
            alert(`ข้อที่ ${i + 1} ขั้นตอนที่ ${j + 1} ยังไม่ได้กรอกคำอธิบาย`);
            return;
          }
        }
      } else {
        if (!q.options || !q.options.some(opt => opt.isCorrect)) {
          alert(`ข้อที่ ${i + 1} ยังไม่ได้เลือกคำตอบที่ถูกต้อง`);
          return;
        }
      }
    }

    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz: activeQuiz })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotification('บันทึกชุดคำถามสำเร็จเรียบร้อย! 🎉');
          fetchQuizzes();
          setTimeout(() => setNotification(''), 3500);
        } else {
          alert(data.message || 'ไม่สามารถบันทึกได้');
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
    <div style={{ maxWidth: '1050px', margin: '30px auto', padding: '0 20px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: 'var(--text-main)',
              padding: '10px 18px',
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
            🎓 Teacher Backoffice (จัดการคำถาม)
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Hidden File Input for Import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="นำเข้าไฟล์ข้อสอบ JSON จากเครื่องคุณ"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: 'var(--text-main)',
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FileUp size={16} color="var(--accent-earth-blue)" /> นำเข้า (Import JSON)
          </button>

          <button
            type="button"
            onClick={handleExportQuizzes}
            title="ดาวน์โหลดคลังข้อสอบทั้งหมดเก็บเป็นไฟล์ JSON"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: 'var(--text-main)',
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={16} color="#166534" /> ส่งออก (Export JSON)
          </button>

          {isEditing && activeQuiz && (
            <button
              type="button"
              onClick={handleSaveQuiz}
              style={{
                background: '#138808',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(19, 136, 8, 0.3)',
                borderBottom: '3px solid #0B5605'
              }}
            >
              <Save size={18} /> บันทึกชุดคำถาม
            </button>
          )}

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
      </div>

      {notification && (
        <div className="animate-pop" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 800, textAlign: 'center', fontSize: '1.05rem' }}>
          {notification}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '290px 1fr' : '1fr', gap: '24px' }}>
        {/* Quiz List Panel */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
            คลังชุดคำถาม ({quizzes.length})
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    title="คัดลอกชุดคำถามนี้"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateQuiz(q.id); }}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: 'var(--accent-earth-blue)',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    title="ลบชุดคำถามนี้"
                    onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#991B1B',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Editor Panel */}
        {isEditing && activeQuiz && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>แก้ไขชุดคำถาม</h2>
              <button
                type="button"
                onClick={handleSaveQuiz}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  background: '#138808',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(19, 136, 8, 0.3)',
                  borderBottom: '3px solid #0B5605'
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
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', color: 'var(--text-main)', border: '1px solid #CBD5E1', fontSize: '1.05rem', fontWeight: 700 }}
              />
            </div>

            {/* Questions Form List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
              {activeQuiz.questions.map((q, qIdx) => (
                <div key={q.id || qIdx} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h4 style={{ fontWeight: 800, color: 'var(--accent-earth-blue)', fontSize: '1.05rem' }}>ข้อที่ {qIdx + 1}</h4>
                      {/* Question Type Selector */}
                      <div style={{ display: 'inline-flex', background: '#E2E8F0', borderRadius: '10px', padding: '3px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].questionType = 'CHOICE';
                            if (!updated[qIdx].options || updated[qIdx].options.length === 0) {
                              updated[qIdx].options = [
                                { id: 'opt1', text: 'ตัวเลือก A', isCorrect: true },
                                { id: 'opt2', text: 'ตัวเลือก B', isCorrect: false },
                                { id: 'opt3', text: 'ตัวเลือก C', isCorrect: false },
                                { id: 'opt4', text: 'ตัวเลือก D', isCorrect: false }
                              ];
                            }
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: (!q.questionType || q.questionType === 'CHOICE') ? 'var(--accent-earth-blue)' : 'transparent',
                            color: (!q.questionType || q.questionType === 'CHOICE') ? '#FFFFFF' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          🔘 ปรนัย (Choice)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].questionType = 'SEQUENCE';
                            if (!updated[qIdx].sequenceItems || updated[qIdx].sequenceItems.length === 0) {
                              updated[qIdx].sequenceItems = [
                                { id: `seq1-${Date.now()}`, text: 'ขั้นตอนที่ 1' },
                                { id: `seq2-${Date.now()}`, text: 'ขั้นตอนที่ 2' },
                                { id: `seq3-${Date.now()}`, text: 'ขั้นตอนที่ 3' },
                                { id: `seq4-${Date.now()}`, text: 'ขั้นตอนที่ 4' }
                              ];
                            }
                            if (updated[qIdx].timeLimitSeconds < 30) {
                              updated[qIdx].timeLimitSeconds = 30;
                            }
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: q.questionType === 'SEQUENCE' ? 'var(--accent-earth-orange)' : 'transparent',
                            color: q.questionType === 'SEQUENCE' ? '#FFFFFF' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <ListOrdered size={14} /> Sequence Race (เรียงลำดับ)
                        </button>
                      </div>
                    </div>

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
                        <ImageIcon size={14} color="var(--accent-earth-blue)" /> รูปภาพประกอบคำถาม:
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'var(--accent-earth-blue)',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Upload size={14} /> {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดจากคอมพิวเตอร์'}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageFileUpload(e, qIdx)}
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          placeholder="หรือวาง URL รูปภาพภายนอก (https://...)"
                          value={q.imageUrl || ''}
                          onChange={(e) => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].imageUrl = e.target.value;
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {q.imageUrl && (
                    <div style={{ marginTop: '8px', marginBottom: '16px', position: 'relative', display: 'inline-block', maxWidth: '240px' }}>
                      <div style={{ width: '220px', height: '120px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                        <img
                          src={q.imageUrl}
                          alt="Question Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].imageUrl = '';
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#991B1B',
                          color: '#FFFFFF',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {q.questionType === 'SEQUENCE' ? (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          กำหนดขั้นตอนตามลำดับที่ถูกต้อง (จากบนลงล่าง 1 ➔ 2 ➔ 3...):
                        </label>
                        {(!q.sequenceItems || q.sequenceItems.length < 6) && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...activeQuiz.questions];
                              const curItems = updated[qIdx].sequenceItems || [];
                              updated[qIdx].sequenceItems = [
                                ...curItems,
                                { id: `seq-${Date.now()}-${curItems.length + 1}`, text: `ขั้นตอนที่ ${curItems.length + 1}` }
                              ];
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: 'var(--accent-earth-blue)',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> เพิ่มขั้นตอน
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(q.sequenceItems || []).map((step, sIdx) => (
                          <div
                            key={step.id || sIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '10px',
                              padding: '8px 12px'
                            }}
                          >
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--accent-earth-orange)',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {sIdx + 1}
                            </span>

                            <input
                              type="text"
                              value={step.text}
                              onChange={(e) => {
                                const updated = [...activeQuiz.questions];
                                updated[qIdx].sequenceItems[sIdx].text = e.target.value;
                                setActiveQuiz({ ...activeQuiz, questions: updated });
                              }}
                              placeholder={`ระบุคำอธิบายขั้นตอนที่ ${sIdx + 1}...`}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.9rem',
                                color: 'var(--text-main)'
                              }}
                            />

                            {/* Move Up Button */}
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => {
                                const updated = [...activeQuiz.questions];
                                const items = [...updated[qIdx].sequenceItems];
                                const [moved] = items.splice(sIdx, 1);
                                items.splice(sIdx - 1, 0, moved);
                                updated[qIdx].sequenceItems = items;
                                setActiveQuiz({ ...activeQuiz, questions: updated });
                              }}
                              style={{
                                background: sIdx === 0 ? '#F1F5F9' : '#E2E8F0',
                                color: sIdx === 0 ? '#94A3B8' : 'var(--text-main)',
                                border: 'none',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: sIdx === 0 ? 'not-allowed' : 'pointer'
                              }}
                              title="สลับขึ้น"
                            >
                              <ArrowUp size={14} />
                            </button>

                            {/* Move Down Button */}
                            <button
                              type="button"
                              disabled={sIdx === q.sequenceItems.length - 1}
                              onClick={() => {
                                const updated = [...activeQuiz.questions];
                                const items = [...updated[qIdx].sequenceItems];
                                const [moved] = items.splice(sIdx, 1);
                                items.splice(sIdx + 1, 0, moved);
                                updated[qIdx].sequenceItems = items;
                                setActiveQuiz({ ...activeQuiz, questions: updated });
                              }}
                              style={{
                                background: sIdx === q.sequenceItems.length - 1 ? '#F1F5F9' : '#E2E8F0',
                                color: sIdx === q.sequenceItems.length - 1 ? '#94A3B8' : 'var(--text-main)',
                                border: 'none',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: sIdx === q.sequenceItems.length - 1 ? 'not-allowed' : 'pointer'
                              }}
                              title="สลับลง"
                            >
                              <ArrowDown size={14} />
                            </button>

                            {/* Delete Step Button (minimum 3 steps) */}
                            <button
                              type="button"
                              disabled={q.sequenceItems.length <= 3}
                              onClick={() => {
                                const updated = [...activeQuiz.questions];
                                updated[qIdx].sequenceItems = updated[qIdx].sequenceItems.filter((_, i) => i !== sIdx);
                                setActiveQuiz({ ...activeQuiz, questions: updated });
                              }}
                              style={{
                                background: q.sequenceItems.length <= 3 ? '#F1F5F9' : '#FEF2F2',
                                color: q.sequenceItems.length <= 3 ? '#CBD5E1' : '#991B1B',
                                border: '1px solid',
                                borderColor: q.sequenceItems.length <= 3 ? '#E2E8F0' : '#FCA5A5',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: q.sequenceItems.length <= 3 ? 'not-allowed' : 'pointer'
                              }}
                              title="ลบขั้นตอนนี้"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                        ตัวเลือก 4 ข้อ (คลิกเลือกปุ่มถูกสำหรับข้อที่ถูกต้อง):
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(q.options || []).map((opt, optIdx) => (
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
                  )}
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

      {/* Floating Sticky Save Bar at Bottom */}
      {isEditing && activeQuiz && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(620px, 92vw)',
            height: '60px',
            background: '#FFFFFF',
            border: '2px solid #138808',
            borderRadius: '50px',
            padding: '8px 16px 8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            zIndex: 1000
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              แก้ไข:
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--accent-earth-blue)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeQuiz.title || 'ชุดคำถามใหม่'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ({activeQuiz.questions?.length || 0} ข้อ)
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveQuiz}
            style={{
              width: '180px',
              minWidth: '180px',
              height: '44px',
              borderRadius: '30px',
              background: '#138808',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(19, 136, 8, 0.35)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: 'none',
              flexShrink: 0
            }}
          >
            <Save size={18} /> บันทึกชุดคำถาม
          </button>
        </div>
      )}
    </div>
  );
};
