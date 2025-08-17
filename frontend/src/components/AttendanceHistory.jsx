import React, { useState, useEffect } from 'react';
import './css/AttendanceHistory.css';

const AttendanceHistory = ({ classId }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStudent, setSelectedStudent] = useState('all');

  // API calls thực tế
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students from API
        const studentsResponse = await fetch(`/api/classes/${classId}/students`, {
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

        // Fetch attendance history from API
        const historyResponse = await fetch(`/api/classes/${classId}/attendance/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!historyResponse.ok) {
          throw new Error('Failed to fetch attendance history');
        }
        
        const historyData = await historyResponse.json();
        setAttendanceHistory(historyData);

      } catch (err) {
        console.error('Error fetching attendance history:', err);
        // Fallback to mock data if API fails
        const mockStudents = [
          { id: 'ST001', name: 'Trần Văn B' },
          { id: 'ST002', name: 'Lê Thị C' },
          { id: 'ST003', name: 'Phạm Văn D' },
          { id: 'ST004', name: 'Hoàng Thị E' },
          { id: 'ST005', name: 'Nguyễn Văn F' },
        ];

        const mockHistory = [
          {
            id: 1,
            date: '2024-01-15',
            attendanceData: {
              'ST001': 'present',
              'ST002': 'present', 
              'ST003': 'absent',
              'ST004': 'late',
              'ST005': 'present'
            },
            notes: 'Buổi học về ngữ pháp cơ bản',
            instructor: 'Nguyễn Văn A'
          },
          {
            id: 2,
            date: '2024-01-17',
            attendanceData: {
              'ST001': 'present',
              'ST002': 'late',
              'ST003': 'present',
              'ST004': 'present',
              'ST005': 'absent'
            },
            notes: 'Luyện tập từ vựng và phát âm',
            instructor: 'Nguyễn Văn A'
          }
        ];
        
        setStudents(mockStudents);
        setAttendanceHistory(mockHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const getAttendanceStats = (studentId = null) => {
    const relevantHistory = attendanceHistory.filter(record => {
      const recordMonth = record.date.slice(0, 7);
      return recordMonth === selectedMonth;
    });

    if (!studentId) {
      // Overall stats
      let totalSessions = relevantHistory.length;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;

      relevantHistory.forEach(record => {
        Object.values(record.attendanceData).forEach(status => {
          if (status === 'present') totalPresent++;
          else if (status === 'absent') totalAbsent++;
          else if (status === 'late') totalLate++;
        });
      });

      return {
        totalSessions,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        attendanceRate: totalSessions > 0 ? ((totalPresent / (totalPresent + totalAbsent + totalLate)) * 100).toFixed(1) : 0
      };
    } else {
      // Individual student stats
      let present = 0;
      let absent = 0;
      let late = 0;

      relevantHistory.forEach(record => {
        const status = record.attendanceData[studentId];
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
      });

      const total = present + absent + late;
      return {
        totalSessions: relevantHistory.length,
        present,
        absent,
        late,
        attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0
      };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'late': return '⏰';
      default: return '-';
    }
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const filteredHistory = attendanceHistory.filter(record => {
    const recordMonth = record.date.slice(0, 7);
    return recordMonth === selectedMonth;
  });

  const stats = getAttendanceStats();

  if (loading) {
    return <div className="loading">Đang tải lịch sử điểm danh...</div>;
  }

  return (
    <div className="attendance-history">
      <div className="history-header">
        <h2>Lịch sử điểm danh</h2>
        
        <div className="history-controls">
          <div className="month-selector">
            <label htmlFor="month-select">Tháng:</label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          
          <div className="student-selector">
            <label htmlFor="student-select">Học viên:</label>
            <select
              id="student-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="all">Tất cả học viên</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalSessions}</div>
          <div className="stat-label">Buổi học</div>
        </div>
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
        <div className="stat-card rate">
          <div className="stat-number">{stats.attendanceRate}%</div>
          <div className="stat-label">Tỷ lệ tham gia</div>
        </div>
      </div>

      {selectedStudent === 'all' ? (
        // Show all students view
        <div className="history-content">
          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  {students.map(student => (
                    <th key={student.id}>{student.name}</th>
                  ))}
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(record => (
                  <tr key={record.id}>
                    <td className="date-cell">
                      {new Date(record.date).toLocaleDateString('vi-VN')}
                    </td>
                    {students.map(student => (
                      <td key={student.id} className="attendance-cell">
                        <span className={`status-indicator ${getStatusClass(record.attendanceData[student.id])}`}>
                          {getStatusIcon(record.attendanceData[student.id])}
                        </span>
                      </td>
                    ))}
                    <td className="notes-cell">{record.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Show individual student view
        <div className="student-detail-view">
          <div className="student-header">
            <h3>{students.find(s => s.id === selectedStudent)?.name}</h3>
            <div className="student-stats">
              {(() => {
                const studentStats = getAttendanceStats(selectedStudent);
                return (
                  <>
                    <span>Tỷ lệ tham gia: <strong>{studentStats.attendanceRate}%</strong></span>
                    <span>Có mặt: <strong>{studentStats.present}</strong></span>
                    <span>Vắng mặt: <strong>{studentStats.absent}</strong></span>
                    <span>Đi muộn: <strong>{studentStats.late}</strong></span>
                  </>
                );
              })()}
            </div>
          </div>
          
          <div className="student-attendance-list">
            {filteredHistory.map(record => (
              <div key={record.id} className="attendance-record">
                <div className="record-date">
                  {new Date(record.date).toLocaleDateString('vi-VN')}
                </div>
                <div className={`record-status ${getStatusClass(record.attendanceData[selectedStudent])}`}>
                  <span className="status-icon">
                    {getStatusIcon(record.attendanceData[selectedStudent])}
                  </span>
                  <span className="status-text">
                    {record.attendanceData[selectedStudent] === 'present' && 'Có mặt'}
                    {record.attendanceData[selectedStudent] === 'absent' && 'Vắng mặt'}
                    {record.attendanceData[selectedStudent] === 'late' && 'Đi muộn'}
                  </span>
                </div>
                <div className="record-notes">{record.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
