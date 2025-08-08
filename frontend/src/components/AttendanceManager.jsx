import React, { useState } from 'react';
import AttendancePage from './AttendancePage';
import AttendanceHistory from './AttendanceHistory';
import './css/AttendanceManager.css';

const AttendanceManager = ({ classId }) => {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: 'Điểm danh', icon: '✓' },
    { id: 'history', label: 'Lịch sử', icon: '📊' }
  ];

  return (
    <div className="attendance-manager">
      <div className="attendance-tabs">
        <div className="tab-header">
          <h1>Quản lý điểm danh</h1>
          <div className="tab-navigation">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'attendance' && (
          <AttendancePage classId={classId} />
        )}
        
        {activeTab === 'history' && (
          <AttendanceHistory classId={classId} />
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;
