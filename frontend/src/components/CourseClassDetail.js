import React, { useState, useEffect } from 'react';
import './css/CourseClassDetail.css';

const CourseClassDetail = ({ courseId, classId }) => {
  const [courseData, setCourseData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('course');

  useEffect(() => {
    fetchData();
  }, [courseId, classId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [];

      if (courseId) {
        promises.push(
          fetch(`http://localhost:8000/course/${courseId}/classes`).then(res => res.json())
        );
      }

      if (classId) {
        promises.push(
          fetch(`http://localhost:8000/class/${classId}/course`).then(res => res.json())
        );
      }

      const results = await Promise.all(promises);
      
      if (courseId) {
        setCourseData(results[0]);
      }
      
      if (classId) {
        setClassData(results[1]);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="course-class-detail">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="course-class-detail">
      <div className="detail-header">
        <h1>Chi Tiết Khóa Học & Lớp Học</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'course' ? 'active' : ''}`}
            onClick={() => setActiveTab('course')}
          >
            Khóa Học
          </button>
          <button 
            className={`tab-btn ${activeTab === 'class' ? 'active' : ''}`}
            onClick={() => setActiveTab('class')}
          >
            Lớp Học
          </button>
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'course' && courseData && (
          <div className="course-detail-section">
            <div className="course-info-card">
              <div className="course-header">
                <div className="course-image">
                  <img 
                    src={courseData.course?.image || '/default-course.jpg'} 
                    alt={courseData.course?.name} 
                  />
                </div>
                <div className="course-info">
                  <h2>{courseData.course?.name}</h2>
                  <p className="course-description">{courseData.course?.description}</p>
                  <div className="course-stats">
                    <span className="stat">
                      <strong>{courseData.total_classes}</strong> lớp học
                    </span>
                    <span className="stat">
                      <strong>{courseData.course?.id}</strong> ID
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="classes-section">
              <h3>Danh Sách Lớp Học</h3>
              <div className="classes-grid">
                {courseData.classes?.map(cls => (
                  <div key={cls.id} className="class-item">
                    <div className="class-header">
                      <h4>{cls.name}</h4>
                      <span className="class-id">ID: {cls.id}</span>
                    </div>
                    <div className="class-details">
                      <p><strong>Lịch học:</strong> {cls.schedule}</p>
                      <p><strong>Số học viên:</strong> {cls.current_students}/{cls.max_students}</p>
                    </div>
                    <div className="class-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(cls.current_students / cls.max_students) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Math.round((cls.current_students / cls.max_students) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'class' && classData && (
          <div className="class-detail-section">
            <div className="class-info-card">
              <div className="class-header">
                <h2>{classData.class_name}</h2>
                <span className="class-id">ID: {classData.class_id}</span>
              </div>
              
              {classData.course ? (
                <div className="assigned-course">
                  <h3>Khóa Học Được Gán</h3>
                  <div className="course-card">
                    <div className="course-image">
                      <img 
                        src={classData.course.image || '/default-course.jpg'} 
                        alt={classData.course.name} 
                      />
                    </div>
                    <div className="course-info">
                      <h4>{classData.course.name}</h4>
                      <p>{classData.course.description}</p>
                      <div className="course-meta">
                        <span>ID: {classData.course.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-course">
                  <div className="no-course-icon">📚</div>
                  <h3>Chưa Gán Khóa Học</h3>
                  <p>Lớp học này chưa được gán với khóa học nào.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseClassDetail; 