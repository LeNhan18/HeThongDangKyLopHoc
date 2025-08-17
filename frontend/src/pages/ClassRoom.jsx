import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ClassRoom.css';

const ClassRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('pending');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [attendanceSessionActive, setAttendanceSessionActive] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch current user info
    const fetchUserInfo = async () => {
      try {
        console.log('🔍 DEBUG: Fetching user info...');
        const response = await fetch('http://localhost:8000/api/user/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          console.log('🔍 DEBUG: User data received:', userData);
          setCurrentUser(userData);
        } else {
          console.error('🔍 DEBUG: Failed to fetch user:', response.status, await response.text());
        }
      } catch (error) {
        console.error('🔍 DEBUG: Error fetching user info:', error);
      }
    };

    // Fetch class information
    const fetchClassInfo = async () => {
      try {
        console.log('🔍 DEBUG: Fetching class info...');
        const response = await fetch(`http://localhost:8000/class/${classId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 DEBUG: Class data received:', data);
          setClassInfo(data);
        } else {
          throw new Error('Không thể tải thông tin lớp học');
        }
      } catch (error) {
        console.error('Error fetching class info:', error);
        alert('Lỗi khi tải thông tin lớp học');
        navigate('/');
      }
    };

    fetchUserInfo();
    fetchClassInfo();
  }, [classId, navigate]);

  useEffect(() => {
    // Connect to WebSocket for real-time features
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(`ws://localhost:8000/ws/attendance/${classId}`);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          // Send join message
          wsRef.current.send(JSON.stringify({
            type: 'join',
            timestamp: new Date().toISOString()
          }));
        };

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('🔍 DEBUG: WebSocket message received:', data);
          
          switch (data.type) {
            case 'attendance_update':
              setAttendanceStatus(data.status);
              break;
            case 'attendance_session_started':
              console.log('🔍 DEBUG: Attendance session started by admin');
              setAttendanceSessionActive(true);
              alert('🔔 Giáo viên đã mở điểm danh!'); // Temporary alert for debugging
              break;
            case 'attendance_session_ended':
              console.log('🔍 DEBUG: Attendance session ended by admin');
              setAttendanceSessionActive(false);
              alert('⏰ Phiên điểm danh đã kết thúc'); // Temporary alert for debugging
              break;
            case 'self_attendance_marked':
              console.log('🔍 DEBUG: Student marked self-attendance:', data);
              // Admin/Teacher nhận thông báo khi student điểm danh
              if (isTeacherOrAdmin()) {
                alert(`🎯 ${data.student_name || 'Học viên'} đã điểm danh: ${data.status === 'present' ? 'Có mặt' : 'Đến muộn'}`);
                // Refresh attendance list để cập nhật UI
                if (showAttendancePanel) {
                  fetchAttendanceList();
                }
              }
              break;
            case 'user_joined':
              setOnlineUsers(prev => [...prev, data.user]);
              break;
            case 'user_left':
              setOnlineUsers(prev => prev.filter(user => user.id !== data.user.id));
              break;
            case 'chat_message':
              setMessages(prev => [...prev, {
                id: Date.now(),
                user: data.user,
                message: data.message,
                timestamp: data.timestamp
              }]);
              break;
            case 'online_users':
              setOnlineUsers(data.users);
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    if (classInfo) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [classId, classInfo]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() && wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }));
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveClass = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'leave',
        timestamp: new Date().toISOString()
      }));
      wsRef.current.close();
    }
    navigate('/');
  };

  // Teacher/Admin functions
  const isTeacherOrAdmin = () => {
    console.log('🔍 DEBUG isTeacherOrAdmin check:', {
      currentUser,
      roles: currentUser?.roles,
      hasRoles: currentUser && currentUser.roles,
      roleCheck: currentUser && currentUser.roles && 
                 currentUser.roles.some(role => 
                   role.toLowerCase() === 'teacher' || role.toLowerCase() === 'admin'
                 )
    });
    
    if (!currentUser || !currentUser.roles) {
      console.log('🔍 DEBUG: No user or no roles');
      return false;
    }
    
    const isTeacherAdmin = currentUser.roles.some(role => 
      role.toLowerCase() === 'teacher' || role.toLowerCase() === 'admin'
    );
    
    console.log('🔍 DEBUG: isTeacherOrAdmin result:', isTeacherAdmin);
    return isTeacherAdmin;
  };

  const fetchAttendanceList = async () => {
    try {
      console.log('🔍 DEBUG: Fetching attendance list for class:', classId);
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/students`, {
        credentials: 'include'
      });
      console.log('🔍 DEBUG: Attendance list response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG: Attendance list data:', data);
        setAttendanceList(data);
      } else {
        const errorText = await response.text();
        console.error('🔍 DEBUG: Failed to fetch attendance list:', response.status, errorText);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching attendance:', error);
    }
  };

  const markSelfAttendance = async (status) => {
    try {
      if (!currentUser) {
        alert('Vui lòng đăng nhập để điểm danh');
        return;
      }

      console.log('🔍 DEBUG: Student self-attendance for user:', currentUser.id, 'status:', status);
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/self-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          class_id: parseInt(classId),
          date: new Date().toISOString(),
          attendance: [{
            student_id: currentUser.id,
            status: status
          }]
        })
      });
      
      console.log('🔍 DEBUG: Self-attendance response status:', response.status);
      const responseText = await response.text();
      console.log('🔍 DEBUG: Self-attendance response:', responseText);
      
      if (response.ok) {
        console.log('🔍 DEBUG: Self-attendance marked successfully');
        setAttendanceStatus(status);
        
        // Send update via WebSocket
        if (wsRef.current && isConnected) {
          wsRef.current.send(JSON.stringify({
            type: 'self_attendance_marked',
            student_id: currentUser.id,
            status: status,
            timestamp: new Date().toISOString()
          }));
        }
        
        alert(`Đã điểm danh thành công: ${status === 'present' ? 'Có mặt' : 'Đến muộn'}`);
      } else {
        console.error('🔍 DEBUG: Failed to mark self-attendance:', response.status, responseText);
        alert(`Lỗi khi điểm danh: ${responseText}`);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error marking self-attendance:', error);
      alert(`Lỗi kết nối: ${error.message}`);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      console.log('🔍 DEBUG: Marking attendance for student:', studentId, 'status:', status);
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          class_id: parseInt(classId),
          date: new Date().toISOString(),
          attendance: [{
            student_id: studentId,
            status: status
          }]
        })
      });
      
      console.log('🔍 DEBUG: Mark attendance response status:', response.status);
      const responseText = await response.text();
      console.log('🔍 DEBUG: Mark attendance response:', responseText);
      
      if (response.ok) {
        console.log('🔍 DEBUG: Attendance marked successfully');
        // Refresh attendance list
        fetchAttendanceList();
        // Send update via WebSocket
        if (wsRef.current && isConnected) {
          wsRef.current.send(JSON.stringify({
            type: 'attendance_marked',
            student_id: studentId,
            status: status,
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        console.error('🔍 DEBUG: Failed to mark attendance:', response.status, responseText);
        alert(`Lỗi khi điểm danh: ${responseText}`);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error marking attendance:', error);
      alert(`Lỗi kết nối: ${error.message}`);
    }
  };

  const startAttendanceSession = async () => {
    try {
      console.log('🔍 DEBUG: Starting attendance session for class:', classId);
      const now = new Date();
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          class_id: parseInt(classId),
          session_date: now.toISOString(),
          start_time: now.toISOString(),
          lesson_topic: "Điểm danh",
          description: "Phiên điểm danh cho lớp học",
          is_active: true
        })
      });
      
      console.log('🔍 DEBUG: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔍 DEBUG: Response text:', responseText);
      
      if (response.ok) {
        console.log('🔍 DEBUG: Session created successfully');
        setShowAttendancePanel(true);
        setAttendanceSessionActive(true);
        fetchAttendanceList();
        // Notify all users via WebSocket
        if (wsRef.current && isConnected) {
          wsRef.current.send(JSON.stringify({
            type: 'attendance_session_started',
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        console.error('🔍 DEBUG: Failed to create session:', response.status, responseText);
        alert(`Lỗi khi tạo phiên điểm danh: ${responseText}`);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error starting attendance session:', error);
      alert(`Lỗi kết nối: ${error.message}`);
    }
  };

  if (!classInfo) {
    return (
      <div className="classroom-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải lớp học...</p>
      </div>
    );
  }

  return (
    <div className="classroom-container">
      {/* Header */}
      <div className="classroom-header">
        <div className="class-info">
          <h1>{classInfo.name}</h1>
          <p>📅 {classInfo.schedule}</p>
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>
        </div>
        <div className="classroom-actions">
          {/* Debug info để kiểm tra */}
          <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
            Debug: User = {currentUser?.email || 'None'} | 
            Roles = {currentUser?.roles?.join(', ') || 'None'} | 
            IsTeacherAdmin = {isTeacherOrAdmin().toString()}
          </div>
          
          {isTeacherOrAdmin() && (
            <button 
              className="attendance-control-btn"
              onClick={() => {
                if (showAttendancePanel) {
                  setShowAttendancePanel(false);
                  setAttendanceSessionActive(false);
                  // Notify students that session ended
                  if (wsRef.current && isConnected) {
                    wsRef.current.send(JSON.stringify({
                      type: 'attendance_session_ended',
                      timestamp: new Date().toISOString()
                    }));
                  }
                } else {
                  console.log('🔍 DEBUG: Starting attendance session...');
                  startAttendanceSession();
                }
              }}
            >
              📋 {showAttendancePanel ? 'Đóng điểm danh' : 'Mở điểm danh'}
            </button>
          )}
          {!isTeacherOrAdmin() && attendanceSessionActive && (
            <div className="student-attendance-section">
              <div className="attendance-notification">
                🔔 <strong>Giáo viên đã mở điểm danh!</strong>
              </div>
              <div className="attendance-status">
                <span className={`attendance-badge ${attendanceStatus}`}>
                  {attendanceStatus === 'present' ? '✅ Có mặt' : 
                   attendanceStatus === 'late' ? '⏰ Muộn' : 
                   '⏳ Chưa điểm danh'}
                </span>
              </div>
              <div className="self-attendance-actions">
                <button 
                  className="self-attendance-btn present"
                  onClick={() => markSelfAttendance('present')}
                  disabled={attendanceStatus === 'present'}
                >
                  ✅ Có mặt
                </button>
                <button 
                  className="self-attendance-btn late"
                  onClick={() => markSelfAttendance('late')}
                  disabled={attendanceStatus === 'late'}
                >
                  ⏰ Đến muộn
                </button>
              </div>
            </div>
          )}
          {!isTeacherOrAdmin() && !attendanceSessionActive && (
            <div className="attendance-waiting">
              <span className="waiting-message">⏳ Chờ giáo viên mở điểm danh</span>
            </div>
          )}
          <button className="leave-btn" onClick={leaveClass}>
            🚪 Rời lớp
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="classroom-content">
        {/* Video/Content Area */}
        <div className="content-area">
          <div className="video-placeholder">
            <div className="video-icon">📹</div>
            <h3>Khu vực nội dung lớp học</h3>
            <p>Đây là nơi hiển thị video bài giảng, tài liệu, hoặc màn hình chia sẻ</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="classroom-sidebar">
          {/* Attendance Panel for Teachers */}
          {isTeacherOrAdmin() && showAttendancePanel && (
            <div className="sidebar-section attendance-panel">
              <h3>📋 Bảng điểm danh</h3>
              <div className="attendance-controls">
                <button 
                  className="btn-refresh-attendance"
                  onClick={fetchAttendanceList}
                >
                  🔄 Làm mới
                </button>
              </div>
              <div className="attendance-list">
                {attendanceList.length === 0 ? (
                  <p className="no-attendance">Chưa có dữ liệu điểm danh</p>
                ) : (
                  attendanceList.map(student => {
                    console.log('🔍 DEBUG: Rendering student attendance:', {
                      student_name: student.name,
                      attendance_status: student.attendance_status,
                      isPresent: student.attendance_status === 'present'
                    });
                    return (
                    <div key={student.user_id || student.id} className="attendance-record">
                      <div className="student-info">
                        <span className="student-name">
                          {student.full_name || student.name || `Học viên ${student.user_id || student.id}`}
                        </span>
                        <span className="student-email">{student.email}</span>
                      </div>
                      <div className="attendance-actions">
                        <button
                          className={`attendance-btn present ${student.attendance_status === 'present' ? 'active' : ''}`}
                          onClick={() => markAttendance(student.user_id || student.id, 'present')}
                        >
                          ✅
                        </button>
                        <button
                          className={`attendance-btn late ${student.attendance_status === 'late' ? 'active' : ''}`}
                          onClick={() => markAttendance(student.user_id || student.id, 'late')}
                        >
                          ⏰
                        </button>
                        <button
                          className={`attendance-btn absent ${student.attendance_status === 'absent' ? 'active' : ''}`}
                          onClick={() => markAttendance(student.user_id || student.id, 'absent')}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Online Users */}
          <div className="sidebar-section">
            <h3>👥 Thành viên online ({onlineUsers.length})</h3>
            <div className="online-users-list">
              {onlineUsers.map(user => (
                <div key={user.id} className="online-user">
                  <div className="user-avatar">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="user-name">{user.name || 'Người dùng'}</span>
                  <span className="user-role">{user.role || 'student'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="sidebar-section chat-section">
            <h3>💬 Trò chuyện</h3>
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className="chat-message">
                  <div className="message-header">
                    <span className="message-user">{msg.user?.name || 'Người dùng'}</span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={!isConnected}
              />
              <button onClick={sendMessage} disabled={!isConnected || !newMessage.trim()}>
                📤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRoom;
