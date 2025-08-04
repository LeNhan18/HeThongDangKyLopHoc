import React, { useState } from 'react';
import './css/ChangeScheduleModal.css';

// Component con cho một dòng chọn lịch
const ScheduleSlot = ({ slot, index, onUpdate, onRemove, daysOfWeek, canRemove }) => (
  <div className="schedule-slot">
    <div className="slot-controls">
      <select
        value={slot.day}
        onChange={(e) => onUpdate(index, 'day', e.target.value)}
        required
        className="day-select"
      >
        <option value="" disabled>Chọn thứ</option>
        {daysOfWeek.map(day => (
          <option key={day.value} value={day.value}>
            {day.label}
          </option>
        ))}
      </select>
      
      <input
        type="time"
        value={slot.start}
        onChange={(e) => onUpdate(index, 'start', e.target.value)}
        required
        className="time-input"
      />
      
      <span className="time-separator">-</span>
      
      <input
        type="time"
        value={slot.end}
        onChange={(e) => onUpdate(index, 'end', e.target.value)}
        required
        className="time-input"
      />
      
      {canRemove && (
        <button
          type="button"
          className="remove-slot-btn"
          onClick={() => onRemove(index)}
          title="Xóa khung thời gian này"
        >
          &times;
        </button>
      )}
    </div>
  </div>
);

// Component chính của Modal
const ChangeScheduleModal = ({ classItem, onClose, onSuccess }) => {
  // Khởi tạo scheduleSlots với một dòng trống
  const [scheduleSlots, setScheduleSlots] = useState([{ day: '', start: '', end: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ];

  // Thêm một dòng lịch học mới
  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', start: '', end: '' }]);
  };

  // Xóa một dòng lịch học
  const removeScheduleSlot = (index) => {
    // Chỉ cho phép xóa nếu có nhiều hơn 1 dòng
    if (scheduleSlots.length > 1) {
      setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
    }
  };

  // Cập nhật thông tin của một dòng lịch học
  const updateScheduleSlot = (index, field, value) => {
    const updatedSlots = [...scheduleSlots];
    updatedSlots[index][field] = value;
    setScheduleSlots(updatedSlots);
    if (error) setError(''); // Xóa lỗi khi người dùng thay đổi
  };

  // Xử lý khi gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Lọc ra các dòng hợp lệ (đã điền đủ thông tin)
    const validSlots = scheduleSlots.filter(slot => slot.day && slot.start && slot.end);

    if (validSlots.length === 0) {
      setError('Vui lòng thêm và điền đầy đủ ít nhất một khung thời gian học.');
      return;
    }

    // Kiểm tra logic thời gian
    for (const slot of validSlots) {
      if (slot.start >= slot.end) {
        setError(`Thời gian không hợp lệ: ${slot.start} - ${slot.end}. Giờ kết thúc phải sau giờ bắt đầu.`);
        return;
      }
    }

    // Chuẩn bị dữ liệu để gửi đi
    const scheduleData = validSlots.map(slot => {
      const dayLabel = daysOfWeek.find(d => d.value === slot.day)?.label || slot.day;
      return `${dayLabel}: ${slot.start} - ${slot.end}`;
    }).join('; ');

    setLoading(true);
    
    // --- GIẢ LẬP GỌI API ---
    try {
      // Thay thế phần này bằng logic gọi API thật của bạn
      console.log('Đang gửi dữ liệu:', { schedule: scheduleData });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Giả lập độ trễ mạng

      // const response = await fetch(...);
      // if (!response.ok) throw new Error('Lỗi từ server');
      // const result = await response.json();

      alert('Thay đổi lịch học thành công!');
      if (onSuccess) {
        onSuccess({ newSchedule: scheduleData }); // Gửi lịch mới về cho component cha
      }
      onClose();

    } catch (err) {
      console.error('Lỗi khi thay đổi lịch học:', err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Ngăn chặn việc click vào nội dung modal làm đóng modal
  const handleModalContentClick = (e) => e.stopPropagation();

  return (
    <div className="change-schedule-modal" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        <div className="modal-header">
          <h3>Thay đổi lịch học</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="class-info">
            <h4>{classItem?.name || 'Tên lớp học'}</h4>
            <p><strong>Lịch học hiện tại:</strong> {classItem?.schedule || 'Chưa có'}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="schedule-section">
              <label>Lịch học mới:</label>
              <p style={{ fontSize: '13px', color: '#666', margin: '-8px 0 16px 0' }}>
                * Sử dụng định dạng 24 giờ. Ví dụ: 09:00, 21:30.
              </p>
              
              {scheduleSlots.map((slot, index) => (
                <ScheduleSlot
                  key={index}
                  slot={slot}
                  index={index}
                  onUpdate={updateScheduleSlot}
                  onRemove={removeScheduleSlot}
                  daysOfWeek={daysOfWeek}
                  canRemove={scheduleSlots.length > 1}
                />
              ))}
              
              <button
                type="button"
                className="add-slot-btn"
                onClick={addScheduleSlot}
              >
                + Thêm khung lịch
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangeScheduleModal;
