import React from 'react';
import './ClassCard.css';

export default function ClassCard({ classItem, user, onRegister, onEdit, onDelete }) {
  if (!classItem) {
    return <div>Không có dữ liệu lớp học</div>;
  }

  const isAdmin = user && user.roles && user.roles.some(r => r.toLowerCase() === 'admin');
  const isTeacher = user && user.roles && user.roles.some(r => r.toLowerCase() === 'teacher');
  const isStudent = user && user.roles && user.roles.some(r => r.toLowerCase() === 'student');
  const canManage = isAdmin || isTeacher;

  const handleRegister = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng ký lớp học');
      return;
    }
    if (onRegister) {
      onRegister(classItem.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(classItem);
    }
  };

  const handleDelete = () => {
    if (confirm(`Bạn có chắc muốn xóa lớp "${classItem.name}"?`)) {
      if (onDelete) {
        onDelete(classItem.id);
      }
    }
  };

  return (
    <div className="class-card">
      <div className="class-header">
        <h3 className="class-name">{classItem.name || 'Lớp học'}</h3>
        <div className="class-status">
          <span className={`status-badge ${classItem.current_count >= classItem.max_students ? 'full' : 'available'}`}>
            {classItem.current_count || 0}/{classItem.max_students || 0}
          </span>
        </div>
      </div>
      
      <div className="class-info">
        <div className="info-item">
          <span className="info-label">📅 Lịch học:</span>
          <span className="info-value">{classItem.schedule || 'Chưa có lịch'}</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">👥 Số học viên:</span>
          <span className="info-value">{classItem.current_count || 0} người</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">📚 Khóa học:</span>
          <span className="info-value">{classItem.course?.name || 'Chưa có khóa học'}</span>
        </div>
      </div>

      <div className="class-actions">
        {isStudent && (
          <button 
            className="register-btn"
            onClick={handleRegister}
            disabled={classItem.current_count >= classItem.max_students}
          >
            {classItem.current_count >= classItem.max_students ? 'Đã đầy' : 'Đăng ký'}
          </button>
        )}
        
        {canManage && (
          <div className="manage-buttons">
            <button className="edit-btn" onClick={handleEdit}>
              ✏️ Sửa
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              🗑️ Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 