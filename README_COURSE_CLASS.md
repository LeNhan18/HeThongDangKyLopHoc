# Hướng Dẫn Quản Lý Khóa Học và Lớp Học

## Tổng Quan

Hệ thống đã được cập nhật để hỗ trợ quản lý mối quan hệ giữa khóa học và lớp học. Mỗi lớp học có thể được gán với một khóa học cụ thể.

## Các API Mới

### 1. Gán Khóa Học Vào Lớp Học

**Endpoint:** `POST /class/{class_id}/assign_course/{course_id}`

**Mô tả:** Gán một khóa học vào lớp học cụ thể.

**Quyền:** Chỉ teacher hoặc admin mới được thực hiện.

**Ví dụ:**
```bash
curl -X POST "http://localhost:8000/class/1/assign_course/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Đã gán khóa học 'Python Cơ bản' vào lớp học 'Lớp Python Cơ bản - Khóa 1'",
  "class_id": 1,
  "course_id": 1,
  "course_name": "Python Cơ bản",
  "old_course_id": null
}
```

### 2. Xóa Khóa Học Khỏi Lớp Học

**Endpoint:** `DELETE /class/{class_id}/remove_course`

**Mô tả:** Xóa liên kết khóa học khỏi lớp học.

**Quyền:** Chỉ teacher hoặc admin mới được thực hiện.

**Ví dụ:**
```bash
curl -X DELETE "http://localhost:8000/class/1/remove_course" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Đã xóa khóa học 'Python Cơ bản' khỏi lớp học 'Lớp Python Cơ bản - Khóa 1'",
  "class_id": 1,
  "removed_course_id": 1,
  "removed_course_name": "Python Cơ bản"
}
```

### 3. Xem Thông Tin Khóa Học Của Lớp Học

**Endpoint:** `GET /class/{class_id}/course`

**Mô tả:** Lấy thông tin chi tiết về khóa học được gán cho lớp học.

**Ví dụ:**
```bash
curl "http://localhost:8000/class/1/course"
```

**Response:**
```json
{
  "class_id": 1,
  "class_name": "Lớp Python Cơ bản - Khóa 1",
  "course": {
    "id": 1,
    "name": "Python Cơ bản",
    "description": "Khóa học Python dành cho người mới bắt đầu...",
    "image": "python-basic.jpg"
  }
}
```

### 4. Xem Tất Cả Lớp Học Của Một Khóa Học

**Endpoint:** `GET /course/{course_id}/classes`

**Mô tả:** Lấy danh sách tất cả lớp học thuộc về một khóa học cụ thể.

**Ví dụ:**
```bash
curl "http://localhost:8000/course/1/classes"
```

**Response:**
```json
{
  "course": {
    "id": 1,
    "name": "Python Cơ bản",
    "description": "Khóa học Python dành cho người mới bắt đầu...",
    "image": "python-basic.jpg"
  },
  "classes": [
    {
      "id": 1,
      "name": "Lớp Python Cơ bản - Khóa 1",
      "max_students": 25,
      "schedule": "Thứ 2, 4, 6 - 19:00-21:00",
      "current_students": 15
    },
    {
      "id": 2,
      "name": "Lớp Python Cơ bản - Khóa 2",
      "max_students": 30,
      "schedule": "Thứ 3, 5, 7 - 19:00-21:00",
      "current_students": 8
    }
  ],
  "total_classes": 2
}
```

## Tạo Dữ Liệu Mẫu

Để tạo dữ liệu mẫu cho khóa học và lớp học, chạy script sau:

```bash
python create_sample_data.py
```

Script này sẽ tạo:
- 5 khóa học mẫu (Python Cơ bản, Python Nâng cao, React.js Cơ bản, React.js Nâng cao, Database Design)
- 6 lớp học mẫu được gán với các khóa học tương ứng

## Cập Nhật Lớp Học Với Khóa Học

Khi tạo hoặc cập nhật lớp học, bạn có thể chỉ định `course_id`:

**Tạo lớp học mới:**
```json
{
  "name": "Lớp Python Cơ bản - Khóa 3",
  "max_students": 25,
  "schedule": "Thứ 2, 4, 6 - 19:00-21:00",
  "course_id": 1
}
```

**Cập nhật lớp học:**
```json
{
  "name": "Lớp Python Cơ bản - Khóa 1",
  "max_students": 30,
  "schedule": "Thứ 2, 4, 6 - 19:00-21:00",
  "course_id": 2
}
```

## Lưu Ý Quan Trọng

1. **Quyền truy cập:** Chỉ teacher và admin mới có thể gán/xóa khóa học khỏi lớp học.

2. **Lịch sử thay đổi:** Tất cả các thay đổi về khóa học sẽ được ghi lại trong lịch sử lớp học.

3. **Validation:** Hệ thống sẽ kiểm tra sự tồn tại của khóa học trước khi gán.

4. **Backward compatibility:** Các API cũ vẫn hoạt động bình thường.

## Testing

Sử dụng file `test_course_class_assignment.http` để test các API mới:

```bash
# Chạy server
uvicorn main:app --reload

# Test các API trong file .http
```

## Cấu Trúc Database

```sql
-- Bảng courses
CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    image VARCHAR(1000)
);

-- Bảng classes (đã có sẵn course_id)
CREATE TABLE classes (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    max_students INTEGER DEFAULT 30,
    course_id INTEGER REFERENCES courses(id),
    schedule VARCHAR(255) NOT NULL
);
``` 