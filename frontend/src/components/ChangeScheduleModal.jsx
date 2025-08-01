import React, { useState } from 'react';
import './css/ChangeScheduleModal.css';

const ChangeScheduleModal = ({ classItem, onClose, onSuccess }) => {
  const [scheduleSlots, setScheduleSlots] = useState([
    { day: '', start: '', end: '' }
  ]);
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

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', start: '', end: '' }]);
  };

  const removeScheduleSlot = (index) => {
    if (scheduleSlots.length > 1) {
      setScheduleSlots(scheduleSlots.filter((_, i) => i !== index));
    }
  };

  const updateScheduleSlot = (index, field, value) => {
    const updated = [...scheduleSlots];
    updated[index][field] = value;
    setScheduleSlots(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validSlots = scheduleSlots.filter(slot => slot.day && slot.start && slot.end);
    
    if (validSlots.length === 0) {
      setError('Vui lòng thêm ít nhất một khung thời gian học');
      return;
    }

    // Validate time logic
    for (let slot of validSlots) {
      const startTime = slot.start.split(':');
      const endTime = slot.end.split(':');
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      
      if (startMinutes >= endMinutes) {
        // Kiểm tra nếu là lớp học qua đêm (ví dụ: 23:00 - 01:00)
        if (endMinutes < 12 * 60 && startMinutes > 18 * 60) {
          // Cho phép lớp học qua đêm (từ 18h tối đến 12h trưa hôm sau)
          continue;
        }
        setError(`Thời gian không hợp lệ: ${slot.start} - ${slot.end}. Vui lòng kiểm tra lại giờ bắt đầu và kết thúc.`);
        return;
      }
    }

    // Chuẩn bị dữ liệu để gửi lên server
    const scheduleData = validSlots.map(slot => {
      const dayLabel = daysOfWeek.find(d => d.value === slot.day)?.label || slot.day;
      return {
        day: dayLabel,
        start: slot.start,
        end: slot.end
      };
    });

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/class/${classItem.id}/change_schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          schedule: scheduleData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Có lỗi xảy ra khi thay đổi lịch học');
      }

      const result = await response.json();
      
      alert('Thay đổi lịch học thành công! Đã gửi thông báo cho tất cả học viên.');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (error) {
      console.error('Error changing schedule:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-schedule-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Thay đổi lịch học</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="class-info">
              <h4>{classItem?.name}</h4>
              <p><strong>Lịch học hiện tại:</strong> {classItem?.schedule}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="schedule-section">
                <label>Lịch học mới:</label>
                <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 12px 0' }}>
                  * Sử dụng định dạng 24 giờ (VD: 09:00, 14:30, 19:00). Hỗ trợ lớp qua đêm.
                </p>
                
                {scheduleSlots.map((slot, index) => (
                  <div key={index} className="schedule-slot">
                    <div className="slot-controls">
                      <select
                        value={slot.day}
                        onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                        required
                      >
                        <option value="">Chọn thứ</option>
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateScheduleSlot(index, 'start', e.target.value)}
                        required
                      />
                      
                      <span className="time-separator">-</span>
                      
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateScheduleSlot(index, 'end', e.target.value)}
                        required
                      />
                      
                      {scheduleSlots.length > 1 && (
                        <button
                          type="button"
                          className="remove-slot-btn"
                          onClick={() => removeScheduleSlot(index)}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
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
                  {loading ? 'Đang xử lý...' : 'Thay đổi lịch học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeScheduleModal;
