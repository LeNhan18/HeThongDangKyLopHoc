import React, { useState, useEffect } from 'react';
import CourseClassStats from '../components/CourseClassStats';
import ClassStudentsList from '../components/ClassStudentsList';
import './css/CourseManagementPage.css';

const CourseManagementPage = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [newClass, setNewClass] = useState({
    name: '',
    max_students: 30,
    schedule: [],
    course_id: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, classesRes] = await Promise.all([
        fetch('http://localhost:8000/courses/'),
        fetch('http://localhost:8000/classes/')
      ]);
      
      const coursesData = await coursesRes.json();
      const classesData = await classesRes.json();
      
      setCourses(coursesData);
      // Normalize schedule: always array
      setClasses(classesData.map(cls => ({
        ...cls,
        schedule: Array.isArray(cls.schedule)
          ? cls.schedule
          : (typeof cls.schedule === 'string' && cls.schedule.trim().startsWith('['))
            ? JSON.parse(cls.schedule)
            : []
      })));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourse = async (classId, courseId) => {
    try {
      const response = await fetch(`http://localhost:8000/class/${classId}/assign_course/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchData();
        setShowAssignModal(false);
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.detail}`);
      }
    } catch (error) {
      console.error('Lỗi khi gán khóa học:', error);
      alert('Có lỗi xảy ra khi gán khóa học');
    }
  };

  const handleRemoveCourse = async (classId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Bạn có chắc muốn xóa khóa học khỏi lớp học này?')) return;

    try {
      const response = await fetch(`http://localhost:8000/class/${classId}/remove_course`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.detail}`);
      }
    } catch (error) {
      console.error('Lỗi khi xóa khóa học:', error);
      alert('Có lỗi xảy ra khi xóa khóa học');
    }
  };

  const handleCreateClass = async () => {
    try {
      const response = await fetch('http://localhost:8000/class/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(newClass)
      });

      if (response.ok) {
        await response.json();
        alert('Tạo lớp học thành công!');
        setNewClass({ name: '', max_students: 30, schedule: [], course_id: null });
        setShowCreateModal(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.detail}`);
      }
    } catch (error) {
      console.error('Lỗi khi tạo lớp học:', error);
      alert('Có lỗi xảy ra khi tạo lớp học');
    }
  };

  const handleViewStudents = (classId) => {
    setSelectedClassForStudents(classId);
    setShowStudentsModal(true);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Chưa gán';
  };

  if (loading) {
    return (
      <div className="course-management-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (showStats) {
    return (
      <div className="course-management-page">
        <div className="page-header">
          <h1>Thống Kê Khóa Học & Lớp Học</h1>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowStats(false)}
            >
              ← Quay Lại
            </button>
          </div>
        </div>
        <CourseClassStats />
      </div>
    );
  }

  return (
    <div className="course-management-page">
      <div className="page-header">
        <h1>Quản Lý Khóa Học và Lớp Học</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowStats(true)}
          >
            📊 Thống Kê
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Tạo Lớp Học Mới
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Danh sách khóa học */}
        <div className="section">
          <h2>Danh Sách Khóa Học</h2>
          <div className="courses-list">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-image">
                  <img src={course.image || '/default-course.jpg'} alt={course.name} />
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p>{course.description}</p>
                  <div className="course-stats">
                    <span>ID: {course.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách lớp học */}
        <div className="section">
          <h2>Danh Sách Lớp Học</h2>
          <div className="classes-list">
            {classes.map(cls => (
              <div key={cls.id} className="class-card">
                <div className="class-header">
                  <h3>{cls.name}</h3>
                  <div className="class-actions">
                    <button 
                      className="btn btn-small btn-info"
                      onClick={() => handleViewStudents(cls.id)}
                    >
                      👥 Thành Viên
                    </button>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => {
                        setSelectedClass(cls);
                        setShowAssignModal(true);
                      }}
                    >
                      Gán Khóa Học
                    </button>
                    {cls.course_id && (
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveCourse(cls.id)}
                      >
                        Xóa Khóa Học
                      </button>
                    )}
                  </div>
                </div>
                <div className="class-details">
                  <p><strong>Khóa học:</strong> {getCourseName(cls.course_id)}</p>
                  <p><strong>Lịch học:</strong> {Array.isArray(cls.schedule) && cls.schedule.length > 0
  ? cls.schedule.map(slot => `${slot.day}: ${slot.start} - ${slot.end}`).join(', ')
  : 'Chưa có lịch học'}</p>
                  <p><strong>Số học viên tối đa:</strong> {cls.max_students}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal gán khóa học */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Gán Khóa Học</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Chọn khóa học cho lớp: <strong>{selectedClass?.name}</strong></p>
              <div className="course-selection">
                {courses.map(course => (
                  <div 
                    key={course.id} 
                    className={`course-option ${selectedCourse?.id === course.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <h4>{course.name}</h4>
                    <p>{course.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (selectedCourse && selectedClass) {
                    handleAssignCourse(selectedClass.id, selectedCourse.id);
                  }
                }}
                disabled={!selectedCourse}
              >
                Gán Khóa Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo lớp học */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Tạo Lớp Học Mới</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên lớp học:</label>
                <input 
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="Nhập tên lớp học"
                />
              </div>
              <div className="form-group">
                <label>Số học viên tối đa:</label>
                <input 
                  type="number"
                  value={newClass.max_students}
                  onChange={(e) => setNewClass({...newClass, max_students: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Lịch học:</label>
                {Array.isArray(newClass.schedule) && newClass.schedule.length > 0 ? (
                  newClass.schedule.map((slot, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <select
                        value={slot.day}
                        onChange={e => {
                          const updated = [...newClass.schedule];
                          updated[idx].day = e.target.value;
                          setNewClass({ ...newClass, schedule: updated });
                        }}
                      >
                        <option value="">Chọn thứ</option>
                        <option value="Thứ 2">Thứ 2</option>
                        <option value="Thứ 3">Thứ 3</option>
                        <option value="Thứ 4">Thứ 4</option>
                        <option value="Thứ 5">Thứ 5</option>
                        <option value="Thứ 6">Thứ 6</option>
                        <option value="Thứ 7">Thứ 7</option>
                        <option value="Chủ nhật">Chủ nhật</option>
                      </select>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={e => {
                          const updated = [...newClass.schedule];
                          updated[idx].start = e.target.value;
                          setNewClass({ ...newClass, schedule: updated });
                        }}
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={e => {
                          const updated = [...newClass.schedule];
                          updated[idx].end = e.target.value;
                          setNewClass({ ...newClass, schedule: updated });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => {
                          const updated = newClass.schedule.filter((_, i) => i !== idx);
                          setNewClass({ ...newClass, schedule: updated });
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#888', marginBottom: 8 }}>Chưa có lịch học nào</div>
                )}
                <button
                  type="button"
                  className="btn btn-small btn-info"
                  onClick={() => {
                    const updated = Array.isArray(newClass.schedule) ? [...newClass.schedule] : [];
                    updated.push({ day: '', start: '', end: '' });
                    setNewClass({ ...newClass, schedule: updated });
                  }}
                >
                  + Thêm khung lịch
                </button>
              </div>
              <div className="form-group">
                <label>Khóa học (tùy chọn):</label>
                <select 
                  value={newClass.course_id || ''}
                  onChange={(e) => setNewClass({...newClass, course_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateClass}
                disabled={!newClass.name || !newClass.schedule}
              >
                Tạo Lớp Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem thành viên */}
      {showStudentsModal && selectedClassForStudents && (
        <ClassStudentsList 
          classId={selectedClassForStudents}
          onClose={() => {
            setShowStudentsModal(false);
            setSelectedClassForStudents(null);
          }}
        />
      )}
    </div>
  );
};

export default CourseManagementPage; 