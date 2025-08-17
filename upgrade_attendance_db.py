"""
Script to update database schema for attendance system
Run this to add new attendance tables and columns
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.sql import func
import enum

# Database configuration
DATABASE_URL = "sqlite:///./course_registration.db"  # Thay đổi theo cấu hình của bạn

class AttendanceStatus(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent" 
    LATE = "late"
    EXCUSED = "excused"

def upgrade_database():
    """Cập nhật database schema"""
    engine = create_engine(DATABASE_URL)
    metadata = MetaData()
    
    print("Connecting to database...")
    
    try:
        # Check if attendances table exists and needs updating
        with engine.connect() as conn:
            # Get existing table structure
            existing_tables = engine.table_names()
            
            print(f"Existing tables: {existing_tables}")
            
            if "attendances" in existing_tables:
                print("Updating existing attendances table...")
                
                # Add new columns to existing table
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN status TEXT DEFAULT 'absent'
                    """)
                    print("Added status column")
                except Exception as e:
                    print(f"Status column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN join_time DATETIME
                    """)
                    print("Added join_time column")
                except Exception as e:
                    print(f"Join_time column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN leave_time DATETIME
                    """)
                    print("Added leave_time column")
                except Exception as e:
                    print(f"Leave_time column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN device_info TEXT
                    """)
                    print("Added device_info column")
                except Exception as e:
                    print(f"Device_info column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN notes TEXT
                    """)
                    print("Added notes column")
                except Exception as e:
                    print(f"Notes column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN marked_by INTEGER
                    """)
                    print("Added marked_by column")
                except Exception as e:
                    print(f"Marked_by column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    """)
                    print("Added created_at column")
                except Exception as e:
                    print(f"Created_at column may already exist: {e}")
                
                try:
                    conn.execute("""
                        ALTER TABLE attendances ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    """)
                    print("Added updated_at column")
                except Exception as e:
                    print(f"Updated_at column may already exist: {e}")
            
            # Create class_sessions table
            if "class_sessions" not in existing_tables:
                print("Creating class_sessions table...")
                conn.execute("""
                    CREATE TABLE class_sessions (
                        id INTEGER PRIMARY KEY,
                        class_id INTEGER NOT NULL,
                        session_date DATETIME NOT NULL,
                        start_time DATETIME,
                        end_time DATETIME,
                        lesson_topic VARCHAR(255),
                        description TEXT,
                        is_active BOOLEAN DEFAULT 0,
                        virtual_room_id VARCHAR(100),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (class_id) REFERENCES classes (id)
                    )
                """)
                print("Created class_sessions table")
            else:
                print("class_sessions table already exists")
            
            # Create attendance_reports table
            if "attendance_reports" not in existing_tables:
                print("Creating attendance_reports table...")
                conn.execute("""
                    CREATE TABLE attendance_reports (
                        id INTEGER PRIMARY KEY,
                        class_id INTEGER NOT NULL,
                        report_type VARCHAR(50) NOT NULL,
                        start_date DATETIME NOT NULL,
                        end_date DATETIME NOT NULL,
                        total_students INTEGER NOT NULL,
                        total_sessions INTEGER NOT NULL,
                        attendance_rate VARCHAR(10),
                        generated_by INTEGER NOT NULL,
                        file_path VARCHAR(255),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (class_id) REFERENCES classes (id),
                        FOREIGN KEY (generated_by) REFERENCES users (id)
                    )
                """)
                print("Created attendance_reports table")
            else:
                print("attendance_reports table already exists")
            
            # Update existing attendance records with default status
            try:
                conn.execute("""
                    UPDATE attendances 
                    SET status = CASE 
                        WHEN attended = 1 THEN 'present'
                        ELSE 'absent'
                    END
                    WHERE status IS NULL OR status = ''
                """)
                print("Updated existing attendance records with status")
            except Exception as e:
                print(f"Could not update attendance records: {e}")
            
            conn.commit()
            print("Database upgrade completed successfully!")
            
    except Exception as e:
        print(f"Error upgrading database: {e}")
        raise

def create_sample_data():
    """Tạo dữ liệu mẫu cho testing"""
    engine = create_engine(DATABASE_URL)
    
    print("Creating sample data...")
    
    try:
        with engine.connect() as conn:
            # Sample class session
            conn.execute("""
                INSERT OR IGNORE INTO class_sessions 
                (class_id, session_date, lesson_topic, description, is_active)
                VALUES (1, datetime('now'), 'Python Basics', 'Introduction to Python programming', 1)
            """)
            
            # Sample attendance reports
            conn.execute("""
                INSERT OR IGNORE INTO attendance_reports 
                (class_id, report_type, start_date, end_date, total_students, total_sessions, attendance_rate, generated_by)
                VALUES (1, 'weekly', date('now', '-7 days'), date('now'), 10, 3, '85%', 1)
            """)
            
            conn.commit()
            print("Sample data created successfully!")
            
    except Exception as e:
        print(f"Error creating sample data: {e}")

if __name__ == "__main__":
    print("Starting database upgrade for attendance system...")
    upgrade_database()
    create_sample_data()
    print("Database upgrade completed!")
