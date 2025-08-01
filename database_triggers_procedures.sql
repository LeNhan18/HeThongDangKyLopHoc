-- ================================
-- DATABASE TRIGGERS & PROCEDURES
-- Hệ thống Đăng ký Lớp học
-- ================================

USE htdk;

-- ================================
-- 1. TRIGGERS
-- ================================

-- Trigger: Tự động cập nhật thời gian modified khi update user
DELIMITER //
CREATE TRIGGER tr_user_update_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Trigger: Kiểm tra capacity khi đăng ký lớp học
DELIMITER //
CREATE TRIGGER tr_check_class_capacity
    BEFORE INSERT ON registrations
    FOR EACH ROW
BEGIN
    DECLARE current_count INT;
    DECLARE max_capacity INT;
    
    -- Lấy số lượng học viên hiện tại và capacity tối đa
    SELECT COUNT(*), c.capacity 
    INTO current_count, max_capacity
    FROM registrations r
    JOIN classes c ON c.id = NEW.class_id
    WHERE r.class_id = NEW.class_id 
    AND r.status = 'enrolled'
    GROUP BY c.capacity;
    
    -- Nếu chưa có ai đăng ký, current_count sẽ là NULL
    IF current_count IS NULL THEN
        SET current_count = 0;
        SELECT capacity INTO max_capacity FROM classes WHERE id = NEW.class_id;
    END IF;
    
    -- Kiểm tra xem còn chỗ không
    IF current_count >= max_capacity THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lớp học đã đầy, không thể đăng ký thêm';
    END IF;
END //
DELIMITER ;

-- Trigger: Tự động tạo notification khi có đăng ký mới
DELIMITER //
CREATE TRIGGER tr_new_registration_notification
    AFTER INSERT ON registrations
    FOR EACH ROW
BEGIN
    DECLARE class_name VARCHAR(255);
    DECLARE user_name VARCHAR(255);
    DECLARE teacher_id INT;
    
    -- Lấy thông tin lớp học và giáo viên
    SELECT c.name, u.full_name, c.teacher_id
    INTO class_name, user_name, teacher_id
    FROM classes c
    JOIN users u ON u.id = NEW.user_id
    WHERE c.id = NEW.class_id;
    
    -- Tạo thông báo cho giáo viên
    INSERT INTO notifications (user_id, message, type, created_at)
    VALUES (
        teacher_id,
        CONCAT('Học viên ', user_name, ' đã đăng ký lớp "', class_name, '"'),
        'registration',
        NOW()
    );
END //
DELIMITER ;

-- Trigger: Tự động tạo notification khi hủy đăng ký
DELIMITER //
CREATE TRIGGER tr_cancel_registration_notification
    AFTER UPDATE ON registrations
    FOR EACH ROW
BEGIN
    DECLARE class_name VARCHAR(255);
    DECLARE user_name VARCHAR(255);
    DECLARE teacher_id INT;
    
    -- Chỉ kích hoạt khi status thay đổi thành 'cancelled'
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        -- Lấy thông tin lớp học và giáo viên
        SELECT c.name, u.full_name, c.teacher_id
        INTO class_name, user_name, teacher_id
        FROM classes c
        JOIN users u ON u.id = NEW.user_id
        WHERE c.id = NEW.class_id;
        
        -- Tạo thông báo cho giáo viên
        INSERT INTO notifications (user_id, message, type, created_at)
        VALUES (
            teacher_id,
            CONCAT('Học viên ', user_name, ' đã hủy đăng ký lớp "', class_name, '"'),
            'cancellation',
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- Trigger: Tự động cập nhật attendance count
DELIMITER //
CREATE TRIGGER tr_update_attendance_count
    AFTER INSERT ON attendances
    FOR EACH ROW
BEGIN
    UPDATE registrations 
    SET attendance_count = (
        SELECT COUNT(*) 
        FROM attendances 
        WHERE registration_id = NEW.registration_id 
        AND status = 'present'
    )
    WHERE id = NEW.registration_id;
END //
DELIMITER ;

-- ================================
-- 2. STORED PROCEDURES
-- ================================

-- Procedure: Lấy thống kê tổng quan
DELIMITER //
CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
        (SELECT COUNT(*) FROM classes WHERE status = 'active') as active_classes,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM registrations WHERE status = 'enrolled') as total_enrollments;
END //
DELIMITER ;

-- Procedure: Lấy danh sách lớp học của học viên
DELIMITER //
CREATE PROCEDURE sp_get_student_classes(IN student_id INT)
BEGIN
    SELECT 
        c.id,
        c.name,
        c.schedule,
        c.room,
        co.name as course_name,
        t.full_name as teacher_name,
        r.status,
        r.registration_date,
        r.attendance_count
    FROM registrations r
    JOIN classes c ON c.id = r.class_id
    JOIN courses co ON co.id = c.course_id
    JOIN users t ON t.id = c.teacher_id
    WHERE r.user_id = student_id
    ORDER BY r.registration_date DESC;
END //
DELIMITER ;

-- Procedure: Lấy danh sách học viên trong lớp
DELIMITER //
CREATE PROCEDURE sp_get_class_students(IN class_id INT)
BEGIN
    SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        r.status,
        r.registration_date,
        r.attendance_count,
        ROUND((r.attendance_count * 100.0 / GREATEST(1, 
            (SELECT COUNT(*) FROM lessons WHERE class_id = class_id)
        )), 2) as attendance_percentage
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    WHERE r.class_id = class_id
    AND r.status = 'enrolled'
    ORDER BY u.full_name;
END //
DELIMITER ;

-- Procedure: Tìm kiếm lớp học theo tiêu chí
DELIMITER //
CREATE PROCEDURE sp_search_classes(
    IN search_name VARCHAR(255),
    IN course_id_filter INT,
    IN teacher_id_filter INT
)
BEGIN
    SELECT 
        c.id,
        c.name,
        c.description,
        c.schedule,
        c.room,
        c.capacity,
        c.status,
        co.name as course_name,
        t.full_name as teacher_name,
        COUNT(r.id) as enrolled_count
    FROM classes c
    JOIN courses co ON co.id = c.course_id
    JOIN users t ON t.id = c.teacher_id
    LEFT JOIN registrations r ON r.class_id = c.id AND r.status = 'enrolled'
    WHERE 
        (search_name IS NULL OR c.name LIKE CONCAT('%', search_name, '%'))
        AND (course_id_filter IS NULL OR c.course_id = course_id_filter)
        AND (teacher_id_filter IS NULL OR c.teacher_id = teacher_id_filter)
    GROUP BY c.id, c.name, c.description, c.schedule, c.room, c.capacity, c.status, co.name, t.full_name
    ORDER BY c.name;
END //
DELIMITER ;

-- Procedure: Thống kê điểm danh theo lớp
DELIMITER //
CREATE PROCEDURE sp_get_attendance_report(IN class_id INT)
BEGIN
    SELECT 
        l.date,
        l.topic,
        COUNT(a.id) as total_students,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2) as attendance_rate
    FROM lessons l
    LEFT JOIN attendances a ON a.lesson_id = l.id
    WHERE l.class_id = class_id
    GROUP BY l.id, l.date, l.topic
    ORDER BY l.date DESC;
END //
DELIMITER ;

-- Procedure: Tự động tạo thông báo cho nhóm
DELIMITER //
CREATE PROCEDURE sp_notify_class_members(
    IN class_id INT,
    IN message_text TEXT,
    IN notification_type VARCHAR(50)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id INT;
    
    -- Cursor để lặp qua tất cả học viên trong lớp
    DECLARE student_cursor CURSOR FOR
        SELECT r.user_id 
        FROM registrations r 
        WHERE r.class_id = class_id 
        AND r.status = 'enrolled';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Mở cursor
    OPEN student_cursor;
    
    -- Lặp qua từng học viên
    read_loop: LOOP
        FETCH student_cursor INTO user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Tạo thông báo cho học viên
        INSERT INTO notifications (user_id, message, type, created_at)
        VALUES (user_id, message_text, notification_type, NOW());
    END LOOP;
    
    -- Đóng cursor
    CLOSE student_cursor;
    
    -- Trả về số lượng thông báo đã tạo
    SELECT ROW_COUNT() as notifications_created;
END //
DELIMITER ;

-- Procedure: Dọn dẹp dữ liệu cũ
DELIMITER //
CREATE PROCEDURE sp_cleanup_old_data()
BEGIN
    -- Xóa thông báo cũ hơn 3 tháng
    DELETE FROM notifications 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
    
    -- Xóa session cũ hơn 1 tháng (nếu có bảng sessions)
    -- DELETE FROM sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH);
    
    -- Cập nhật attendance count cho tất cả registrations
    UPDATE registrations r
    SET attendance_count = (
        SELECT COUNT(*) 
        FROM attendances a 
        WHERE a.registration_id = r.id 
        AND a.status = 'present'
    );
    
    SELECT 'Cleanup completed successfully' as message;
END //
DELIMITER ;

-- ================================
-- 3. VIEWS (Lượt xem hữu ích)
-- ================================

-- View: Thông tin chi tiết lớp học
CREATE OR REPLACE VIEW vw_class_details AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.schedule,
    c.room,
    c.capacity,
    c.status,
    co.name as course_name,
    co.description as course_description,
    t.full_name as teacher_name,
    t.email as teacher_email,
    COUNT(r.id) as enrolled_count,
    (c.capacity - COUNT(r.id)) as available_slots
FROM classes c
JOIN courses co ON co.id = c.course_id
JOIN users t ON t.id = c.teacher_id
LEFT JOIN registrations r ON r.class_id = c.id AND r.status = 'enrolled'
GROUP BY c.id, c.name, c.description, c.schedule, c.room, c.capacity, c.status, 
         co.name, co.description, t.full_name, t.email;

-- View: Thống kê học viên
CREATE OR REPLACE VIEW vw_student_stats AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    COUNT(r.id) as total_classes,
    SUM(CASE WHEN r.status = 'enrolled' THEN 1 ELSE 0 END) as active_classes,
    SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_classes,
    SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_classes,
    AVG(r.attendance_count) as avg_attendance
FROM users u
LEFT JOIN registrations r ON r.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email;

-- ================================
-- 4. FUNCTIONS
-- ================================

-- Function: Tính phần trăm điểm danh
DELIMITER //
CREATE FUNCTION fn_calculate_attendance_percentage(registration_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE attendance_count INT DEFAULT 0;
    DECLARE total_lessons INT DEFAULT 0;
    DECLARE class_id INT;
    
    -- Lấy class_id từ registration
    SELECT r.class_id INTO class_id
    FROM registrations r
    WHERE r.id = registration_id;
    
    -- Đếm số buổi học đã điểm danh
    SELECT COUNT(*) INTO attendance_count
    FROM attendances a
    JOIN lessons l ON l.id = a.lesson_id
    WHERE a.registration_id = registration_id
    AND a.status = 'present';
    
    -- Đếm tổng số buổi học của lớp
    SELECT COUNT(*) INTO total_lessons
    FROM lessons
    WHERE class_id = class_id;
    
    -- Tính phần trăm
    IF total_lessons > 0 THEN
        RETURN ROUND((attendance_count * 100.0 / total_lessons), 2);
    ELSE
        RETURN 0.00;
    END IF;
END //
DELIMITER ;

-- ================================
-- 5. EVENTS (Scheduled Tasks)
-- ================================

-- Event: Tự động dọn dẹp dữ liệu hàng tuần
DELIMITER //
CREATE EVENT ev_weekly_cleanup
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    CALL sp_cleanup_old_data();
END //
DELIMITER ;

-- Bật event scheduler
SET GLOBAL event_scheduler = ON;

-- ================================
-- USAGE EXAMPLES
-- ================================

/*
-- Gọi stored procedures:
CALL sp_get_dashboard_stats();
CALL sp_get_student_classes(1);
CALL sp_get_class_students(1);
CALL sp_search_classes('Toán', NULL, NULL);
CALL sp_get_attendance_report(1);
CALL sp_notify_class_members(1, 'Lịch học đã thay đổi', 'schedule_change');

-- Sử dụng views:
SELECT * FROM vw_class_details WHERE available_slots > 0;
SELECT * FROM vw_student_stats ORDER BY avg_attendance DESC;

-- Sử dụng functions:
SELECT fn_calculate_attendance_percentage(1) as attendance_rate;

-- Xem triggers:
SHOW TRIGGERS;

-- Xem procedures:
SHOW PROCEDURE STATUS WHERE Db = 'htdk';

-- Xem events:
SHOW EVENTS;
*/

DELIMITER ;

-- ================================
-- END OF FILE
-- ================================
