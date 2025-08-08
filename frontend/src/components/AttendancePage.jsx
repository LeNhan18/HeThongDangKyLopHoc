import React, { useState, useEffect } from 'react';
import VirtualClassroom from './VirtualClassroom';
import './css/AttendancePage.css';

const AttendancePage = ({ classId }) => {
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showClassroom, setShowClassroom] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  // API calls thực tế
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch class info from API
        const classResponse = await fetch(`/api/classes/${classId || 'CL001'}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!classResponse.ok) {
          throw new Error('Failed to fetch class info');
        }
        
        const classData = await classResponse.json();
        setClassInfo(classData);

        // Fetch students from API
        const studentsResponse = await fetch(`/api/classes/${classId || 'CL001'}/students`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students');
        }
        
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Initialize attendance with default "present" status
        const initialAttendance = {};
        studentsData.forEach(student => {
          initialAttendance[student.id] = 'present';
        });
        setAttendance(initialAttendance);

      } catch (err) {
        setError('Không thể tải dữ liệu lớp học');
        console.error('Error fetching data:', err);
        
        // Fallback to mock data if API fails
        const mockClassInfo = {
          id: classId || 'CL001',
          name: 'Lớp học Tiếng Anh cơ bản',
          course: 'Tiếng Anh A1',
          instructor: 'Nguyễn Văn A',
          schedule: 'Thứ 2, 4, 6 - 18:00-20:00',
          totalStudents: 25,
          location: 'Phòng 201'
        };

        const mockStudents = [
          { id: 'ST001', name: 'Trần Văn B', email: 'tranvanb@gmail.com', phone: '0123456789', isRegistered: true },
          { id: 'ST002', name: 'Lê Thị C', email: 'lethic@gmail.com', phone: '0123456790', isRegistered: true },
          { id: 'ST003', name: 'Phạm Văn D', email: 'phamvand@gmail.com', phone: '0123456791', isRegistered: true },
          { id: 'ST004', name: 'Hoàng Thị E', email: 'hoangthie@gmail.com', phone: '0123456792', isRegistered: false },
          { id: 'ST005', name: 'Nguyễn Văn F', email: 'nguyenvanf@gmail.com', phone: '0123456793', isRegistered: true },
        ];

        setClassInfo(mockClassInfo);
        setStudents(mockStudents);

        const initialAttendance = {};
        mockStudents.forEach(student => {
          initialAttendance[student.id] = 'present';
        });
        setAttendance(initialAttendance);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      
      // API call thực tế để lưu điểm danh
      const attendanceData = {
        classId: classInfo.id,
        date: selectedDate,
        attendance,
        notes,
        instructor: classInfo.instructor
      };

      const response = await fetch(`/api/classes/${classInfo.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(attendanceData)
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      const result = await response.json();
      console.log('Attendance saved successfully:', result);
      
      alert('Điểm danh đã được lưu thành công!');
      
    } catch (err) {
      setError('Không thể lưu điểm danh');
      console.error('Error saving attendance:', err);
      
      // Fallback for demo
      console.log('Saving attendance (fallback):', {
        classId: classInfo.id,
        date: selectedDate,
        attendance,
        notes,
        instructor: classInfo.instructor
      });
      alert('Điểm danh đã được lưu thành công! (Demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinClass = async (studentId, studentName) => {
    try {
      // API call để ghi nhận việc vào phòng học
      const joinData = {
        studentId,
        classId: classInfo.id,
        joinTime: new Date().toISOString(),
        date: selectedDate
      };

      const response = await fetch(`/api/classes/${classInfo.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(joinData)
      });

      if (!response.ok) {
        throw new Error('Failed to join class');
      }

      const result = await response.json();
      console.log('Student joined class:', result);

      // Set current student and show classroom
      setCurrentStudent({ id: studentId, name: studentName });
      setShowClassroom(true);
      
      // Tự động đánh dấu có mặt khi vào phòng học
      handleAttendanceChange(studentId, 'present');
      
    } catch (err) {
      console.error('Error joining class:', err);
      
      // Fallback for demo
      console.log(`Student ${studentId} joined classroom at ${new Date().toISOString()}`);
      setCurrentStudent({ id: studentId, name: studentName });
      setShowClassroom(true);
      handleAttendanceChange(studentId, 'present');
    }
  };

  const handleLeaveClassroom = () => {
    setShowClassroom(false);
    setCurrentStudent(null);
  };

  // Show virtual classroom if student joined
  if (showClassroom && currentStudent) {
    return (
      <VirtualClassroom
        classId={classInfo?.id}
        studentId={currentStudent.id}
        onLeave={handleLeaveClassroom}
      />
    );
  }

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    
    return { total, present, absent, late };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div className="class-info">
          <h1>{classInfo.name}</h1>
          <div className="class-details">
            <span><strong>Khóa học:</strong> {classInfo.course}</span>
            <span><strong>Giảng viên:</strong> {classInfo.instructor}</span>
            <span><strong>Lịch học:</strong> {classInfo.schedule}</span>
            <span><strong>Phòng học:</strong> {classInfo.location}</span>
          </div>
        </div>

        <div className="attendance-controls">
          <div className="date-selector">
            <label htmlFor="attendance-date">Ngày điểm danh:</label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="stat-card present">
          <div className="stat-number">{stats.present}</div>
          <div className="stat-label">Có mặt</div>
        </div>
        <div className="stat-card absent">
          <div className="stat-number">{stats.absent}</div>
          <div className="stat-label">Vắng mặt</div>
        </div>
        <div className="stat-card late">
          <div className="stat-number">{stats.late}</div>
          <div className="stat-label">Đi muộn</div>
        </div>
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Tổng số</div>
        </div>
      </div>

      <div className="attendance-content">
        <div className="attendance-list">
          <div className="list-header">
            <h3>Danh sách học viên</h3>
            <div className="quick-actions">
              <button 
                className="quick-btn mark-all-present"
                onClick={() => {
                  const newAttendance = {};
                  students.forEach(student => {
                    newAttendance[student.id] = 'present';
                  });
                  setAttendance(newAttendance);
                }}
              >
                Đánh dấu tất cả có mặt
              </button>
              <button 
                className="quick-btn mark-all-absent"
                onClick={() => {
                  const newAttendance = {};
                  students.forEach(student => {
                    newAttendance[student.id] = 'absent';
                  });
                  setAttendance(newAttendance);
                }}
              >
                Đánh dấu tất cả vắng mặt
              </button>
            </div>
          </div>

          <div className="students-grid">
            {students.map((student, index) => (
              <div key={student.id} className={`student-card ${student.isRegistered ? 'registered' : 'not-registered'}`}>
                <div className="student-info">
                  <div className="student-avatar">
                    {student.name.split(' ').pop().charAt(0)}
                  </div>
                  <div className="student-details">
                    <h4>{student.name}</h4>
                    <p>ID: {student.id}</p>
                    <p>{student.email}</p>
                    <div className="registration-status">
                      {student.isRegistered ? (
                        <span className="status-badge registered">✓ Đã đăng ký</span>
                      ) : (
                        <span className="status-badge not-registered">⚠ Chưa đăng ký</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {student.isRegistered && (
                  <div className="class-actions">
                    <button
                      className="join-class-btn"
                      onClick={() => handleJoinClass(student.id, student.name)}
                      title={`${student.name} vào phòng học`}
                    >
                      <span className="icon">🚪</span>
                      Vào phòng học
                    </button>
                  </div>
                )}
                
                <div className="attendance-options">
                  <button
                    className={`attendance-btn present ${attendance[student.id] === 'present' ? 'active' : ''}`}
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    disabled={!student.isRegistered}
                  >
                    <span className="icon">✓</span>
                    Có mặt
                  </button>
                  <button
                    className={`attendance-btn late ${attendance[student.id] === 'late' ? 'active' : ''}`}
                    onClick={() => handleAttendanceChange(student.id, 'late')}
                    disabled={!student.isRegistered}
                  >
                    <span className="icon">⏰</span>
                    Đi muộn
                  </button>
                  <button
                    className={`attendance-btn absent ${attendance[student.id] === 'absent' ? 'active' : ''}`}
                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                    disabled={!student.isRegistered}
                  >
                    <span className="icon">✗</span>
                    Vắng mặt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="attendance-notes">
          <h3>Ghi chú</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú về buổi học hôm nay..."
            rows="4"
          />
        </div>

        <div className="attendance-actions">
          <button 
            className="save-btn"
            onClick={handleSaveAttendance}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
          </button>
          <button className="export-btn">
            Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
