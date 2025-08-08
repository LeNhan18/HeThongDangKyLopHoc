import React, { useState, useEffect } from 'react';
import './css/AdminLessons.css';

const AdminLessons = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  // Form states
  const [sectionForm, setSectionForm] = useState({
    title: '',
    section_order: 1
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    video_url: '',
    lessons_order: 1
  });

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:8000/courses/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch sections by course
  const fetchSections = async (courseId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/courses/${courseId}/sections`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSections(data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons by section
  const fetchLessons = async (sectionId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/sections/${sectionId}/lessons`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedSection(null);
    setLessons([]);
    fetchSections(course.id);
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    fetchLessons(section.id);
  };

  // Section CRUD operations
  const handleCreateSection = () => {
    setSectionForm({
      title: '',
      section_order: sections.length + 1
    });
    setEditingSection(null);
    setShowSectionModal(true);
  };

  const handleEditSection = (section) => {
    setSectionForm({
      title: section.title,
      section_order: section.section_order
    });
    setEditingSection(section);
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    try {
      const payload = {
        ...sectionForm,
        course_id: selectedCourse.id
      };

      const url = editingSection 
        ? `http://localhost:8000/sections/${editingSection.id}`
        : 'http://localhost:8000/sections/';
      
      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowSectionModal(false);
        fetchSections(selectedCourse.id);
        alert(editingSection ? 'Cập nhật chương thành công!' : 'Tạo chương thành công!');
      } else {
        const error = await response.text();
        alert(`Lỗi: ${error}`);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Lỗi khi lưu chương');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('Bạn có chắc muốn xóa chương này?')) {
      try {
        const response = await fetch(`http://localhost:8000/sections/${sectionId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          fetchSections(selectedCourse.id);
          if (selectedSection && selectedSection.id === sectionId) {
            setSelectedSection(null);
            setLessons([]);
          }
          alert('Xóa chương thành công!');
        } else {
          alert('Lỗi khi xóa chương');
        }
      } catch (error) {
        console.error('Error deleting section:', error);
        alert('Lỗi khi xóa chương');
      }
    }
  };

  // Lesson CRUD operations
  const handleCreateLesson = () => {
    setLessonForm({
      title: '',
      content: '',
      video_url: '',
      lessons_order: lessons.length + 1
    });
    setEditingLesson(null);
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson) => {
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      lessons_order: lesson.lessons_order
    });
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async () => {
    try {
      const payload = {
        ...lessonForm,
        section_id: selectedSection.id
      };

      const url = editingLesson 
        ? `http://localhost:8000/lessons/${editingLesson.id}`
        : 'http://localhost:8000/lessons/';
      
      const method = editingLesson ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowLessonModal(false);
        fetchLessons(selectedSection.id);
        alert(editingLesson ? 'Cập nhật bài học thành công!' : 'Tạo bài học thành công!');
      } else {
        const error = await response.text();
        alert(`Lỗi: ${error}`);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Lỗi khi lưu bài học');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài học này?')) {
      try {
        const response = await fetch(`http://localhost:8000/lessons/${lessonId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          fetchLessons(selectedSection.id);
          alert('Xóa bài học thành công!');
        } else {
          alert('Lỗi khi xóa bài học');
        }
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Lỗi khi xóa bài học');
      }
    }
  };

  return (
    <div className="admin-lessons-container">
      <h1>📚 Quản lý Chương & Bài học</h1>
      
      <div className="admin-lessons-content">
        {/* Course Selection */}
        <div className="section">
          <h2>1. Chọn khóa học</h2>
          <div className="course-grid">
            {courses.map(course => (
              <div 
                key={course.id} 
                className={`course-card ${selectedCourse?.id === course.id ? 'selected' : ''}`}
                onClick={() => handleCourseSelect(course)}
              >
                <img src={course.image || '/default-course.jpg'} alt={course.name} />
                <h3>{course.name}</h3>
                <p>{course.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections Management */}
        {selectedCourse && (
          <div className="section">
            <div className="section-header">
              <h2>2. Chương của khóa học: {selectedCourse.name}</h2>
              <button className="btn-primary" onClick={handleCreateSection}>
                ➕ Thêm chương
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="sections-grid">
                {sections.map(section => (
                  <div 
                    key={section.id} 
                    className={`section-card ${selectedSection?.id === section.id ? 'selected' : ''}`}
                    onClick={() => handleSectionSelect(section)}
                  >
                    <div className="section-info">
                      <h3>{section.title}</h3>
                      <p>Thứ tự: {section.section_order}</p>
                    </div>
                    <div className="section-actions">
                      <button 
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSection(section);
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lessons Management */}
        {selectedSection && (
          <div className="section">
            <div className="section-header">
              <h2>3. Bài học của chương: {selectedSection.title}</h2>
              <button className="btn-primary" onClick={handleCreateLesson}>
                ➕ Thêm bài học
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="lessons-list">
                {lessons.map(lesson => (
                  <div key={lesson.id} className="lesson-card">
                    <div className="lesson-info">
                      <h3>{lesson.title}</h3>
                      <p>Thứ tự: {lesson.lessons_order}</p>
                      {lesson.video_url && (
                        <p className="video-url">📹 {lesson.video_url}</p>
                      )}
                      {lesson.content && (
                        <div className="lesson-content">
                          {lesson.content.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                    <div className="lesson-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditLesson(lesson)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingSection ? 'Sửa chương' : 'Thêm chương mới'}</h3>
            
            <div className="form-group">
              <label>Tên chương:</label>
              <input
                type="text"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({...sectionForm, title: e.target.value})}
                placeholder="Nhập tên chương..."
              />
            </div>

            <div className="form-group">
              <label>Thứ tự:</label>
              <input
                type="number"
                value={sectionForm.section_order}
                onChange={(e) => setSectionForm({...sectionForm, section_order: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSectionModal(false)}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleSaveSection}>
                {editingSection ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="modal-overlay">
          <div className="modal lesson-modal">
            <h3>{editingLesson ? 'Sửa bài học' : 'Thêm bài học mới'}</h3>
            
            <div className="form-group">
              <label>Tên bài học:</label>
              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                placeholder="Nhập tên bài học..."
              />
            </div>

            <div className="form-group">
              <label>Thứ tự:</label>
              <input
                type="number"
                value={lessonForm.lessons_order}
                onChange={(e) => setLessonForm({...lessonForm, lessons_order: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>URL Video (tùy chọn):</label>
              <input
                type="url"
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm({...lessonForm, video_url: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="form-group">
              <label>Nội dung bài học:</label>
              <textarea
                value={lessonForm.content}
                onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                placeholder="Nhập nội dung bài học..."
                rows="6"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLessonModal(false)}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleSaveLesson}>
                {editingLesson ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLessons;
