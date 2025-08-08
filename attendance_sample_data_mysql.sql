-- Dữ liệu mẫu cho hệ thống điểm danh
-- MySQL version

-- Tạo dữ liệu mẫu cho class_sessions
INSERT IGNORE INTO class_sessions (class_id, session_date, start_time, end_time, lesson_topic, description, is_active, virtual_room_id) VALUES
(1, '2024-12-20 10:00:00', '2024-12-20 10:00:00', '2024-12-20 12:00:00', 'Python Basics - Variables', 'Introduction to Python variables and data types', 1, 'room_python_001'),
(1, '2024-12-18 10:00:00', '2024-12-18 10:00:00', '2024-12-18 12:00:00', 'Python Basics - Functions', 'Learning about Python functions', 0, 'room_python_002'),
(1, '2024-12-16 10:00:00', '2024-12-16 10:00:00', '2024-12-16 12:00:00', 'Python Basics - Control Flow', 'If statements and loops in Python', 0, 'room_python_003'),
(2, '2024-12-20 14:00:00', '2024-12-20 14:00:00', '2024-12-20 16:00:00', 'Web Development - HTML', 'HTML fundamentals', 1, 'room_web_001'),
(2, '2024-12-18 14:00:00', '2024-12-18 14:00:00', '2024-12-18 16:00:00', 'Web Development - CSS', 'CSS styling basics', 0, 'room_web_002');

-- Cập nhật dữ liệu mẫu cho attendances (giả sử đã có một số bản ghi)
-- Thêm dữ liệu điểm danh mẫu cho lớp 1
INSERT IGNORE INTO attendances (class_id, student_id, date, status, join_time, device_info, notes, marked_by) VALUES
-- Buổi học ngày 2024-12-20
(1, 1, '2024-12-20 10:00:00', 'present', '2024-12-20 10:05:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Tham gia đúng giờ', 1),
(1, 2, '2024-12-20 10:00:00', 'late', '2024-12-20 10:15:00', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'Muộn 15 phút', 1),
(1, 3, '2024-12-20 10:00:00', 'present', '2024-12-20 09:58:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Vào sớm', 1),
(1, 4, '2024-12-20 10:00:00', 'absent', NULL, NULL, 'Không tham gia', 1),
(1, 5, '2024-12-20 10:00:00', 'excused', NULL, NULL, 'Xin phép nghỉ do ốm', 1),

-- Buổi học ngày 2024-12-18
(1, 1, '2024-12-18 10:00:00', 'present', '2024-12-18 10:02:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Tham gia đúng giờ', 1),
(1, 2, '2024-12-18 10:00:00', 'present', '2024-12-18 10:00:00', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'Tham gia đúng giờ', 1),
(1, 3, '2024-12-18 10:00:00', 'late', '2024-12-18 10:20:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Muộn 20 phút', 1),
(1, 4, '2024-12-18 10:00:00', 'present', '2024-12-18 10:05:00', 'Mozilla/5.0 (Android 10; Mobile)', 'Tham gia', 1),
(1, 5, '2024-12-18 10:00:00', 'absent', NULL, NULL, 'Không tham gia', 1),

-- Buổi học ngày 2024-12-16
(1, 1, '2024-12-16 10:00:00', 'present', '2024-12-16 10:00:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Tham gia đúng giờ', 1),
(1, 2, '2024-12-16 10:00:00', 'absent', NULL, NULL, 'Không tham gia', 1),
(1, 3, '2024-12-16 10:00:00', 'present', '2024-12-16 10:03:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Tham gia', 1),
(1, 4, '2024-12-16 10:00:00', 'present', '2024-12-16 10:07:00', 'Mozilla/5.0 (Android 10; Mobile)', 'Tham gia muộn chút', 1),
(1, 5, '2024-12-16 10:00:00', 'late', '2024-12-16 10:25:00', 'Mozilla/5.0 (iPad; CPU OS 14_0)', 'Muộn 25 phút', 1);

-- Thêm dữ liệu cho lớp 2
INSERT IGNORE INTO attendances (class_id, student_id, date, status, join_time, device_info, notes, marked_by) VALUES
-- Buổi học ngày 2024-12-20
(2, 6, '2024-12-20 14:00:00', 'present', '2024-12-20 14:02:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Tham gia tốt', 1),
(2, 7, '2024-12-20 14:00:00', 'present', '2024-12-20 13:58:00', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)', 'Vào sớm', 1),
(2, 8, '2024-12-20 14:00:00', 'late', '2024-12-20 14:10:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0)', 'Muộn 10 phút', 1),

-- Buổi học ngày 2024-12-18
(2, 6, '2024-12-18 14:00:00', 'present', '2024-12-18 14:00:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Tham gia đúng giờ', 1),
(2, 7, '2024-12-18 14:00:00', 'absent', NULL, NULL, 'Không tham gia', 1),
(2, 8, '2024-12-18 14:00:00', 'present', '2024-12-18 14:05:00', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0)', 'Tham gia', 1);

-- Tạo báo cáo mẫu
INSERT IGNORE INTO attendance_reports (class_id, report_type, start_date, end_date, total_students, total_sessions, attendance_rate, generated_by, file_path) VALUES
(1, 'weekly', '2024-12-16 00:00:00', '2024-12-20 23:59:59', 5, 3, '73.33%', 1, '/reports/class_1_weekly_2024_12_16.pdf'),
(1, 'monthly', '2024-12-01 00:00:00', '2024-12-31 23:59:59', 5, 8, '75.00%', 1, '/reports/class_1_monthly_2024_12.pdf'),
(2, 'weekly', '2024-12-16 00:00:00', '2024-12-20 23:59:59', 3, 2, '83.33%', 1, '/reports/class_2_weekly_2024_12_16.pdf');

-- Test queries để kiểm tra dữ liệu

-- 1. Xem thống kê điểm danh tổng quan
SELECT 
    'Class 1 - Python Basics' as class_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as attendance_rate
FROM attendances 
WHERE class_id = 1

UNION ALL

SELECT 
    'Class 2 - Web Development' as class_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as attendance_rate
FROM attendances 
WHERE class_id = 2;

-- 2. Xem thống kê theo từng buổi học
SELECT 
    class_id,
    DATE(date) as session_date,
    COUNT(*) as total_students,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
    SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused,
    ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as attendance_rate
FROM attendances 
GROUP BY class_id, DATE(date)
ORDER BY class_id, session_date DESC;

-- 3. Xem chi tiết điểm danh của học viên
SELECT 
    a.class_id,
    a.student_id,
    u.full_name as student_name,
    DATE(a.date) as session_date,
    a.status,
    a.join_time,
    a.notes
FROM attendances a
LEFT JOIN users u ON a.student_id = u.id
WHERE a.class_id = 1
ORDER BY a.student_id, a.date;

-- 4. Test stored procedure
-- CALL GetAttendanceStats(1, '2024-12-16', '2024-12-20');

-- 5. Test function
-- SELECT CalculateAttendanceRate(1, '2024-12-16', '2024-12-20') as attendance_rate;
