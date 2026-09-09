import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Clock, CheckCircle2, Upload, X, Copy, ListOrdered, ArrowUp, ArrowDown, Download, FileUp, Sparkles, Search, Check, Layers } from 'lucide-react';
import { AiQuizGeneratorModal } from './AiQuizGeneratorModal';

export const TeacherBackoffice = ({ onBack }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleAiQuizGenerated = (newAiQuiz) => {
    // Save generated quiz to backend and open in editor
    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz: newAiQuiz })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotification('สร้างและบันทึกชุดข้อสอบด้วย AI สำเร็จเรียบร้อย! ✨🎉');
          fetchQuizzes();
          setActiveQuiz(data.quiz || newAiQuiz);
          setIsEditing(true);
          setTimeout(() => setNotification(''), 4000);
        } else {
          setActiveQuiz(newAiQuiz);
          setIsEditing(true);
        }
      })
      .catch(err => {
        console.error('Save AI quiz error:', err);
        setActiveQuiz(newAiQuiz);
        setIsEditing(true);
      });
  };

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

  const filteredQuizzes = useMemo(() => {
    if (!searchQuery.trim()) return quizzes;
    const q = searchQuery.toLowerCase().trim();
    return quizzes.filter(quiz => quiz.title?.toLowerCase().includes(q));
  }, [quizzes, searchQuery]);

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
    <div style={{ maxWidth: '1120px', margin: '24px auto', padding: '0 20px', paddingBottom: '110px' }}>
      {/* Modern Compact Header & Action Bar */}
      <header
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Left: Back button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: 'var(--text-main)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </button>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.2 }}>
              <span>🎓</span> Teacher Backoffice
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              ระบบจัดการคลังข้อสอบและสร้างคำถามอัจฉริยะ
            </p>
          </div>
        </div>

        {/* Right: Grouped Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Utilities Group (Import / Export) */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '4px' }}>
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
              title="นำเข้าไฟล์ข้อสอบ JSON"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: 'var(--text-main)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <FileUp size={14} color="var(--accent-earth-blue)" /> นำเข้า JSON
            </button>

            <button
              type="button"
              onClick={handleExportQuizzes}
              title="ดาวน์โหลดคลังข้อสอบทั้งหมดเก็บเป็นไฟล์ JSON"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: 'var(--text-main)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Download size={14} color="var(--accent-green)" /> ส่งออก JSON
            </button>
          </div>

          <div style={{ width: '1px', height: '28px', background: '#E2E8F0', margin: '0 2px' }} />

          {/* Primary Action: AI Generator */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            title="สร้างคำถามและช้อยส์อัตโนมัติด้วย AI"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} color="#FDE047" /> สร้างด้วย AI ✨
          </button>

          {/* Primary Action: Create Quiz */}
          <button
            type="button"
            onClick={handleCreateNewQuiz}
            style={{
              background: 'var(--accent-earth-blue)',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(30, 58, 138, 0.2)',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> สร้างชุดใหม่
          </button>
        </div>
      </header>

      <AiQuizGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onQuizGenerated={handleAiQuizGenerated}
      />

      {notification && (
        <div
          className="animate-pop"
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Check size={18} /> {notification}
        </div>
      )}

      {/* Main Content: Sidebar + Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '310px 1fr' : '1fr', gap: '20px' }}>
        {/* Quiz List Sidebar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            height: 'fit-content'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={18} color="var(--accent-earth-blue)" /> คลังชุดคำถาม
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#F1F5F9', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px' }}>
              {quizzes.length} ชุด
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อชุดคำถาม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '72vh', overflowY: 'auto' }}>
            {filteredQuizzes.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ไม่พบชุดคำถามที่ตรงกับการค้นหา
              </div>
            ) : (
              filteredQuizzes.map(q => {
                const isActive = activeQuiz?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => { setActiveQuiz(q); setIsEditing(true); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: isActive ? '#EFF6FF' : '#F8FAFC',
                      border: isActive ? '1.5px solid var(--accent-earth-blue)' : '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: isActive ? 800 : 700,
                          fontSize: '0.9rem',
                          color: isActive ? 'var(--accent-earth-blue)' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {q.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {q.questions?.length || 0} ข้อ
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        title="คัดลอกชุดคำถามนี้"
                        onClick={(e) => { e.stopPropagation(); handleDuplicateQuiz(q.id); }}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: 'var(--accent-earth-blue)',
                          padding: '5px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        title="ลบชุดคำถามนี้"
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(q.id); }}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #FCA5A5',
                          color: '#DC2626',
                          padding: '5px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quiz Editor Panel */}
        {isEditing && activeQuiz && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            {/* Editor Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  แก้ไขชุดคำถาม
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  แก้ไขเนื้อหาโจทย์ ตัวเลือก และเวลาตามต้องการ
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveQuiz}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'var(--accent-green)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(19, 136, 8, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <Save size={16} /> บันทึกชุดคำถาม
              </button>
            </div>

            {/* Quiz Title Field */}
            <div style={{ marginBottom: '22px', background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>
                ชื่อชุดคำถาม (Quiz Title)
              </label>
              <input
                type="text"
                value={activeQuiz.title}
                onChange={(e) => setActiveQuiz({ ...activeQuiz, title: e.target.value })}
                placeholder="เช่น การพัฒนาทักษะการทำงานเป็นทีม..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1px solid #CBD5E1',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* Questions Form List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeQuiz.questions.map((q, qIdx) => {
                const isSeq = q.questionType === 'SEQUENCE';
                return (
                  <div
                    key={q.id || qIdx}
                    style={{
                      background: '#F8FAFC',
                      padding: '20px',
                      borderRadius: '14px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Question Header & Type Selector */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            background: isSeq ? 'var(--accent-earth-orange)' : 'var(--accent-earth-blue)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            letterSpacing: '0.3px'
                          }}
                        >
                          ข้อที่ {qIdx + 1}
                        </span>

                        {/* Segmented Control */}
                        <div style={{ display: 'inline-flex', background: '#E2E8F0', borderRadius: '8px', padding: '2px' }}>
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
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: !isSeq ? '#FFFFFF' : 'transparent',
                              color: !isSeq ? 'var(--text-main)' : 'var(--text-muted)',
                              boxShadow: !isSeq ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
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
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isSeq ? '#FFFFFF' : 'transparent',
                              color: isSeq ? 'var(--accent-earth-orange)' : 'var(--text-muted)',
                              boxShadow: isSeq ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <ListOrdered size={13} /> Sequence Race
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FCA5A5',
                          color: '#DC2626',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> ลบข้อนี้
                      </button>
                    </div>

                    {/* Question Text */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-main)' }}>
                        โจทย์คำถาม:
                      </label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].questionText = e.target.value;
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        placeholder="กรอกข้อความคำถาม..."
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          color: 'var(--text-main)',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>

                    {/* Compact Meta Settings: Time limit & Image */}
                    <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                          <Clock size={13} color="var(--accent-earth-blue)" /> เวลาตอบ (วินาที)
                        </label>
                        <select
                          value={q.timeLimitSeconds}
                          onChange={(e) => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].timeLimitSeconds = parseInt(e.target.value, 10);
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            color: 'var(--text-main)',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value={10}>10 วินาที</option>
                          <option value={15}>15 วินาที</option>
                          <option value={20}>20 วินาที</option>
                          <option value={30}>30 วินาที</option>
                          <option value={45}>45 วินาที</option>
                          <option value={60}>60 วินาที</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                          <ImageIcon size={13} color="var(--accent-earth-blue)" /> รูปภาพประกอบ (ถ้ามี)
                        </label>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: 'var(--text-main)',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Upload size={13} color="var(--accent-earth-blue)" />
                            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageFileUpload(e, qIdx)}
                            />
                          </label>

                          <input
                            type="text"
                            placeholder="หรือวาง URL รูปภาพ (https://...)"
                            value={q.imageUrl || ''}
                            onChange={(e) => {
                              const updated = [...activeQuiz.questions];
                              updated[qIdx].imageUrl = e.target.value;
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: '#FFFFFF',
                              color: 'var(--text-main)',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.82rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Thumbnail Preview */}
                    {q.imageUrl && (
                      <div style={{ marginBottom: '14px', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                        <img
                          src={q.imageUrl}
                          alt="Question Preview"
                          style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          รูปภาพประกอบพร้อมแสดง
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].imageUrl = '';
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="ลบรูปนี้"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* QUESTION CONTENT SECTION: SEQUENCE OR CHOICE */}
                    {isSeq ? (
                      <div style={{ marginTop: '10px', background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            ลำดับขั้นตอนที่ถูกต้อง (เรียงจาก 1 ➔ 2 ➔ 3... จากบนลงล่าง):
                          </span>
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
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} /> เพิ่มขั้นตอน
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(q.sequenceItems || []).map((step, sIdx) => (
                            <div
                              key={step.id || sIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '6px 10px'
                              }}
                            >
                              <span
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'var(--accent-earth-orange)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
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
                                placeholder={`ระบุขั้นตอนที่ ${sIdx + 1}...`}
                                style={{
                                  flex: 1,
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.85rem',
                                  background: '#FFFFFF'
                                }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '5px',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: sIdx === 0 ? 'not-allowed' : 'pointer',
                                    opacity: sIdx === 0 ? 0.4 : 1
                                  }}
                                  title="เลื่อนขึ้น"
                                >
                                  <ArrowUp size={12} />
                                </button>

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
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '5px',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: sIdx === q.sequenceItems.length - 1 ? 'not-allowed' : 'pointer',
                                    opacity: sIdx === q.sequenceItems.length - 1 ? 0.4 : 1
                                  }}
                                  title="เลื่อนลง"
                                >
                                  <ArrowDown size={12} />
                                </button>

                                <button
                                  type="button"
                                  disabled={q.sequenceItems.length <= 3}
                                  onClick={() => {
                                    const updated = [...activeQuiz.questions];
                                    updated[qIdx].sequenceItems = updated[qIdx].sequenceItems.filter((_, i) => i !== sIdx);
                                    setActiveQuiz({ ...activeQuiz, questions: updated });
                                  }}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #FCA5A5',
                                    color: '#DC2626',
                                    borderRadius: '5px',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: q.sequenceItems.length <= 3 ? 'not-allowed' : 'pointer',
                                    opacity: q.sequenceItems.length <= 3 ? 0.4 : 1
                                  }}
                                  title="ลบขั้นตอนนี้"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* CHOICE OPTIONS (4 OPTIONS WITH KAOJAI COLOR CODING) */
                      <div style={{ marginTop: '10px', background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
                          ตัวเลือก 4 ข้อ (คลิกที่ปุ่มเพื่อกำหนดข้อที่ถูกต้อง):
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                          {(q.options || []).map((opt, optIdx) => {
                            const choiceColors = [
                              { bg: '#FEF2F2', border: '#F87171', labelBg: '#E21B3C', letter: 'A' },
                              { bg: '#EFF6FF', border: '#60A5FA', labelBg: '#1368CE', letter: 'B' },
                              { bg: '#FEFCE8', border: '#FACC15', labelBg: '#D89E00', letter: 'C' },
                              { bg: '#F0FDF4', border: '#4ADE80', labelBg: '#26890C', letter: 'D' }
                            ];
                            const c = choiceColors[optIdx] || choiceColors[0];
                            return (
                              <div
                                key={opt.id || optIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: c.bg,
                                  border: `1.5px solid ${opt.isCorrect ? '#16A34A' : c.border}`,
                                  borderRadius: '8px',
                                  padding: '4px 6px'
                                }}
                              >
                                <span
                                  style={{
                                    background: c.labelBg,
                                    color: '#FFFFFF',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  {c.letter}
                                </span>

                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updated = [...activeQuiz.questions];
                                    updated[qIdx].options[optIdx].text = e.target.value;
                                    setActiveQuiz({ ...activeQuiz, questions: updated });
                                  }}
                                  placeholder={`ตัวเลือก ${c.letter}...`}
                                  style={{
                                    flex: 1,
                                    padding: '5px 8px',
                                    borderRadius: '5px',
                                    background: '#FFFFFF',
                                    color: 'var(--text-main)',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.85rem'
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...activeQuiz.questions];
                                    updated[qIdx].options.forEach((o, i) => o.isCorrect = (i === optIdx));
                                    setActiveQuiz({ ...activeQuiz, questions: updated });
                                  }}
                                  style={{
                                    background: opt.isCorrect ? '#16A34A' : '#E2E8F0',
                                    color: opt.isCorrect ? '#FFFFFF' : '#64748B',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <CheckCircle2 size={13} /> {opt.isCorrect ? 'ถูกต้อง' : 'เลือก'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Question Button */}
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1.5px dashed #94A3B8',
                  color: 'var(--accent-earth-blue)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> เพิ่มคำถามข้อใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Floating Pill Bar at Bottom */}
      {isEditing && activeQuiz && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(580px, 92vw)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid #138808',
            borderRadius: '50px',
            padding: '6px 14px 6px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            zIndex: 1000
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              กำลังแก้ไข:
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: 'var(--accent-earth-blue)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeQuiz.title || 'ชุดคำถามใหม่'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ({activeQuiz.questions?.length || 0} ข้อ)
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveQuiz}
            style={{
              padding: '8px 18px',
              borderRadius: '30px',
              background: 'var(--accent-green)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(19, 136, 8, 0.3)',
              cursor: 'pointer',
              border: 'none',
              flexShrink: 0
            }}
          >
            <Save size={16} /> บันทึกชุดคำถาม
          </button>
        </div>
      )}
    </div>
  );
};
