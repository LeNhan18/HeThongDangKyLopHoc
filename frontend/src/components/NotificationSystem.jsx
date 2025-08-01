import React, { useState, useEffect, useCallback } from 'react';
import './css/NotificationSystem.css';

export default function NotificationSystem({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => setIsOpen(prev => !prev);
  const clearNotifications = () => setNotifications([]);
  const removeNotification = (idx) => {
    setNotifications(prev => prev.filter((_, i) => i !== idx));
  };

  // Hiển thị toast nổi
  const showToast = useCallback((notification) => {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerText = notification.message || 'Bạn có thông báo mới';
    document.body.appendChild(toast);

    // Tạo animation
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 4000);
  }, []);

 useEffect(() => {
  if (!user || !user.id) return;

  // Xác định WebSocket endpoint dựa trên role của user
  let wsUrl;
  const isAdmin = user.roles && user.roles.some(role => role.toLowerCase() === 'admin');
  const isTeacher = user.roles && user.roles.some(role => role.toLowerCase() === 'teacher');
  
  if (isAdmin) {
    wsUrl = `ws://localhost:8000/ws/admin/notifications`;
  } else if (isTeacher) {
    wsUrl = `ws://localhost:8000/ws/teacher/notifications`;
  } else {
    wsUrl = `ws://localhost:8000/ws/user/${user.id}/notifications`;
  }

  console.log(`Connecting to WebSocket: ${wsUrl}`);
  const websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    setIsConnected(true);
    console.log(`Connected to WebSocket: ${wsUrl}`);
  };
  websocket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data);
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      showToast(notification);
    } catch (error) {
      console.error('Error parsing notification:', error);
    }
  };
  websocket.onclose = () => {
    setIsConnected(false);
    console.log(`WebSocket closed: ${wsUrl}`);
  };
  websocket.onerror = (error) => {
    setIsConnected(false);
    console.error('WebSocket error:', error);
  };

  return () => websocket.close();
}, [user, showToast]);
  return (
    <div className="notification-system">
      <div className="notification-bell">
        <button className="bell-button" onClick={togglePanel}>
          🔔
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
        </button>

        {isOpen && (
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Thông báo</h3>
              <button className="clear-btn" onClick={clearNotifications}>Xóa hết</button>
            </div>
            <ul className="notification-list">
              {notifications.map((n, idx) => (
                <li key={idx} className="notification-item">
                  <span className="notification-icon">📢</span>
                  <div className="notification-content">
                    <div className="notification-title">{n.type || "Thông báo"}</div>
                    <div className="notification-message">{n.message}</div>
                    <div className="notification-time">{n.timestamp || "Vừa xong"}</div>
                  </div>
                  <button className="remove-notification" onClick={() => removeNotification(idx)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? "Đã kết nối" : "Mất kết nối"}
        </div>
      </div>
    </div>
  );
}
