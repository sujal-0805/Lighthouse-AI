import pickle
import numpy as np
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_PATH = 'model.pkl'

model = None

# Load model
try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        print("Model loaded OK")
    else:
        print("model.pkl not found!")
except Exception as e:
    print(f"Init error: {e}")


@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500
    try:
        data = request.get_json()

        features = np.array([[
            float(data.get('attendance_pct',      80)),
            float(data.get('study_hrs',            2)),
            float(data.get('syllabus_understood',   3)),
            float(data.get('seat_position',         2)),
            float(data.get('screen_time_hrs',       4)),
            float(data.get('ott_hrs_per_week',      2)),
            float(data.get('exam_prep_timing',      3)),
            float(data.get('travel_time_hrs',       1)),
            float(data.get('sleep_hrs',             6)),
            float(data.get('panic_level',           2)),
            float(data.get('midterm_pct',          75)),
        ]])

        # Direct prediction — no scaling needed!
        predicted_score = round(float(model.predict(features)[0]), 2)
        predicted_score = min(max(predicted_score, 35), 100)

        if predicted_score < 50:
            risk = "High Risk"
        elif predicted_score <= 70:
            risk = "Moderate"
        else:
            risk = "On Track"

        return jsonify({"predicted_score": predicted_score, "risk": risk})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        "mae":            4.6,
        "model_type":     "Random Forest Regressor",
        "features_count": 11
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status":       "ok",
        "model_loaded": model is not None
    })


if __name__ == '__main__':
    print("Starting LighthouseAI API on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
