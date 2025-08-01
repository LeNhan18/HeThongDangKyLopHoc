#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Triggers & Procedures Setup Script
Hệ thống Đăng ký Lớp học

Usage:
    python setup_db_triggers.py

This script will:
1. Create triggers for automatic data validation and notifications
2. Create stored procedures for common operations
3. Create views for easy data access
4. Create functions for calculations
5. Set up scheduled events
"""

import pymysql
import os
from typing import Dict, Any
import logging

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('db_setup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseSetup:
    def __init__(self, host: str = "127.0.0.1", port: int = 3306, 
                 user: str = "root", password: str = "nhan1811", 
                 database: str = "htdk"):
        """
        Initialize database connection parameters
        """
        self.config = {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'database': database,
            'charset': 'utf8mb4',
            'autocommit': True
        }
        
    def connect(self):
        """
        Create database connection
        """
        try:
            connection = pymysql.connect(**self.config)
            logger.info("✅ Database connection established")
            return connection
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    def execute_sql_file(self, connection, file_path: str):
        """
        Execute SQL statements from file
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            # Split by delimiter and execute each statement
            statements = sql_content.split('DELIMITER ;')
            
            with connection.cursor() as cursor:
                for i, statement in enumerate(statements):
                    if statement.strip():
                        try:
                            # Clean up the statement
                            clean_statement = statement.replace('DELIMITER //', '').strip()
                            if clean_statement:
                                cursor.execute(clean_statement)
                                logger.info(f"✅ Executed statement {i+1}")
                        except Exception as e:
                            logger.warning(f"⚠️  Statement {i+1} failed: {e}")
                            continue
            
            logger.info(f"✅ SQL file {file_path} executed successfully")
            
        except FileNotFoundError:
            logger.error(f"❌ SQL file not found: {file_path}")
            raise
        except Exception as e:
            logger.error(f"❌ Error executing SQL file: {e}")
            raise
    
    def check_existing_objects(self, connection):
        """
        Check what database objects already exist
        """
        logger.info("🔍 Checking existing database objects...")
        
        with connection.cursor() as cursor:
            # Check triggers
            cursor.execute("SHOW TRIGGERS")
            triggers = cursor.fetchall()
            logger.info(f"📋 Found {len(triggers)} existing triggers")
            
            # Check procedures
            cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (self.config['database'],))
            procedures = cursor.fetchall()
            logger.info(f"📋 Found {len(procedures)} existing procedures")
            
            # Check views
            cursor.execute("""
                SELECT TABLE_NAME 
                FROM information_schema.VIEWS 
                WHERE TABLE_SCHEMA = %s
            """, (self.config['database'],))
            views = cursor.fetchall()
            logger.info(f"📋 Found {len(views)} existing views")
            
            # Check functions
            cursor.execute("SHOW FUNCTION STATUS WHERE Db = %s", (self.config['database'],))
            functions = cursor.fetchall()
            logger.info(f"📋 Found {len(functions)} existing functions")
            
            # Check events
            cursor.execute("SHOW EVENTS")
            events = cursor.fetchall()
            logger.info(f"📋 Found {len(events)} existing events")
    
    def drop_existing_objects(self, connection):
        """
        Drop existing objects before recreating (optional)
        """
        logger.info("🗑️  Dropping existing objects...")
        
        drop_statements = [
            # Drop triggers
            "DROP TRIGGER IF EXISTS tr_user_update_timestamp",
            "DROP TRIGGER IF EXISTS tr_check_class_capacity", 
            "DROP TRIGGER IF EXISTS tr_new_registration_notification",
            "DROP TRIGGER IF EXISTS tr_cancel_registration_notification",
            "DROP TRIGGER IF EXISTS tr_update_attendance_count",
            
            # Drop procedures
            "DROP PROCEDURE IF EXISTS sp_get_dashboard_stats",
            "DROP PROCEDURE IF EXISTS sp_get_student_classes",
            "DROP PROCEDURE IF EXISTS sp_get_class_students", 
            "DROP PROCEDURE IF EXISTS sp_search_classes",
            "DROP PROCEDURE IF EXISTS sp_get_attendance_report",
            "DROP PROCEDURE IF EXISTS sp_notify_class_members",
            "DROP PROCEDURE IF EXISTS sp_cleanup_old_data",
            
            # Drop functions
            "DROP FUNCTION IF EXISTS fn_calculate_attendance_percentage",
            
            # Drop events
            "DROP EVENT IF EXISTS ev_weekly_cleanup",
            
            # Drop views (order matters due to dependencies)
            "DROP VIEW IF EXISTS vw_student_stats",
            "DROP VIEW IF EXISTS vw_class_details"
        ]
        
        with connection.cursor() as cursor:
            for statement in drop_statements:
                try:
                    cursor.execute(statement)
                    logger.info(f"✅ Executed: {statement}")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to drop: {statement} - {e}")
    
    def test_procedures(self, connection):
        """
        Test some of the created procedures
        """
        logger.info("🧪 Testing created procedures...")
        
        test_queries = [
            ("Dashboard Stats", "CALL sp_get_dashboard_stats()"),
            ("Class Details View", "SELECT * FROM vw_class_details LIMIT 3"),
            ("Student Stats View", "SELECT * FROM vw_student_stats LIMIT 3")
        ]
        
        with connection.cursor() as cursor:
            for test_name, query in test_queries:
                try:
                    cursor.execute(query)
                    results = cursor.fetchall()
                    logger.info(f"✅ {test_name}: {len(results)} rows returned")
                except Exception as e:
                    logger.warning(f"⚠️  {test_name} failed: {e}")
    
    def setup_database(self, drop_existing: bool = False):
        """
        Main setup method
        """
        logger.info("🚀 Starting database triggers & procedures setup...")
        
        connection = None
        try:
            # Connect to database
            connection = self.connect()
            
            # Check existing objects
            self.check_existing_objects(connection)
            
            # Optionally drop existing objects
            if drop_existing:
                self.drop_existing_objects(connection)
            
            # Execute SQL file
            sql_file_path = "database_triggers_procedures.sql"
            if os.path.exists(sql_file_path):
                self.execute_sql_file(connection, sql_file_path)
            else:
                logger.error(f"❌ SQL file not found: {sql_file_path}")
                return False
            
            # Test procedures
            self.test_procedures(connection)
            
            logger.info("🎉 Database setup completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Database setup failed: {e}")
            return False
        
        finally:
            if connection:
                connection.close()
                logger.info("🔌 Database connection closed")

def main():
    """
    Main execution function
    """
    print("=" * 60)
    print("🎯 Database Triggers & Procedures Setup")
    print("=" * 60)
    
    # Initialize setup
    db_setup = DatabaseSetup()
    
    # Ask user if they want to drop existing objects
    while True:
        drop_choice = input("\n🤔 Drop existing triggers/procedures? (y/n): ").lower().strip()
        if drop_choice in ['y', 'yes']:
            drop_existing = True
            break
        elif drop_choice in ['n', 'no']:
            drop_existing = False
            break
        else:
            print("❌ Please enter 'y' or 'n'")
    
    # Run setup
    success = db_setup.setup_database(drop_existing=drop_existing)
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 SETUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📋 Available procedures:")
        print("   • sp_get_dashboard_stats()")
        print("   • sp_get_student_classes(student_id)")
        print("   • sp_get_class_students(class_id)")
        print("   • sp_search_classes(name, course_id, teacher_id)")
        print("   • sp_get_attendance_report(class_id)")
        print("   • sp_notify_class_members(class_id, message, type)")
        print("   • sp_cleanup_old_data()")
        
        print("\n📊 Available views:")
        print("   • vw_class_details")
        print("   • vw_student_stats")
        
        print("\n⚡ Available functions:")
        print("   • fn_calculate_attendance_percentage(registration_id)")
        
        print("\n⏰ Scheduled events:")
        print("   • ev_weekly_cleanup (runs every week)")
        
        print("\n📖 Usage examples:")
        print("   CALL sp_get_dashboard_stats();")
        print("   SELECT * FROM vw_class_details;")
        print("   SELECT fn_calculate_attendance_percentage(1);")
        
    else:
        print("\n" + "=" * 60)
        print("❌ SETUP FAILED!")
        print("=" * 60)
        print("Please check the log file 'db_setup.log' for details.")

if __name__ == "__main__":
    main()
