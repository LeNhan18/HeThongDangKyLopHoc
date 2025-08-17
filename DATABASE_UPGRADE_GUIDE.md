# Hướng dẫn cập nhật Database cho Hệ thống Điểm danh

## Bước 1: Cập nhật Schema (Bắt buộc)
Chạy file SQL này trước để tạo bảng và cột mới:
```sql
source attendance_simple_mysql.sql;
```
hoặc copy paste nội dung file `attendance_simple_mysql.sql` vào MySQL Workbench/phpMyAdmin

## Bước 2: Thêm dữ liệu test (Tùy chọn)
Nếu muốn có dữ liệu mẫu để test:
```sql
source test_data_mysql.sql;
```

## Bước 3: Kiểm tra kết quả
Sau khi chạy xong, bạn sẽ có:

### Bảng attendances được cập nhật với các cột mới:
- `status` (present/absent/late/excused)
- `join_time` (thời gian tham gia)
- `leave_time` (thời gian rời khỏi) 
- `device_info` (thông tin thiết bị)
- `notes` (ghi chú)
- `marked_by` (người điểm danh)
- `created_at`, `updated_at` (timestamps)

### Bảng mới:
- `class_sessions` (quản lý phiên học)
- `attendance_reports` (báo cáo điểm danh)

## Test API sau khi cập nhật DB

Khởi động server FastAPI:
```bash
uvicorn main:app --reload
```

Sau đó test các endpoint trong file `test_attendance_api.http`

## Các endpoint chính:
- `GET /api/classes/{class_id}` - Thông tin lớp học
- `GET /api/classes/{class_id}/students` - Danh sách học viên  
- `POST /api/classes/{class_id}/attendance` - Lưu điểm danh
- `GET /api/classes/{class_id}/attendance/history` - Lịch sử điểm danh
- `GET /api/classes/{class_id}/attendance/stats` - Thống kê điểm danh
- `POST /api/classes/{class_id}/join` - Ghi nhận tham gia lớp
- `WebSocket /ws/attendance/{class_id}` - Real-time updates

## Lưu ý:
1. Backup database trước khi chạy
2. Chạy file `attendance_simple_mysql.sql` trước
3. Nếu có lỗi, có thể chạy từng câu lệnh một
4. Dữ liệu cũ sẽ được giữ nguyên và cập nhật tương thích

## Troubleshooting:
- Nếu lỗi "column already exists": Bỏ qua, có nghĩa là đã cập nhật rồi
- Nếu lỗi foreign key: Tạm thời bỏ constraint, chạy xong rồi thêm lại
- Nếu lỗi index: Kiểm tra index đã tồn tại chưa
