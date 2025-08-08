import React, { useState, useEffect } from 'react';
import VirtualClassroom from '../components/VirtualClassroom';
import { classAPI, handleAPIError, AttendanceWebSocket } from '../services/attendanceAPI';
import './css/AttendancePage.css';

const AttendancePage = ({ classId }) => {
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVirtualClassroom, setShowVirtualClassroom] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);

  // Mock data fallback
  const mockClassInfo = {
    id: classId || '1',
    name: 'Lập trình Python cơ bản',
    instructor: 'Nguyễn Văn A',
    schedule: 'Thứ 2, 4, 6 - 19:00-21:00',
    room: 'Phòng 101'
  };

  const mockStudents = [
    { id: '1', name: 'Trần Văn B', email: 'tranvanb@email.com', status: 'registered' },
    { id: '2', name: 'Lê Thị C', email: 'lethic@email.com', status: 'registered' },
    { id: '3', name: 'Phạm Văn D', email: 'phamvand@email.com', status: 'registered' },
    { id: '4', name: 'Hoàng Thị E', email: 'hoangthie@email.com', status: 'registered' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Lấy thông tin lớp học
        const classData = await classAPI.getClassInfo(classId);
        setClassInfo(classData);

        // Lấy danh sách học viên
        const studentsData = await classAPI.getClassStudents(classId);
        setStudents(studentsData);

        // Khởi tạo attendance object
        const initialAttendance = {};
        studentsData.forEach(student => {
          initialAttendance[student.id] = 'absent';
        });
        setAttendance(initialAttendance);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(handleAPIError(err));
        
        // Fallback to mock data
        setClassInfo(mockClassInfo);
        setStudents(mockStudents);
        const initialAttendance = {};
        mockStudents.forEach(student => {
          initialAttendance[student.id] = 'absent';
        });
        setAttendance(initialAttendance);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup WebSocket for real-time updates
    if (classId) {
      const ws = new AttendanceWebSocket(classId, (data) => {
        if (data.type === 'attendance_update') {
          setAttendance(prev => ({
            ...prev,
            [data.studentId]: data.status
          }));
        } else if (data.type === 'student_joined') {
          console.log(`${data.studentName} đã tham gia lớp học`);
        }
      });
      
      ws.connect();
      setWsConnection(ws);

      return () => {
        ws.disconnect();
      };
    }
  }, [classId]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));

    // Send real-time update via WebSocket
    if (wsConnection) {
      wsConnection.sendMessage({
        type: 'attendance_update',
        studentId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const attendanceData = {
        date: new Date().toISOString().split('T')[0],
        attendance: Object.entries(attendance).map(([studentId, status]) => ({
          studentId,
          status
        }))
      };

      await classAPI.saveAttendance(classId, attendanceData);
      alert('Điểm danh đã được lưu thành công!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert(handleAPIError(err));
    }
  };

  const handleJoinClass = async (studentId) => {
    try {
      const joinData = {
        studentId,
        joinTime: new Date().toISOString(),
        device: navigator.userAgent
      };

      await classAPI.joinClass(classId, joinData);
      setShowVirtualClassroom(true);
    } catch (err) {
      console.error('Error joining class:', err);
      alert(handleAPIError(err));
      // Fallback: still allow joining even if API fails
      setShowVirtualClassroom(true);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;

    return { total, present, late, absent };
  };

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (showVirtualClassroom) {
    return (
      <VirtualClassroom 
        classInfo={classInfo}
        onLeave={() => setShowVirtualClassroom(false)}
      />
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div className="class-info">
          <h1>{classInfo?.name}</h1>
          <div className="class-details">
            <span>📚 Giảng viên: {classInfo?.instructor}</span>
            <span>📅 Lịch học: {classInfo?.schedule}</span>
            <span>🏫 Phòng: {classInfo?.room}</span>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="attendance-stats">
          <div className="stat-item present">
            <span className="stat-number">{stats.present}</span>
            <span className="stat-label">Có mặt</span>
          </div>
          <div className="stat-item late">
            <span className="stat-number">{stats.late}</span>
            <span className="stat-label">Muộn</span>
          </div>
          <div className="stat-item absent">
            <span className="stat-number">{stats.absent}</span>
            <span className="stat-label">Vắng</span>
          </div>
          <div className="stat-item total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Tổng số</span>
          </div>
        </div>
      </div>

      <div className="attendance-controls">
        <button 
          className="btn-join-classroom"
          onClick={() => setShowVirtualClassroom(true)}
        >
          🎥 Vào phòng học
        </button>
        <button 
          className="btn-save-attendance"
          onClick={handleSaveAttendance}
        >
          💾 Lưu điểm danh
        </button>
      </div>

      <div className="students-list">
        <div className="list-header">
          <span>Danh sách học viên</span>
          <span>Trạng thái điểm danh</span>
        </div>
        
        {students.map((student) => (
          <div key={student.id} className="student-item">
            <div className="student-info">
              <div className="student-avatar">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="student-details">
                <h3>{student.name}</h3>
                <p>{student.email}</p>
              </div>
              {student.status === 'registered' && (
                <button 
                  className="btn-join-class"
                  onClick={() => handleJoinClass(student.id)}
                >
                  Vào lớp
                </button>
              )}
            </div>
            
            <div className="attendance-options">
              <label className="attendance-option">
                <input
                  type="radio"
                  name={`attendance-${student.id}`}
                  value="present"
                  checked={attendance[student.id] === 'present'}
                  onChange={() => handleAttendanceChange(student.id, 'present')}
                />
                <span className="option-label present">Có mặt</span>
              </label>
              
              <label className="attendance-option">
                <input
                  type="radio"
                  name={`attendance-${student.id}`}
                  value="late"
                  checked={attendance[student.id] === 'late'}
                  onChange={() => handleAttendanceChange(student.id, 'late')}
                />
                <span className="option-label late">Muộn</span>
              </label>
              
              <label className="attendance-option">
                <input
                  type="radio"
                  name={`attendance-${student.id}`}
                  value="absent"
                  checked={attendance[student.id] === 'absent'}
                  onChange={() => handleAttendanceChange(student.id, 'absent')}
                />
                <span className="option-label absent">Vắng</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendancePage;
