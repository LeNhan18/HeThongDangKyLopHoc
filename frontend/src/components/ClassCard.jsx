import React from 'react';
import './css/ClassCard.css';

export default function ClassCard({
  classItem,
  user,
  onRegister,
  onUnregister,
  onEdit,
  onDelete,
  onChangeSchedule
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
    if (!schedule) {
      return 'Chưa có lịch';
    }

    // Nếu schedule là string
    if (typeof schedule === 'string') {
      try {
        // Thử parse JSON nếu có thể
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed)) {
          return parsed
            .map(slot => `${slot.day}: ${slot.start} - ${slot.end}`)
            .join('; ');
        }
      } catch (error) {
        // Nếu không parse được, trả về string gốc
        return schedule;
      }
      return schedule;
    }

    // Nếu schedule là array
    if (Array.isArray(schedule)) {
      if (schedule.length === 0) {
        return 'Chưa có lịch';
      }
      return schedule
        .map(slot => {
          if (typeof slot === 'object' && slot.day && slot.start && slot.end) {
            return `${slot.day}: ${slot.start} - ${slot.end}`;
          }
          return String(slot);
        })
        .join('; ');
    }

    // Nếu schedule là object đơn lẻ
    if (typeof schedule === 'object' && schedule.day && schedule.start && schedule.end) {
      return `${schedule.day}: ${schedule.start} - ${schedule.end}`;
    }

    // Fallback: convert về string
    return String(schedule);
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

  const handleChangeSchedule = () => {
    if (onChangeSchedule) {
      onChangeSchedule(classItem);
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
            {typeof classItem.course === 'string' 
              ? classItem.course 
              : classItem.course?.name || 'Chưa có khóa học'}
          </span>
        </div>
      </div>

      <div className="class-actions">
        {isStudent && (
            classItem.is_registered ? (
                <div className="student-actions">
                  <button
                      className="join-btn"
                      onClick={() => {
                        // TODO: Có thể thêm logic kiểm tra thời gian lớp học ở đây
                        // Hiện tại cho phép vào lớp bất cứ lúc nào
                        window.open(`/class/${classItem.id}/room`, '_blank');
                      }}
                  >
                    🚪 Vào lớp
                  </button>
                  <button
                      className="unregister-btn"
                      onClick={() => onUnregister && onUnregister(classItem.id)}
                  >
                    Hủy đăng ký
                  </button>
                </div>
            ) : (
                <button
                    className="register-btn"
                    onClick={() => onRegister(classItem.id)}
                    disabled={classItem.current_count >= classItem.max_students}
                >
                  {classItem.current_count >= classItem.max_students ? 'Đã đầy' : 'Đăng ký'}
                </button>
            )
        )}

        {canManage && (
            <div className="manage-buttons">
              <button
                  className="join-btn teacher-join"
                  onClick={() => {
                    window.open(`/class/${classItem.id}/room`, '_blank');
                  }}
              >
                🏫 Vào lớp dạy
              </button>
              <button className="edit-btn" onClick={handleEdit}>✏️ Sửa</button>
              <button className="schedule-btn" onClick={handleChangeSchedule}>📅 Đổi lịch</button>
              <button className="delete-btn" onClick={handleDelete}>🗑️ Xóa</button>
            </div>
        )}
      </div>
    </div>
  );
}
