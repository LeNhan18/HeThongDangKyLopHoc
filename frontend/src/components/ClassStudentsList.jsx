import React, { useState, useCallback, useEffect } from 'react';
import './css/ClassStudentsList.css';

const ClassStudentsList = ({ classId, onClose, onUnregister, onRegister }) => {
  const [studentsData, setStudentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/class/${classId}/students`);
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu học viên');
      }
      
      const data = await response.json();
      setStudentsData(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách học viên:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Tự động fetch dữ liệu khi component được mount
  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  if (loading) {
    return (
      <div className="class-students-modal">
        <div className="modal-overlay">
          <div className="modal">
            <div className="loading">Đang tải danh sách học viên...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-students-modal">
        <div className="modal-overlay">
          <div className="modal">
            <div className="error-message">
              <h3> Lỗi</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={fetchStudentsData}>
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="class-students-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Danh Sách Thành Viên</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            {studentsData && (
              <>
                <div className="class-info">
                  <h3>{studentsData.class.name}</h3>
                  <div className="class-stats">
                    <div className="stat-item">
                      <span className="stat-label">Tổng học viên:</span>
                      <span className="stat-value">{studentsData.total_students}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Sức chứa tối đa:</span>
                      <span className="stat-value">{studentsData.class.max_students}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Chỗ trống:</span>
                      <span className="stat-value available">{studentsData.available_slots}</span>
                    </div>
                  </div>
                  
                  <div className="occupancy-bar">
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(studentsData.total_students / studentsData.class.max_students) * 100}%`,
                          backgroundColor: studentsData.total_students >= studentsData.class.max_students ? '#ff6b6b' : '#4CAF50'
                        }}
                      ></div>
                    </div>
                    <span className="occupancy-text">
                      {Math.round((studentsData.total_students / studentsData.class.max_students) * 100)}% đầy
                    </span>
                  </div>
                </div>
                
                <div className="students-section">
                  <h4>Danh Sách Học Viên ({studentsData.students.length})</h4>
                  
                  {studentsData.students.length === 0 ? (
                    <div className="no-students">
                      <div className="no-students-icon">👥</div>
                      <p>Chưa có học viên nào đăng ký lớp này</p>
                    </div>
                  ) : (
                    <div className="students-list">
                      {studentsData.students.map((student, index) => (
                        <div key={student.id} className="student-item">
                          <div className="student-avatar">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="student-info">
                            <h5>{student.name || 'Chưa có tên'}</h5>
                            <p className="student-email">{student.email}</p>
                            {student.registration_date && (
                              <p className="registration-date">
                                Đăng ký: {new Date(student.registration_date).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                          <div className="student-number">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button className="btn btn-primary" onClick={fetchStudentsData}>
               Làm mới
            </button>
            {studentsData && studentsData.class && (
              studentsData.class.is_registered ? (
                <button className="btn btn-danger" onClick={() => onUnregister && onUnregister(studentsData.class.id)}>
                  Hủy đăng ký
                </button>
              ) : (
                <button className="btn btn-success" onClick={() => onRegister && onRegister(studentsData.class.id)}>
                  Đăng ký
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassStudentsList; 