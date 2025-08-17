import React, { useState, useEffect } from 'react';
import './css/VirtualClassroom.css';

const VirtualClassroom = ({ classId, studentId, onLeave }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    // Mock class info
    setClassInfo({
      id: classId,
      name: 'Lớp học Tiếng Anh cơ bản',
      instructor: 'Nguyễn Văn A',
      topic: 'Bài 5: Ngữ pháp thì hiện tại đơn'
    });

    // Mock participants
    setParticipants([
      { id: 'INST001', name: 'Nguyễn Văn A', role: 'instructor', isOnline: true },
      { id: 'ST001', name: 'Trần Văn B', role: 'student', isOnline: true },
      { id: 'ST002', name: 'Lê Thị C', role: 'student', isOnline: true },
      { id: 'ST005', name: 'Nguyễn Văn F', role: 'student', isOnline: false },
    ]);

    // Mock chat messages
    setChatMessages([
      { id: 1, sender: 'Nguyễn Văn A', message: 'Chào mừng các bạn đến với buổi học hôm nay!', time: '14:00', role: 'instructor' },
      { id: 2, sender: 'Trần Văn B', message: 'Chào thầy ạ!', time: '14:01', role: 'student' },
      { id: 3, sender: 'Lê Thị C', message: 'Em đã sẵn sàng học bài mới', time: '14:02', role: 'student' },
    ]);

    // Auto join after 1 second
    setTimeout(() => {
      setIsJoined(true);
    }, 1000);
  }, [classId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        sender: 'Tôi', // Current user
        message: newMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        role: 'student'
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const handleLeaveClass = () => {
    setIsJoined(false);
    setTimeout(() => {
      onLeave();
    }, 500);
  };

  if (!isJoined) {
    return (
      <div className="joining-classroom">
        <div className="joining-content">
          <div className="joining-spinner"></div>
          <h3>Đang vào phòng học...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="virtual-classroom">
      <div className="classroom-header">
        <div className="class-info">
          <h2>{classInfo?.name}</h2>
          <p><strong>Chủ đề:</strong> {classInfo?.topic}</p>
          <p><strong>Giảng viên:</strong> {classInfo?.instructor}</p>
        </div>
        <div className="classroom-controls">
          <button className="control-btn mic-btn">
            <span className="icon">🎤</span>
            Micro
          </button>
          <button className="control-btn camera-btn">
            <span className="icon">📹</span>
            Camera
          </button>
          <button className="control-btn screen-btn">
            <span className="icon">🖥️</span>
            Chia sẻ màn hình
          </button>
          <button className="leave-btn" onClick={handleLeaveClass}>
            <span className="icon">🚪</span>
            Rời phòng
          </button>
        </div>
      </div>

      <div className="classroom-content">
        <div className="main-content">
          <div className="video-area">
            <div className="instructor-video">
              <div className="video-placeholder">
                <div className="avatar-large">
                  {classInfo?.instructor.charAt(0)}
                </div>
                <p>{classInfo?.instructor}</p>
                <span className="role-badge instructor">Giảng viên</span>
              </div>
            </div>
            
            <div className="students-videos">
              {participants.filter(p => p.role === 'student').map(participant => (
                <div key={participant.id} className={`student-video ${participant.isOnline ? 'online' : 'offline'}`}>
                  <div className="video-placeholder small">
                    <div className="avatar-small">
                      {participant.name.charAt(0)}
                    </div>
                    <p>{participant.name}</p>
                    {!participant.isOnline && <span className="offline-badge">Offline</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lesson-content">
            <div className="content-header">
              <h3>Nội dung bài học</h3>
            </div>
            <div className="content-body">
              <div className="presentation-area">
                <div className="slide-placeholder">
                  <h4>Thì hiện tại đơn (Present Simple)</h4>
                  <div className="slide-content">
                    <p><strong>Cấu trúc:</strong></p>
                    <ul>
                      <li>Khẳng định: S + V(s/es) + O</li>
                      <li>Phủ định: S + don't/doesn't + V + O</li>
                      <li>Nghi vấn: Do/Does + S + V + O?</li>
                    </ul>
                    <p><strong>Ví dụ:</strong></p>
                    <ul>
                      <li>I study English every day.</li>
                      <li>She doesn't like coffee.</li>
                      <li>Do you play football?</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="participants-panel">
            <h4>Người tham gia ({participants.length})</h4>
            <div className="participants-list">
              {participants.map(participant => (
                <div key={participant.id} className={`participant-item ${participant.role}`}>
                  <div className="participant-avatar">
                    {participant.name.charAt(0)}
                  </div>
                  <div className="participant-info">
                    <span className="name">{participant.name}</span>
                    <span className={`status ${participant.isOnline ? 'online' : 'offline'}`}>
                      {participant.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                    </span>
                  </div>
                  {participant.role === 'instructor' && (
                    <span className="role-badge instructor">GV</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="chat-panel">
            <h4>Trò chuyện</h4>
            <div className="chat-messages">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-header">
                    <span className="sender">{msg.sender}</span>
                    <span className="time">{msg.time}</span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="send-btn">
                <span className="icon">📤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroom;
