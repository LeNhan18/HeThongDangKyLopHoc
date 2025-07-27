import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClassCard from './ClassCard';
import './ClassList.css';

export default function ClassList({ user, onRequireAuth }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClass, setEditingClass] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/classes/');
      
      // Lấy số lượng học viên cho từng lớp
      const classesWithCount = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const countResponse = await axios.get(`http://localhost:8000/class/${classItem.id}/count`);
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
  };

  const handleRegister = async (classId) => {
    if (!user) {
      onRequireAuth && onRequireAuth();
      return;
    }

    try {
      await axios.post(`http://localhost:8000/register_class/${classId}`);
      alert('Đăng ký thành công!');
      fetchClasses(); // Refresh danh sách
    } catch (error) {
      console.error('Error registering for class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi đăng ký');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
  };

  const handleDelete = async (classId) => {
    try {
      await axios.delete(`http://localhost:8000/class/${classId}`);
      alert('Xóa lớp học thành công!');
      fetchClasses(); // Refresh danh sách
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleAddClass = async (formData) => {
    try {
      await axios.post('http://localhost:8000/class/', formData);
      alert('Tạo lớp học thành công!');
      setAdding(false);
      fetchClasses(); // Refresh danh sách
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo lớp học');
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.schedule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditClassForm
              classItem={editingClass}
              onClose={() => setEditingClass(null)}
              onSuccess={() => {
                setEditingClass(null);
                fetchClasses();
              }}
            />
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {adding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditClassForm
              classItem={{ name: "", max_students: 30, schedule: "", course_id: null }}
              onClose={() => setAdding(false)}
              onSuccess={handleAddClass}
              isCreate={true}
            />
          </div>
        </div>
      )}
    </section>
  );
}

// Component form để thêm/sửa lớp học
function EditClassForm({ classItem, onClose, onSuccess, isCreate = false }) {
  const [form, setForm] = useState({
    name: classItem.name || '',
    max_students: classItem.max_students || 30,
    schedule: classItem.schedule || '',
    course_id: classItem.course_id || null
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const data = {
        name: form.name,
        max_students: form.max_students,
        schedule: form.schedule,
        course_id: form.course_id
      };

      if (isCreate) {
        await axios.post('http://localhost:8000/class/', data);
      } else {
        await axios.put(`http://localhost:8000/class/${classItem.id}`, data);
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
        <input
          type="text"
          value={form.schedule}
          onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          placeholder="VD: Thứ 2, 4, 6 - 19:00-21:00"
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        />
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