#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Triggers & Procedures Demo Script
Hệ thống Đăng ký Lớp học

Usage:
    python demo_db_features.py

This script demonstrates:
1. Calling stored procedures
2. Using views
3. Testing triggers
4. Using functions
"""

import pymysql
import json
from datetime import datetime
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseDemo:
    def __init__(self, host: str = "127.0.0.1", port: int = 3306, 
                 user: str = "root", password: str = "nhan1811", 
                 database: str = "htdk"):
        self.config = {
            'host': host,
            'port': port, 
            'user': user,
            'password': password,
            'database': database,
            'charset': 'utf8mb4'
        }
    
    def connect(self):
        try:
            connection = pymysql.connect(**self.config)
            logger.info("✅ Connected to database")
            return connection
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            raise
    
    def demo_dashboard_stats(self, connection):
        """
        Demo: Lấy thống kê dashboard
        """
        print("\n" + "="*50)
        print("📊 DASHBOARD STATISTICS")
        print("="*50)
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_get_dashboard_stats()")
            result = cursor.fetchone()
            
            if result:
                print(f"👥 Total Students: {result[0]}")
                print(f"👨‍🏫 Total Teachers: {result[1]}")
                print(f"📚 Active Classes: {result[2]}")
                print(f"📖 Total Courses: {result[3]}")
                print(f"📝 Total Enrollments: {result[4]}")
            else:
                print("❌ No data found")
    
    def demo_student_classes(self, connection, student_id: int = 1):
        """
        Demo: Lấy danh sách lớp của học viên
        """
        print("\n" + "="*50)
        print(f"📚 STUDENT CLASSES (ID: {student_id})")
        print("="*50)
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_get_student_classes(%s)", (student_id,))
            results = cursor.fetchall()
            
            if results:
                for row in results:
                    print(f"📖 Class: {row[1]}")
                    print(f"   📅 Schedule: {row[2]}")
                    print(f"   🏫 Room: {row[3]}")
                    print(f"   📚 Course: {row[4]}")
                    print(f"   👨‍🏫 Teacher: {row[5]}")
                    print(f"   📊 Status: {row[6]}")
                    print(f"   ✅ Attendance: {row[8]} sessions")
                    print("-" * 30)
            else:
                print("❌ No classes found for this student")
    
    def demo_class_students(self, connection, class_id: int = 1):
        """
        Demo: Lấy danh sách học viên trong lớp
        """
        print("\n" + "="*50)
        print(f"👥 CLASS STUDENTS (Class ID: {class_id})")
        print("="*50)
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_get_class_students(%s)", (class_id,))
            results = cursor.fetchall()
            
            if results:
                for row in results:
                    print(f"👤 {row[1]}")
                    print(f"   📧 Email: {row[2]}")
                    print(f"   📱 Phone: {row[3]}")
                    print(f"   📊 Status: {row[4]}")
                    print(f"   📅 Registered: {row[5]}")
                    print(f"   ✅ Attendance: {row[6]} sessions ({row[7]}%)")
                    print("-" * 30)
            else:
                print("❌ No students found in this class")
    
    def demo_search_classes(self, connection, search_term: str = ""):
        """
        Demo: Tìm kiếm lớp học
        """
        print("\n" + "="*50)
        print(f"🔍 SEARCH CLASSES: '{search_term}'")
        print("="*50)
        
        with connection.cursor() as cursor:
            search_param = search_term if search_term else None
            cursor.execute("CALL sp_search_classes(%s, %s, %s)", (search_param, None, None))
            results = cursor.fetchall()
            
            if results:
                for row in results:
                    print(f"📖 {row[1]} ({row[0]})")
                    print(f"   📝 Description: {row[2]}")
                    print(f"   📅 Schedule: {row[3]}")
                    print(f"   🏫 Room: {row[4]}")
                    print(f"   👥 Capacity: {row[9]}/{row[5]}")
                    print(f"   📚 Course: {row[7]}")
                    print(f"   👨‍🏫 Teacher: {row[8]}")
                    print("-" * 30)
            else:
                print("❌ No classes found")
    
    def demo_attendance_report(self, connection, class_id: int = 1):
        """
        Demo: Báo cáo điểm danh
        """
        print("\n" + "="*50)
        print(f"📋 ATTENDANCE REPORT (Class ID: {class_id})")
        print("="*50)
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_get_attendance_report(%s)", (class_id,))
            results = cursor.fetchall()
            
            if results:
                for row in results:
                    print(f"📅 Date: {row[0]}")
                    print(f"📖 Topic: {row[1]}")
                    print(f"👥 Total Students: {row[2]}")
                    print(f"✅ Present: {row[3]} | ❌ Absent: {row[4]} | ⏰ Late: {row[5]}")
                    print(f"📊 Attendance Rate: {row[6]}%")
                    print("-" * 30)
            else:
                print("❌ No attendance data found")
    
    def demo_views(self, connection):
        """
        Demo: Sử dụng views
        """
        print("\n" + "="*50)
        print("📊 DATABASE VIEWS")
        print("="*50)
        
        # Class Details View
        print("\n🏫 CLASS DETAILS VIEW:")
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM vw_class_details LIMIT 3")
            results = cursor.fetchall()
            
            for row in results:
                print(f"📖 {row[1]} - {row[7]} ({row[8]})")
                print(f"   👥 {row[10]}/{row[5]} enrolled | {row[11]} slots available")
        
        # Student Stats View
        print("\n👥 STUDENT STATS VIEW:")
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM vw_student_stats LIMIT 3")
            results = cursor.fetchall()
            
            for row in results:
                print(f"👤 {row[1]}")
                print(f"   📚 Total: {row[3]} | Active: {row[4]} | Completed: {row[5]}")
                print(f"   📊 Avg Attendance: {row[7] or 0}")
    
    def demo_function(self, connection, registration_id: int = 1):
        """
        Demo: Sử dụng function
        """
        print("\n" + "="*50)
        print(f"⚡ FUNCTION DEMO (Registration ID: {registration_id})")
        print("="*50)
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT fn_calculate_attendance_percentage(%s) as percentage", (registration_id,))
            result = cursor.fetchone()
            
            if result:
                print(f"📊 Attendance Percentage: {result[0]}%")
            else:
                print("❌ No data found")
    
    def demo_notify_class(self, connection, class_id: int = 1):
        """
        Demo: Gửi thông báo cho lớp
        """
        print("\n" + "="*50)
        print(f"📢 NOTIFY CLASS MEMBERS (Class ID: {class_id})")
        print("="*50)
        
        message = f"Demo notification sent at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_notify_class_members(%s, %s, %s)", 
                         (class_id, message, 'demo'))
            result = cursor.fetchone()
            
            if result:
                print(f"✅ Sent {result[0]} notifications successfully")
            else:
                print("❌ Failed to send notifications")
    
    def test_trigger_demo(self, connection):
        """
        Demo: Test trigger bằng cách tạo registration mới
        """
        print("\n" + "="*50)
        print("🔥 TRIGGER DEMO - Simulating new registration")
        print("="*50)
        
        try:
            with connection.cursor() as cursor:
                # Kiểm tra notifications trước khi test
                cursor.execute("SELECT COUNT(*) FROM notifications")
                before_count = cursor.fetchone()[0]
                print(f"📊 Notifications before test: {before_count}")
                
                # Thử tạo registration mới (có thể fail nếu capacity đầy)
                cursor.execute("""
                    INSERT INTO registrations (user_id, class_id, status, registration_date) 
                    VALUES (1, 1, 'enrolled', NOW())
                """)
                connection.commit()
                
                # Kiểm tra notifications sau khi test
                cursor.execute("SELECT COUNT(*) FROM notifications")
                after_count = cursor.fetchone()[0]
                print(f"📊 Notifications after test: {after_count}")
                
                if after_count > before_count:
                    print("✅ Trigger worked! New notification created.")
                    
                    # Hiển thị notification mới nhất
                    cursor.execute("""
                        SELECT message, type, created_at 
                        FROM notifications 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    """)
                    latest = cursor.fetchone()
                    if latest:
                        print(f"📢 Latest notification: {latest[0]} ({latest[1]})")
                
        except Exception as e:
            print(f"⚠️  Trigger test failed (expected if class is full): {e}")
    
    def run_demo(self):
        """
        Chạy toàn bộ demo
        """
        print("🎯 DATABASE TRIGGERS & PROCEDURES DEMO")
        print("=" * 60)
        
        connection = None
        try:
            connection = self.connect()
            
            # Run all demos
            self.demo_dashboard_stats(connection)
            self.demo_student_classes(connection, 1)
            self.demo_class_students(connection, 1)
            self.demo_search_classes(connection, "")
            self.demo_attendance_report(connection, 1)
            self.demo_views(connection)
            self.demo_function(connection, 1)
            self.demo_notify_class(connection, 1)
            self.test_trigger_demo(connection)
            
            print("\n" + "="*60)
            print("🎉 DEMO COMPLETED!")
            print("="*60)
            
        except Exception as e:
            logger.error(f"❌ Demo failed: {e}")
            
        finally:
            if connection:
                connection.close()
                logger.info("🔌 Connection closed")

def main():
    """
    Main function
    """
    demo = DatabaseDemo()
    demo.run_demo()

if __name__ == "__main__":
    main()
