import os
import sys
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
import tensorflow as tf

# Adjust path to import our local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from bilstm_model import get_models
from hybrid_ensemble import get_feature_extractor

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Disease Prediction API",
    description="Multi-Task Learning Hybrid Ensemble API for predicting Diabetes, Heart Disease, and Stroke based on clinical features.",
    version="1.0"
)

# Enable CORS for the Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold models
hybrid_model = None
extractor = None

# Exact 41 features required by the pipeline (post-preprocessing/OHE layout)
FEATURE_KEYS = [
    'pregnancies', 'glucose', 'bloodpressure', 'skinthickness', 'insulin', 'bmi', 
    'diabetespedigreefunction', 'age', 'trestbps', 'chol', 'fbs', 'thalch', 'exang', 
    'oldpeak', 'ca', 'hypertension', 'heart_disease', 'avg_glucose_level', 'sex_Male', 
    'dataset_Hungary', 'dataset_Switzerland', 'dataset_VA Long Beach', 'cp_atypical angina', 
    'cp_non-anginal', 'cp_typical angina', 'restecg_normal', 'restecg_st-t abnormality', 
    'slope_flat', 'slope_upsloping', 'thal_normal', 'thal_reversable defect', 'gender_Male', 
    'gender_Other', 'ever_married_Yes', 'work_type_Never_worked', 'work_type_Private', 
    'work_type_Self-employed', 'work_type_children', 'residence_type_Urban', 
    'smoking_status_never smoked', 'smoking_status_smokes'
]

@app.on_event("startup")
def load_pipelines():
    """
    Loads the saved hybrid ensemble pipeline and sets up the BiLSTM feature extractor
    into memory on server startup.
    """
    global hybrid_model, extractor
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')
    hybrid_path = os.path.join(models_dir, 'hybrid_ensemble_model.pkl')
    
    print("Loading Hybrid Ensemble Pipeline...")
    try:
        hybrid_model = joblib.load(hybrid_path)
        print("Hybrid Ensemble loaded successfully.")
    except FileNotFoundError:
        print(f"WARNING: Hybrid model not found at {hybrid_path}. Ensure Step 4 was run.")
        
    print("Initializing BiLSTM Feature Extractor...")
    uncompiled_bilstm, _ = get_models(time_steps=5, num_features=41)
    extractor = get_feature_extractor(uncompiled_bilstm)
    print("API is ready to serve predictions.")

class PatientFeatures(BaseModel):
    """
    Pydantic Model to strictly validate incoming JSON payload covering all 41 inputs.
    Using aliases to map clean API keys to exactly match the model's expected column names.
    """
    pregnancies: float = 0.0
    glucose: float = Field(0.0, description="Plasma glucose concentration")
    bloodpressure: float = Field(0.0, description="Diastolic blood pressure")
    skinthickness: float = 0.0
    insulin: float = 0.0
    bmi: float = Field(0.0, description="Body mass index")
    diabetespedigreefunction: float = 0.0
    age: float = Field(0.0, description="Age in years")
    trestbps: float = 0.0
    chol: float = 0.0
    fbs: float = 0.0
    thalch: float = 0.0
    exang: float = 0.0
    oldpeak: float = 0.0
    ca: float = 0.0
    hypertension: float = 0.0
    heart_disease: float = 0.0
    avg_glucose_level: float = 0.0
    sex_Male: float = 0.0
    dataset_Hungary: float = 0.0
    dataset_Switzerland: float = 0.0
    dataset_VA_Long_Beach: float = Field(0.0, alias="dataset_VA Long Beach")
    cp_atypical_angina: float = Field(0.0, alias="cp_atypical angina")
    cp_non_anginal: float = Field(0.0, alias="cp_non-anginal")
    cp_typical_angina: float = Field(0.0, alias="cp_typical angina")
    restecg_normal: float = 0.0
    restecg_st_t_abnormality: float = Field(0.0, alias="restecg_st-t abnormality")
    slope_flat: float = 0.0
    slope_upsloping: float = 0.0
    thal_normal: float = 0.0
    thal_reversable_defect: float = Field(0.0, alias="thal_reversable defect")
    gender_Male: float = 0.0
    gender_Other: float = 0.0
    ever_married_Yes: float = 0.0
    work_type_Never_worked: float = 0.0
    work_type_Private: float = 0.0
    work_type_Self_employed: float = Field(0.0, alias="work_type_Self-employed")
    work_type_children: float = 0.0
    residence_type_Urban: float = 0.0
    smoking_status_never_smoked: float = Field(0.0, alias="smoking_status_never smoked")
    smoking_status_smokes: float = 0.0

@app.post("/predict")
def predict_risk(patient: PatientFeatures):
    """
    POST endpoint to predict risk scores for Diabetes, Heart Disease, and Stroke.
    """
    if hybrid_model is None or extractor is None:
        raise HTTPException(status_code=500, detail="Models are not loaded correctly.")
        
    # 1. Convert validated Pydantic model to feature array respecting exact column order
    feature_dict = patient.model_dump(by_alias=True)
    try:
        x_array = np.array([[feature_dict[k] for k in FEATURE_KEYS]], dtype=np.float32)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing feature key: {e}")
        
    # 2. Sliding Window Logic (T=5)
    # Replicate static tabular data across T=5 time steps as defined in thesis methodology
    x_series = np.tile(x_array[:, np.newaxis, :], (1, 5, 1))
    
    # 3. Extract deep feature representations via BiLSTM shared layer
    try:
        dl_features = extractor.predict(x_series, verbose=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BiLSTM feature extraction failed: {e}")
        
    # 4. Predict risk probability scores via Hybrid Ensemble
    try:
        # MultiOutputClassifier predicts list of arrays, one per target [Diabetes, Heart, Stroke]
        proba_list = hybrid_model.predict_proba(dl_features)
        
        # Safely extract probability of the positive class (index 1)
        def get_positive_prob(probs):
            return float(probs[0][1]) if probs.shape[1] > 1 else float(probs[0][0])
            
        prob_diabetes = get_positive_prob(proba_list[0])
        prob_heart = get_positive_prob(proba_list[1])
        prob_stroke = get_positive_prob(proba_list[2])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid Ensemble prediction failed: {e}")
        
    # 5. Return structured JSON response
    return {
        "status": "success",
        "risk_probabilities": {
            "Diabetes": round(prob_diabetes, 4),
            "Heart Disease": round(prob_heart, 4),
            "Stroke": round(prob_stroke, 4)
        },
        "message": "Prediction generated successfully using the Hybrid BiLSTM-Ensemble model."
    }

if __name__ == "__main__":
    print("Starting FastAPI Server...")
    # Standard code block to run the server using uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
