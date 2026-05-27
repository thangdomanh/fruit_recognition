import base64
from pathlib import Path
import random
import shutil
import string
import warnings

import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow_hub as hub
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "ml" / "model"
DATA_DIR = BASE_DIR / "ml" / "data" / "archive"
TRAIN_DIR = DATA_DIR / "train"
MODEL_PATH = MODEL_DIR / "model.h5"
CLASS_NAMES_PATH = MODEL_DIR / "kind.txt"

model = tf.keras.models.load_model(MODEL_PATH, custom_objects={"KerasLayer": hub.KerasLayer})


def random_string(length=8):
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def preprocess_image(image):
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [224, 224])
    image = tf.expand_dims(image, axis=0)
    return image / 255.0


@app.route("/save_photo", methods=["POST"])
def save_photo():
    data = request.get_json()
    username = data["username"]
    photo_data = data["photo"]

    user_path = TRAIN_DIR / username
    user_path.mkdir(parents=True, exist_ok=True)

    photo_bytes = base64.b64decode(photo_data.split(",")[1])
    filepath = user_path / f"{random_string()}.jpg"

    with open(filepath, "wb") as f:
        f.write(photo_bytes)

    return jsonify({"message": "Photo saved successfully!"})


@app.route("/list_folders", methods=["GET"])
def list_folders():
    folders = [folder.name for folder in TRAIN_DIR.iterdir() if folder.is_dir()]
    return jsonify(folders)


@app.route("/delete_folder", methods=["DELETE"])
def delete_folder():
    folder_name = request.args.get("folder")
    folder_path = TRAIN_DIR / folder_name

    if folder_path.exists():
        shutil.rmtree(folder_path)
        return jsonify({"message": f"Folder '{folder_name}' deleted successfully!"})

    return jsonify({"message": f"Folder '{folder_name}' does not exist!"})


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    if not CLASS_NAMES_PATH.exists():
        return jsonify({"error": "Class names file not found"}), 500

    with open(CLASS_NAMES_PATH, "r") as file:
        class_names = [line.strip() for line in file.readlines()]

    image_file = request.files["image"].read()
    image = preprocess_image(image_file)
    predictions = model.predict(image)

    class_index = np.argmax(predictions[0])
    class_label = class_names[class_index]
    class_probability = predictions[0][class_index]

    return jsonify(
        {"class_label": class_label, "class_probability": float(class_probability)}
    )


@app.route("/train_model", methods=["POST"])
def train_model():
    kinds = np.array([folder.name for folder in TRAIN_DIR.iterdir() if folder.is_dir()])
    kind_path = [TRAIN_DIR / kind for kind in kinds]

    id_df = []
    for kind in kind_path:
        jpg_files = [img.stem for img in kind.iterdir() if img.suffix.lower() == ".jpg"]
        id_df.extend(jpg_files)

    kind_df = []
    for kind in kinds:
        jpg_files = [
            img.stem
            for img in (TRAIN_DIR / kind).iterdir()
            if img.suffix.lower() == ".jpg"
        ]
        for _ in range(len(jpg_files)):
            kind_df.append(kind)

    pd.DataFrame({"id": id_df, "kind": kind_df})

    filenames = []
    for kind in kind_path:
        jpg_files = [str(img) for img in kind.iterdir() if img.suffix.lower() == ".jpg"]
        filenames.extend(jpg_files)

    label_to_index = {label: index for index, label in enumerate(kinds)}
    y = [label_to_index[label] for label in kind_df]

    X_train, X_test, y_train, y_test = train_test_split(
        filenames, y, test_size=0.2, random_state=18
    )

    img_size = 224
    batch_size = 32

    def process_image(image_path):
        image = tf.io.read_file(image_path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.convert_image_dtype(image, tf.float32)
        return tf.image.resize(image, size=[img_size, img_size])

    def get_image_label(image_path, label):
        return process_image(image_path), label

    def create_data_batches(X, labels):
        data = tf.data.Dataset.from_tensor_slices((tf.constant(X), tf.constant(labels)))
        data = data.shuffle(buffer_size=len(X))
        data = data.map(get_image_label)
        return data.batch(batch_size)

    train_data = create_data_batches(X_train, y_train)
    test_data = create_data_batches(X_test, y_test)

    new_model = tf.keras.Sequential(
        [
            hub.KerasLayer(
                "https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4",
                input_shape=[img_size, img_size, 3],
            ),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dense(units=len(kinds), activation="softmax"),
        ]
    )

    new_model.compile(
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        optimizer=tf.keras.optimizers.Adam(),
        metrics=["accuracy"],
    )

    early_stopping = tf.keras.callbacks.EarlyStopping(monitor="accuracy", patience=3)
    new_model.fit(train_data, epochs=10, callbacks=[early_stopping], validation_data=test_data)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for file_path in MODEL_DIR.iterdir():
        try:
            if file_path.is_file() or file_path.is_symlink():
                file_path.unlink()
            elif file_path.is_dir():
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

    new_model.save(MODEL_PATH)

    with open(CLASS_NAMES_PATH, "w") as file:
        for item in kinds:
            file.write(f"{item}\n")

    global model
    model = tf.keras.models.load_model(MODEL_PATH, custom_objects={"KerasLayer": hub.KerasLayer})

    return jsonify({"message": "Model trained and saved successfully!"})


if __name__ == "__main__":
    TRAIN_DIR.mkdir(parents=True, exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=3000)
