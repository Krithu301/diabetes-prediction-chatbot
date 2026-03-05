# backend/src/model_runner.py
import sys
import json
import joblib
import pandas as pd
import os

def main():
    # Accept JSON either as argv[1] or from stdin
    raw = None
    if len(sys.argv) > 1:
        raw = sys.argv[1]
    else:
        raw = sys.stdin.read()
    data = json.loads(raw)

    # Map frontend keys -> training columns
    column_map = {
        "pregnancies": "Pregnancies",
        "glucose": "Glucose",
        "bloodpressure": "BloodPressure",
        "skinthickness": "SkinThickness",
        "insulin": "Insulin",
        "bmi": "BMI",
        "dpf": "DiabetesPedigreeFunction",
        "age": "Age"
    }

    # Build dict with correct column names and numeric values
    formatted = {column_map[k]: float(v) for k, v in data.items() if k in column_map}

    # Ensure columns order matches training
    cols = ['Pregnancies','Glucose','BloodPressure','SkinThickness','Insulin','BMI','DiabetesPedigreeFunction','Age']
    df = pd.DataFrame([formatted], columns=cols)

    # Load pipeline
    base = os.path.dirname(__file__)
    pipeline_path = os.path.join(base, "..", "best_model.joblib")
    pipeline = joblib.load(pipeline_path)

    # Predict probability (pipeline has preprocessing inside)
    proba = pipeline.predict_proba(df)[0][1]
    label = "High risk" if proba >= 0.5 else "Low risk"

    result = {
        "prob": float(proba),
        "label": label,
        "recommendation": "Consult a doctor for further tests." if label=="High risk" else "Maintain healthy lifestyle; retest periodically."
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
