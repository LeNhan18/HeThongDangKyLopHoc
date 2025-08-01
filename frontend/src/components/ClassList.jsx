import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ClassCard from './ClassCard';
import ChangeScheduleModal from './ChangeScheduleModal';
import './css/ClassList.css';
import './css/ChangeScheduleModal.css';

export default function ClassList({ user, onRequireAuth }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClass, setEditingClass] = useState(null);
  const [adding, setAdding] = useState(false);
  const [changingScheduleClass, setChangingScheduleClass] = useState(null);

  // Sử dụng useCallback để đảm bảo hàm fetchClasses không bị tạo lại mỗi lần render
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      // SỬA LẠI: Sử dụng withCredentials cho xác thực bằng Cookie
      const response = await axios.get('http://localhost:8000/classes/', { withCredentials: true });

      const classesWithCount = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const countResponse = await axios.get(`http://localhost:8000/class/${classItem.id}/count`, { withCredentials: true });
            return {
              ...classItem,
              current_count: countResponse.data.current_count
            };
          } catch (error) {
            console.error(`Error fetching count for class ${classItem.id}:`, error);
            return {
              ...classItem,
              current_count: 0
            };
          }
        })
      );

      setClasses(classesWithCount);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Bỏ user.token khỏi dependency array

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);


  const handleRegister = async (classId) => {
    if (!user) {
      onRequireAuth && onRequireAuth();
      return;
    }

    try {
      // SỬA LẠI: Sử dụng withCredentials thay vì gửi token
      await axios.post(`http://localhost:8000/register_class/${classId}`, {}, { withCredentials: true });
      alert('Đăng ký thành công!');
      fetchClasses(); // Tải lại danh sách để cập nhật
    } catch (error) {
      console.error('Error registering for class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi đăng ký');
    }
  };

  const handleUnregister = async (classId) => {
    if (!user) {
      alert('Vui lòng đăng nhập để hủy đăng ký');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn hủy đăng ký lớp này?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/unregister_class/${classId}`, { withCredentials: true });
      alert('Hủy đăng ký thành công!');
      fetchClasses(); // Tải lại danh sách để cập nhật
    } catch (error) {
      console.error('Error unregistering from class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi hủy đăng ký');
    }
  };

  const handleDelete = async (classId) => {
    try {
      // SỬA LẠI: Sử dụng withCredentials
      await axios.delete(`http://localhost:8000/class/${classId}`, { withCredentials: true });
      alert('Xóa lớp học thành công!');
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleChangeSchedule = (classItem) => {
    setChangingScheduleClass(classItem);
  };

  const handleAddClass = async (formData) => {
    try {
      // SỬA LẠI: Sử dụng withCredentials
      await axios.post('http://localhost:8000/class/', formData, { withCredentials: true });
      alert('Tạo lớp học thành công!');
      setAdding(false);
      fetchClasses();
    } catch (error)
    {
      console.error('Error creating class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo lớp học');
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof classItem.schedule === 'string' && classItem.schedule.toLowerCase().includes(searchTerm.toLowerCase())) ||
    classItem.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = user && user.roles && (
    user.roles.some(r => r.toLowerCase() === 'admin') ||
    user.roles.some(r => r.toLowerCase() === 'teacher')
  );

  if (loading) {
    return <div className="class-list-loading">Đang tải danh sách lớp học...</div>;
  }


  return (
    <section className="class-list">
      <div className="class-list-header">
        <h2>Danh sách lớp học</h2>
        <div className="class-search">
          <input
            type="text"
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {canManage && (
            <button className="add-class-btn" onClick={() => setAdding(true)}>
              <span style={{fontSize:'1.3em',marginRight:4}}>➕</span> Thêm lớp học
            </button>
          )}
        </div>
      </div>

      <div className="class-cards">
        {filteredClasses.length === 0 ? (
          <div className="no-classes">
            {searchTerm ? 'Không tìm thấy lớp học nào phù hợp.' : 'Chưa có lớp học nào.'}
          </div>
        ) : (
          filteredClasses.map(classItem => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              user={user}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              onEdit={setEditingClass}
              onDelete={handleDelete}
              onChangeSchedule={handleChangeSchedule}
            />
          ))
        )}
      </div>

      {editingClass && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditClassForm
              classItem={editingClass}
              user={user}
              onClose={() => setEditingClass(null)}
              onSuccess={() => {
                setEditingClass(null);
                fetchClasses();
              }}
            />
          </div>
        </div>
      )}

      {adding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditClassForm
              classItem={{ name: "", max_students: 30, schedule: "", course_id: null }}
              user={user}
              onClose={() => setAdding(false)}
              onSuccess={handleAddClass}
              isCreate={true}
            />
          </div>
        </div>
      )}

      {changingScheduleClass && (
        <ChangeScheduleModal
          classItem={changingScheduleClass}
          onClose={() => setChangingScheduleClass(null)}
          onSuccess={() => {
            setChangingScheduleClass(null);
            fetchClasses(); // Reload class list to show updated schedule
          }}
        />
      )}
    </section>
  );
}

function EditClassForm({ classItem, onClose, onSuccess, isCreate = false, user }) {
  const [form, setForm] = useState({
    name: classItem.name || '',
    max_students: classItem.max_students || 30,
    course_id: classItem.course_id || null
  });
  const [scheduleSlots, setScheduleSlots] = useState([
    { day: '', start: '', end: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

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

  const formatScheduleForAPI = () => {
    return scheduleSlots
      .filter(slot => slot.day && slot.start && slot.end)
      .map(slot => {
        const dayLabel = daysOfWeek.find(d => d.value === slot.day)?.label || slot.day;
        return `${dayLabel}: ${slot.start} - ${slot.end}`;
      })
      .join('; ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const validSlots = scheduleSlots.filter(slot => slot.day && slot.start && slot.end);
    
    // Validate schedule slots
    if (validSlots.length === 0) {
      setMsg('Vui lòng thêm ít nhất một khung thời gian học');
      setLoading(false);
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
        setMsg(`Thời gian không hợp lệ: ${slot.start} - ${slot.end}. Vui lòng kiểm tra lại giờ bắt đầu và kết thúc.`);
        setLoading(false);
        return;
      }
    }

    const scheduleString = formatScheduleForAPI();

    try {
      const data = {
        name: form.name,
        max_students: form.max_students,
        schedule: scheduleString,
        course_id: form.course_id
      };

      if (isCreate) {
        // SỬA LẠI: Sử dụng withCredentials
        await axios.post('http://localhost:8000/class/', data, { withCredentials: true });
      } else {
        // SỬA LẠI: Sử dụng withCredentials
        await axios.put(`http://localhost:8000/class/${classItem.id}`, data, { withCredentials: true });
      }

      setMsg(isCreate ? 'Tạo mới thành công!' : 'Cập nhật thành công!');
      onSuccess && onSuccess(data);
    } catch (error) {
      console.error('Error saving class:', error);
      setMsg(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 320 }}>
      <h3>{isCreate ? 'Thêm lớp học' : 'Sửa lớp học'}</h3>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
          Tên lớp học:
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
          Số học viên tối đa:
        </label>
        <input
          type="number"
          value={form.max_students}
          onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) })}
          required
          min="1"
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
          Lịch học:
        </label>
        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 12px 0' }}>
          * Sử dụng định dạng 24 giờ (VD: 09:00, 14:30, 19:00). Hỗ trợ lớp qua đêm.
        </p>
        
        {scheduleSlots.map((slot, index) => (
          <div key={index} style={{ 
            marginBottom: 12, 
            padding: 12, 
            border: '1px solid #ddd', 
            borderRadius: 6,
            background: '#f9f9f9'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={slot.day}
                onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd', minWidth: 100 }}
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
                style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd' }}
              />
              
              <span>-</span>
              
              <input
                type="time"
                value={slot.end}
                onChange={(e) => updateScheduleSlot(index, 'end', e.target.value)}
                style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd' }}
              />
              
              {scheduleSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScheduleSlot(index)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addScheduleSlot}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          + Thêm khung lịch
        </button>
      </div>

      {msg && (
        <div style={{
          padding: 8,
          marginBottom: 16,
          borderRadius: 4,
          backgroundColor: msg.includes('thành công') ? '#d4edda' : '#f8d7da',
          color: msg.includes('thành công') ? '#155724' : '#721c24'
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Đang xử lý...' : (isCreate ? 'Tạo mới' : 'Lưu')}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
