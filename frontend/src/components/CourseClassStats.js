import React, { useState, useEffect } from 'react';
import './CourseClassStats.css';

const CourseClassStats = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    assignedClasses: 0,
    unassignedClasses: 0,
    averageStudentsPerClass: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [coursesRes, classesRes] = await Promise.all([
        fetch('http://localhost:8000/courses/'),
        fetch('http://localhost:8000/classes/')
      ]);
      
      const courses = await coursesRes.json();
      const classes = await classesRes.json();
      
      const assignedClasses = classes.filter(cls => cls.course_id);
      const unassignedClasses = classes.filter(cls => !cls.course_id);
      
      // Tính trung bình học viên mỗi lớp
      const totalStudents = classes.reduce((sum, cls) => {
        // Giả sử có API để lấy số học viên hiện tại
        return sum + (cls.current_students || 0);
      }, 0);
      
      setStats({
        totalCourses: courses.length,
        totalClasses: classes.length,
        assignedClasses: assignedClasses.length,
        unassignedClasses: unassignedClasses.length,
        averageStudentsPerClass: classes.length > 0 ? Math.round(totalStudents / classes.length) : 0
      });
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="course-class-stats">
        <div className="loading">Đang tải thống kê...</div>
      </div>
    );
  }

  return (
    <div className="course-class-stats">
      <div className="stats-header">
        <h2>Thống Kê Khóa Học & Lớp Học</h2>
        <button className="refresh-btn" onClick={fetchStats}>
          🔄 Làm mới
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalCourses}</h3>
            <p>Tổng Khóa Học</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>{stats.totalClasses}</h3>
            <p>Tổng Lớp Học</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.assignedClasses}</h3>
            <p>Lớp Đã Gán KH</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.unassignedClasses}</h3>
            <p>Lớp Chưa Gán KH</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.averageStudentsPerClass}</h3>
            <p>TB Học Viên/Lớp</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalClasses > 0 ? Math.round((stats.assignedClasses / stats.totalClasses) * 100) : 0}%</h3>
            <p>Tỷ Lệ Gán KH</p>
          </div>
        </div>
      </div>
      
      <div className="stats-chart">
        <div className="chart-section">
          <h3>Phân Bố Lớp Học</h3>
          <div className="chart-container">
            <div className="chart-bar">
              <div className="bar-label">Đã Gán</div>
              <div className="bar-container">
                <div 
                  className="bar-fill assigned"
                  style={{ width: `${stats.totalClasses > 0 ? (stats.assignedClasses / stats.totalClasses) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="bar-value">{stats.assignedClasses}</div>
            </div>
            
            <div className="chart-bar">
              <div className="bar-label">Chưa Gán</div>
              <div className="bar-container">
                <div 
                  className="bar-fill unassigned"
                  style={{ width: `${stats.totalClasses > 0 ? (stats.unassignedClasses / stats.totalClasses) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="bar-value">{stats.unassignedClasses}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseClassStats; 