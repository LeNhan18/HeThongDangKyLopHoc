import mysql.connector

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="nhan1811",
        database="HTDK"
    )
    print("Kết nối thành công!")
    conn.close()
except Exception as e:
    print("Kết nối thất bại:", e) 