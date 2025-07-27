import React, { useEffect, useState } from 'react';
import './NotificationSystem.css';

export default function NotificationSystem({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Xác định loại kết nối WebSocket dựa trên role
    let wsUrl = '';
    if (user.roles && user.roles.some(r => r.toLowerCase() === 'admin')) {
      wsUrl = 'ws://localhost:8000/ws/admin/notifications';
    } else if (user.roles && user.roles.some(r => r.toLowerCase() === 'teacher')) {
      wsUrl = 'ws://localhost:8000/ws/teacher/notifications';
    } else {
      return; // Student không cần kết nối
    }

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for notifications');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Received notification:', notification);
        
        // Thêm thông báo mới vào đầu danh sách
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Giữ tối đa 10 thông báo
        
        // Hiển thị toast notification
        showToast(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(websocket);

    // Cleanup khi component unmount
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [user]);

  const showToast = (notification) => {
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-type">${getNotificationIcon(notification.type)}</span>
        <span class="toast-title">${getNotificationTitle(notification.type)}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="toast-message">${notification.message}</div>
      <div class="toast-time">${new Date(notification.timestamp).toLocaleTimeString()}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_registration':
        return '👤';
      case 'schedule_change':
        return '📅';
      case 'course_update':
        return '📚';
      default:
        return '🔔';
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'new_registration':
        return 'Đăng ký mới';
      case 'schedule_change':
        return 'Thay đổi lịch học';
      case 'course_update':
        return 'Cập nhật khóa học';
      default:
        return 'Thông báo';
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  if (!user || !user.roles || (!user.roles.some(r => r.toLowerCase() === 'admin') && !user.roles.some(r => r.toLowerCase() === 'teacher'))) {
    return null; // Chỉ hiển thị cho admin/teacher
  }

  return (
    <div className="notification-system">
      {/* Notification Bell */}
      <div className="notification-bell">
        <button className="bell-button" onClick={() => setNotifications(prev => [...prev])}>
          🔔
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
        </button>
        
        {/* Notification Panel */}
        {notifications.length > 0 && (
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Thông báo ({notifications.length})</h3>
              <button onClick={clearNotifications} className="clear-btn">Xóa tất cả</button>
            </div>
            <div className="notification-list">
              {notifications.map((notification, index) => (
                <div key={index} className="notification-item">
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {getNotificationTitle(notification.type)}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeNotification(index)}
                    className="remove-notification"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Connection Status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢' : '🔴'} {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
      </div>
    </div>
  );
} 