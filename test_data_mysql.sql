-- Dữ liệu mẫu đơn giản cho test
-- Chạy sau khi đã chạy attendance_simple_mysql.sql

-- Thêm phiên học mẫu
INSERT INTO class_sessions (class_id, session_date, start_time, end_time, lesson_topic, description, is_active, virtual_room_id) VALUES
(1, '2024-12-20 10:00:00', '2024-12-20 10:00:00', '2024-12-20 12:00:00', 'Python Basics', 'Introduction to Python programming', 1, 'room_001'),
(1, '2024-12-18 10:00:00', '2024-12-18 10:00:00', '2024-12-18 12:00:00', 'Python Functions', 'Learning Python functions', 0, 'room_002');

-- Thêm điểm danh mẫu cho test
INSERT INTO attendances (class_id, student_id, date, status, join_time, device_info, notes, marked_by) VALUES
-- Học viên ID 1
(1, 1, '2024-12-20 10:00:00', 'present', '2024-12-20 10:05:00', 'Chrome/Windows', 'Tham gia đúng giờ', 1),
(1, 1, '2024-12-18 10:00:00', 'present', '2024-12-18 10:02:00', 'Chrome/Windows', 'Tham gia tốt', 1),

-- Học viên ID 2  
(1, 2, '2024-12-20 10:00:00', 'late', '2024-12-20 10:15:00', 'Safari/iPhone', 'Muộn 15 phút', 1),
(1, 2, '2024-12-18 10:00:00', 'present', '2024-12-18 10:00:00', 'Safari/iPhone', 'Đúng giờ', 1),

-- Học viên ID 3
(1, 3, '2024-12-20 10:00:00', 'absent', NULL, NULL, 'Không tham gia', 1),
(1, 3, '2024-12-18 10:00:00', 'late', '2024-12-18 10:20:00', 'Firefox/Mac', 'Muộn 20 phút', 1);

-- Thêm báo cáo mẫu
INSERT INTO attendance_reports (class_id, report_type, start_date, end_date, total_students, total_sessions, attendance_rate, generated_by) VALUES
(1, 'weekly', '2024-12-16 00:00:00', '2024-12-20 23:59:59', 3, 2, '83.33%', 1);

-- Query để test dữ liệu
SELECT 'Test: Thống kê điểm danh tổng quan' as test_name;
SELECT 
    class_id,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as attendance_rate
FROM attendances 
WHERE class_id = 1
GROUP BY class_id;

SELECT 'Test: Danh sách phiên học' as test_name;
SELECT 
    id,
    class_id,
    session_date,
    lesson_topic,
    is_active
FROM class_sessions
ORDER BY session_date DESC;

SELECT 'Test: Chi tiết điểm danh' as test_name;
SELECT 
    class_id,
    student_id,
    DATE(date) as session_date,
    status,
    join_time,
    notes
FROM attendances
ORDER BY student_id, date;
