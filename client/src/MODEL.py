import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

# Function to preprocess the image
def preprocess_image(image_path):
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [224, 224])  # Resize to match the model input shape
    image = tf.expand_dims(image, axis=0)  # Add batch dimension
    image /= 255.0  # Normalize to [0, 1] range
    return image

# Correct handle to the TensorFlow Hub module
hub_handle = "https://tfhub.dev/google/tf2-preview/mobilenet_v2/classification/4"
model_path = "C://fruit_recognition/client/src/predict/model.h5"
# Define a function to create a KerasLayer with the correct handle
def custom_keras_layer(config):
    return hub.KerasLayer(hub_handle, **config)

# Load the trained model using the custom KerasLayer
model_path = "C://fruit_recognition/client/src/predict/model.h5"
model = tf.keras.models.load_model(model_path, custom_objects={'KerasLayer': custom_keras_layer})

# Path to the test image
test_image_path = 'C:/fruit_recognition/client/src/predict/Image/Image_1.jpg'

# Preprocess the test image
test_image = preprocess_image(test_image_path)

# Use the loaded model to predict the class of the test image
predictions = model.predict(test_image)

# Get the top 5 class indices and corresponding probabilities
top5_indices = np.argsort(predictions[0])[-5:][::-1]
top5_probabilities = predictions[0][top5_indices]

# Get the corresponding class labels
class_names = ('capsicum', 'sweetcorn', 'orange', 'tomato', 'turnip', 'ginger',
       'raddish', 'pomegranate', 'pineapple', 'jalepeno', 'apple',
       'carrot', 'lettuce', 'bell pepper', 'eggplant', 'beetroot', 'kiwi',
       'pear', 'cabbage', 'cauliflower', 'paprika', 'lemon',
       'sweetpotato', 'grapes', 'cucumber', 'corn', 'banana', 'garlic',
       'chilli pepper', 'watermelon', 'mango', 'peas', 'onion', 'potato',
       'spinach', 'soy beans') # Replace with the actual list of class names
top5_labels = [class_names[i] for i in top5_indices]

# Display the top 5 predictions
print("Top 5 Predictions:")
for label, probability in zip(top5_labels, top5_probabilities):
    print(f"{label}: {probability:.4f}")

# Display the predicted class
class_index = np.argmax(predictions[0])
class_label = class_names[class_index]
print(f"\nThe predicted class of the test image is: {class_label}")
