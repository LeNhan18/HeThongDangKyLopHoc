-- Cập nhật database schema cho hệ thống điểm danh
-- MySQL version

-- Thêm các cột mới vào bảng attendances (nếu bảng đã tồn tại)
-- Kiểm tra và thêm cột status
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent' AFTER date;

-- Thêm cột join_time
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS join_time DATETIME NULL AFTER status;

-- Thêm cột leave_time  
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS leave_time DATETIME NULL AFTER join_time;

-- Thêm cột device_info
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS device_info TEXT NULL AFTER leave_time;

-- Thêm cột notes
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER device_info;

-- Thêm cột marked_by
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS marked_by INT NULL AFTER notes,
ADD CONSTRAINT fk_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL;

-- Thêm cột timestamps
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER marked_by,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Tạo bảng class_sessions
CREATE TABLE IF NOT EXISTS class_sessions (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_class_sessions_class_id (class_id),
    INDEX idx_class_sessions_date (session_date),
    INDEX idx_class_sessions_active (is_active),
    
    CONSTRAINT fk_class_sessions_class_id 
        FOREIGN KEY (class_id) REFERENCES classes(id) 
        ON DELETE CASCADE
);

-- Tạo bảng attendance_reports
CREATE TABLE IF NOT EXISTS attendance_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    report_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_students INT NOT NULL DEFAULT 0,
    total_sessions INT NOT NULL DEFAULT 0,
    attendance_rate VARCHAR(10) NULL,
    generated_by INT NOT NULL,
    file_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attendance_reports_class_id (class_id),
    INDEX idx_attendance_reports_type (report_type),
    INDEX idx_attendance_reports_date_range (start_date, end_date),
    
    CONSTRAINT fk_attendance_reports_class_id 
        FOREIGN KEY (class_id) REFERENCES classes(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_attendance_reports_generated_by 
        FOREIGN KEY (generated_by) REFERENCES users(id) 
        ON DELETE RESTRICT
);

-- Cập nhật dữ liệu hiện có trong bảng attendances
-- Đặt status dựa trên cột attended cũ
UPDATE attendances 
SET status = CASE 
    WHEN attended = 1 THEN 'present'
    ELSE 'absent'
END
WHERE status IS NULL OR status = '';

-- Thêm index để tối ưu performance
-- Kiểm tra và tạo index (bỏ qua lỗi nếu đã tồn tại)

-- Index cho class_id và date
CREATE INDEX idx_attendances_class_date ON attendances (class_id, date);

-- Index cho student_id  
CREATE INDEX idx_attendances_student ON attendances (student_id);

-- Index cho status
CREATE INDEX idx_attendances_status ON attendances (status);

-- Tạo view để thống kê điểm danh
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    a.class_id,
    c.class_name,
    DATE(a.date) as attendance_date,
    COUNT(*) as total_students,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND(
        (SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
        2
    ) as attendance_rate
FROM attendances a
LEFT JOIN classes c ON a.class_id = c.id
GROUP BY a.class_id, c.class_name, DATE(a.date);

-- Tạo stored procedure để lấy thống kê điểm danh
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS GetAttendanceStats(
    IN p_class_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
        ROUND(
            (SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
            2
        ) as attendance_rate
    FROM attendances 
    WHERE class_id = p_class_id 
        AND (p_start_date IS NULL OR DATE(date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(date) <= p_end_date);
END //

DELIMITER ;

-- Tạo trigger để tự động cập nhật updated_at
DELIMITER //

CREATE TRIGGER IF NOT EXISTS attendances_updated_at
    BEFORE UPDATE ON attendances
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER IF NOT EXISTS class_sessions_updated_at
    BEFORE UPDATE ON class_sessions
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- Thêm constraint để đảm bảo tính toàn vẹn dữ liệu
-- Bỏ qua lỗi nếu constraint đã tồn tại
ALTER TABLE attendances 
ADD CONSTRAINT chk_attendance_times 
CHECK (leave_time IS NULL OR join_time IS NULL OR leave_time >= join_time);

-- Tạo function để tính attendance rate
DELIMITER //

CREATE FUNCTION IF NOT EXISTS CalculateAttendanceRate(
    p_class_id INT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_count INT DEFAULT 0;
    DECLARE present_count INT DEFAULT 0;
    DECLARE attendance_rate DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT 
        COUNT(*),
        SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END)
    INTO total_count, present_count
    FROM attendances 
    WHERE class_id = p_class_id 
        AND (p_start_date IS NULL OR DATE(date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(date) <= p_end_date);
    
    IF total_count > 0 THEN
        SET attendance_rate = (present_count * 100.0) / total_count;
    END IF;
    
    RETURN attendance_rate;
END //

DELIMITER ;
