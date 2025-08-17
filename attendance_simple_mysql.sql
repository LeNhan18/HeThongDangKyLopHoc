-- Cập nhật database cho hệ thống điểm danh - Phiên bản đơn giản
-- Chạy từng phần một để tránh lỗi

-- PHẦN 1: Thêm cột vào bảng attendances hiện có
ALTER TABLE attendances ADD COLUMN status VARCHAR(20) DEFAULT 'absent';
ALTER TABLE attendances ADD COLUMN join_time DATETIME NULL;
ALTER TABLE attendances ADD COLUMN leave_time DATETIME NULL;
ALTER TABLE attendances ADD COLUMN device_info TEXT NULL;
ALTER TABLE attendances ADD COLUMN notes TEXT NULL;
ALTER TABLE attendances ADD COLUMN marked_by INT NULL;
ALTER TABLE attendances ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendances ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- PHẦN 2: Tạo bảng class_sessions
CREATE TABLE class_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session_date DATETIME NOT NULL,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    lesson_topic VARCHAR(255) NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    virtual_room_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PHẦN 3: Tạo bảng attendance_reports
CREATE TABLE attendance_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_students INT NOT NULL DEFAULT 0,
    total_sessions INT NOT NULL DEFAULT 0,
    attendance_rate VARCHAR(10) NULL,
    generated_by INT NOT NULL,
    file_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PHẦN 4: Cập nhật dữ liệu status cho records cũ
UPDATE attendances 
SET status = CASE 
    WHEN attended = 1 THEN 'present'
    ELSE 'absent'
END
WHERE status = 'absent';

-- PHẦN 5: Thêm index
ALTER TABLE attendances ADD INDEX idx_class_date (class_id, date);
ALTER TABLE attendances ADD INDEX idx_student (student_id);
ALTER TABLE attendances ADD INDEX idx_status (status);

ALTER TABLE class_sessions ADD INDEX idx_class_id (class_id);
ALTER TABLE class_sessions ADD INDEX idx_session_date (session_date);
ALTER TABLE class_sessions ADD INDEX idx_active (is_active);

ALTER TABLE attendance_reports ADD INDEX idx_class_id (class_id);
ALTER TABLE attendance_reports ADD INDEX idx_report_type (report_type);
