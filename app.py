from flask import Flask, request, jsonify
import os
import base64
import random
import string
import shutil
from flask_cors import CORS, cross_origin  # Import thêm thư viện Flask-CORS
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import warnings
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import tensorflow_hub as hub
import os
from IPython.display import Image
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from matplotlib.pyplot import imread
from sklearn.metrics import classification_report, accuracy_score
from tensorflow.keras.preprocessing.image import ImageDataGenerator # type: ignore
import warnings
warnings.filterwarnings("ignore")
import kagglehub
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app) 
# Load the trained model

model_path = "client/src/predict/model/model.h5"
model = tf.keras.models.load_model(model_path, custom_objects={'KerasLayer': hub.KerasLayer})
IMG_PATH = 'C:/fruit_recognition/client/src/predict/archive/train/'

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@app.route('/save_photo', methods=['POST'])
def save_photo():
    data = request.get_json()
    username = data['username']
    photo_data = data['photo']

    user_path = os.path.join(IMG_PATH, username)
    if not os.path.exists(user_path):
        os.makedirs(user_path)

    photo_data = photo_data.split(',')[1]
    photo_bytes = base64.b64decode(photo_data)
    filename = f"{random_string()}.jpg"
    filepath = os.path.join(user_path, filename)

    with open(filepath, 'wb') as f:
        f.write(photo_bytes)

    return jsonify({"message": "Photo saved successfully!"})

@app.route('/list_folders', methods=['GET'])
def list_folders():
    image_path = 'C:/fruit_recognition/client/src/predict/archive/train'
    folders = [folder for folder in os.listdir(image_path) if os.path.isdir(os.path.join(image_path, folder))]
    return jsonify(folders)

@app.route('/delete_folder', methods=['DELETE'])
def delete_folder():
    folder_name = request.args.get('folder')
    folder_path = os.path.join(IMG_PATH, folder_name)
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
        return jsonify({"message": f"Folder '{folder_name}' deleted successfully!"})
    else:
        return jsonify({"message": f"Folder '{folder_name}' does not exist!"})
    

def preprocess_image(image):
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [224, 224])  # Resize to match the model input shape
    image = tf.expand_dims(image, axis=0)  # Add batch dimension
    image /= 255.0  # Normalize to [0, 1] range
    return image

@app.route('/predict', methods=['POST'])
def predict():

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    # Load class names from kind.txt
    kind_df_path = "C:/fruit_recognition/client/src/predict/model/kind.txt"
    if not os.path.exists(kind_df_path):
        return jsonify({'error': 'Class names file not found'}), 500

    with open(kind_df_path, "r") as file:
        class_names = [line.strip() for line in file.readlines()]
    image_file = request.files['image'].read()
    image = preprocess_image(image_file)
    predictions = model.predict(image)

    class_index = np.argmax(predictions[0])
    class_label = class_names[class_index]
    class_probability = predictions[0][class_index]


    response = {
        'class_label': class_label,
        'class_probability': float(class_probability)
    }
    return jsonify(response)

@app.route('/train_model', methods=['POST'])
def train_model():
    kinds = np.array(os.listdir(IMG_PATH))
    path = IMG_PATH
    kind_path = [os.path.join(path, kind) for kind in kinds]
    
    id_df = []
    for kind in kind_path:
        jpg_files = [img.split(".")[0] for img in os.listdir(kind) if img.lower().endswith('.jpg')]
        id_df.extend(jpg_files)

    kind_df = []
    for kind in kinds:
        jpg_files = os.listdir(os.path.join(path, kind))
        jpg_files = [img.split(".")[0] for img in jpg_files if img.lower().endswith('.jpg')]
        for _ in range(len(jpg_files)):
            kind_df.append(kind)

    df = pd.DataFrame({"id": id_df, "kind": kind_df})
    
    filenames = []
    for kind in kind_path:
        jpg_files = [os.path.join(kind, img) for img in os.listdir(kind) if img.lower().endswith('.jpg')]
        filenames.extend(jpg_files)
    
    # Chuyển đổi nhãn sang số nguyên
    label_to_index = {label: index for index, label in enumerate(kinds)}
    y = [label_to_index[label] for label in kind_df]
    
    X = filenames
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=18)

    img_size = 224

    def process_image(image_path, img_size=img_size):
        image = tf.io.read_file(image_path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.convert_image_dtype(image, tf.float32)
        image = tf.image.resize(image, size=[img_size, img_size])
        return image

    def get_image_label(image_path, label):
        image = process_image(image_path)
        return image, label

    batch_size = 32

    def create_data_batches(X, y=None, batch_size=batch_size):
        data = tf.data.Dataset.from_tensor_slices((tf.constant(X), tf.constant(y)))
        data = data.shuffle(buffer_size=len(X))
        data = data.map(get_image_label)
        data_batch = data.batch(batch_size)
        return data_batch

    train_data = create_data_batches(X_train, y_train)
    test_data = create_data_batches(X_test, y_test)

    input_shape = [None, img_size, img_size, 3]
    output_shape = len(kinds)

    model = tf.keras.Sequential([
        hub.KerasLayer("https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4", input_shape=[img_size, img_size, 3]),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(units=output_shape, activation="softmax")
    ])

    model.compile(
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        optimizer=tf.keras.optimizers.Adam(),
        metrics=["accuracy"]
    )

    early_stopping = tf.keras.callbacks.EarlyStopping(monitor="accuracy", patience=3)

    model.fit(train_data, epochs=10, callbacks=[early_stopping], validation_data=test_data)

        # Delete all files in the current directory
    model_dir = "C:/fruit_recognition/client/src/predict/model/"
    for file in os.listdir(model_dir):
        file_path = os.path.join(model_dir, file)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

    # Save the model
    final_model_path = "C:/fruit_recognition/client/src/predict/model/model.h5"
    model.save(final_model_path)

    # Save kinds to a text file
    kind_path = "C:/fruit_recognition/client/src/predict/model/kind.txt"
    with open(kind_path, "w") as file:
        for item in kinds:
            file.write(f"{item}\n")
    model = tf.keras.models.load_model(final_model_path, custom_objects={'KerasLayer': hub.KerasLayer})

    return jsonify({"message": "Model trained and saved successfully!"})

if __name__ == "__main__":
    if not os.path.exists(IMG_PATH):
        os.makedirs(IMG_PATH)
    app.run(debug=True, host='0.0.0.0', port=3000)
