import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import warnings
from flask import Flask, request, jsonify
from flask_cors import CORS

warnings.filterwarnings("ignore")

# Initialize Flask app
app = Flask(__name__)
CORS(app)
# Load the trained model
model_path = "client/src/predict/model.h5"
model = tf.keras.models.load_model(model_path, custom_objects={'KerasLayer': hub.KerasLayer})

# List of class names
class_names = ['capsicum', 'sweetcorn', 'orange', 'tomato', 'turnip', 'ginger',
               'raddish', 'pomegranate', 'pineapple', 'jalapeno', 'apple',
               'carrot', 'lettuce', 'bell pepper', 'eggplant', 'beetroot', 'kiwi',
               'pear', 'cabbage', 'cauliflower', 'paprika', 'lemon',
               'sweetpotato', 'grapes', 'cucumber', 'corn', 'banana', 'garlic',
               'chili pepper', 'watermelon', 'mango', 'peas', 'onion', 'potato',
               'spinach', 'soy beans']

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)
