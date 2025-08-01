import React from 'react';
import './css/ClassCard.css';

export default function ClassCard({
  classItem,
  user,
  onRegister,
  onUnregister,
  onEdit,
  onDelete
}) {
  if (!classItem) {
    return <div>Không có dữ liệu lớp học</div>;
  }

  const isAdmin =
    user && user.roles && user.roles.some(r => r.toLowerCase() === 'admin');
  const isTeacher =
    user && user.roles && user.roles.some(r => r.toLowerCase() === 'teacher');
  const isStudent =
    user && user.roles && user.roles.some(r => r.toLowerCase() === 'student');
  const canManage = isAdmin || isTeacher;

  // --- Hàm định dạng lịch học ---
  const formatSchedule = schedule => {
    if (!schedule || schedule.length === 0) {
      return 'Chưa có lịch';
    }

    let scheduleArray = [];
    if (typeof schedule === 'string') {
      try {
        scheduleArray = JSON.parse(schedule);
      } catch (error) {
        return schedule; // nếu không parse được thì trả về chuỗi gốc
      }
    } else if (Array.isArray(schedule)) {
      scheduleArray = schedule;
    } else if (schedule.day && schedule.start && schedule.end) {
      return `${schedule.day}: ${schedule.start} - ${schedule.end}`;
    } else {
      return 'Định dạng lịch không hợp lệ';
    }

    if (Array.isArray(scheduleArray)) {
      return scheduleArray
        .map(slot => `${slot.day}: ${slot.start} - ${slot.end}`)
        .join('; ');
    }

    return String(schedule);
  };

  const handleRegister = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng ký lớp học');
      return;
    }
    if (onRegister) {
      onRegister(classItem.id);
    }
  };

  const handleUnregister = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để hủy đăng ký');
      return;
    }
    if (onUnregister) {
      onUnregister(classItem.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(classItem);
    }
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-restricted-globals
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
          <span
            className={`status-badge ${
              classItem.current_count >= classItem.max_students
                ? 'full'
                : 'available'
            }`}
          >
            {classItem.current_count || 0}/{classItem.max_students || 0}
          </span>
        </div>
      </div>

      <div className="class-info">
        <div className="info-item">
          <span className="info-label">📅 Lịch học:</span>
          <span className="info-value">{formatSchedule(classItem.schedule)}</span>
        </div>

        <div className="info-item">
          <span className="info-label">👥 Số học viên:</span>
          <span className="info-value">
            {classItem.current_count || 0} người
          </span>
        </div>

        <div className="info-item">
          <span className="info-label">📚 Khóa học:</span>
          <span className="info-value">
            {classItem.course?.name || 'Chưa có khóa học'}
          </span>
        </div>
      </div>

      <div className="class-actions">
        {isStudent && (
          <>
            {classItem.is_registered ? (
              <button className="cancel-btn" onClick={handleUnregister}>
                Hủy đăng ký
              </button>
            ) : (
              <button
                className="register-btn"
                onClick={handleRegister}
                disabled={
                  classItem.current_count >= classItem.max_students
                }
              >
                {classItem.current_count >= classItem.max_students
                  ? 'Đã đầy'
                  : 'Đăng ký'}
              </button>
            )}
          </>
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
