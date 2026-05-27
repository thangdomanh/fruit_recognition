from pathlib import Path

import firebase_admin
import serial
from firebase_admin import credentials, db

# Initialize Firebase with the admin credential stored beside this script.
BASE_DIR = Path(__file__).resolve().parent
cred = credentials.Certificate(BASE_DIR / "ttiot-6ea8c-firebase-adminsdk-osco6-5f07ac14cd.json")
firebase_admin.initialize_app(cred, {"databaseURL": "https://ttiot-6ea8c-default-rtdb.firebaseio.com/"})

# Configure the serial port and baud rate for the scale or microcontroller.
serial_port = "COM8"
baud_rate = 115200

# Open the serial port.
ser = serial.Serial(serial_port, baud_rate)

# Get a reference to the Realtime Database root.
ref = db.reference("/")

# Store the previous weight so Firebase is updated only when the value changes.
previous_weight_value = None

try:
    while True:
        # Read one line from the serial port.
        line = ser.readline().decode("utf-8").strip()

        # Convert serial data to an integer and update Firebase.
        try:
            weight_value = int(line)

            # Write only when the new value differs from the previous one.
            if previous_weight_value is None or weight_value != previous_weight_value:
                ref.update({"Weight": weight_value})
                print("Weight updated to:", weight_value)
                previous_weight_value = weight_value
        except ValueError:
            print("Invalid data received from serial.")

except KeyboardInterrupt:
    # Close the serial port when the program exits.
    ser.close()
    print("Serial port closed.")
