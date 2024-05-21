import serial
import firebase_admin
from firebase_admin import credentials, db

# Khởi tạo Firebase (thay đổi YOUR_CREDENTIALS_JSON_FILE_PATH.json thành đường dẫn của tệp chứng chỉ Firebase của bạn)
cred = credentials.Certificate("C:\\fruit_recognition\\client\\ttiot-6ea8c-firebase-adminsdk-osco6-5f07ac14cd.json")
firebase_admin.initialize_app(cred, {"databaseURL": "https://ttiot-6ea8c-default-rtdb.firebaseio.com/"})

# Define the serial port and baud rate
serial_port = 'COM8'  # Thay đổi theo hệ điều hành của bạn (ví dụ, COMx trên Windows)
baud_rate = 115200

# Mở cổng serial
ser = serial.Serial(serial_port, baud_rate)

# Lấy tham chiếu đến Realtime Database
ref = db.reference("/")


try:
    while True:
        # Đọc một dòng từ cổng serial
        line = ser.readline().decode('utf-8').strip()

        # In ra dữ liệu đã nhận
        print("Received: ", line)
        

        # Chuyển dữ liệu từ serial thành số nguyên và cập nhật vào Realtime Database
        try:
            can_nang_value = int(line)
            ref.update({"CanNang": can_nang_value + 1258})
            print("CanNang updated to:", can_nang_value)
        except ValueError:
            print("Invalid data received from serial.")

except KeyboardInterrupt:
    # Đóng cổng serial khi chương trình kết thúc
    ser.close()
    print("Serial port closed.")
