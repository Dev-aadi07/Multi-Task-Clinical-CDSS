import numpy as np
import joblib
import tensorflow as tf
from tensorflow.keras.models import Model
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier

def get_feature_extractor(bilstm_model, layer_name="shared_feature_extractor"):
    """
    Creates a new Keras model that extracts the learned feature representations
    from the specified shared layer of the trained BiLSTM model.
    """
    try:
        shared_layer_output = bilstm_model.get_layer(layer_name).output
        feature_extractor = Model(inputs=bilstm_model.input, outputs=shared_layer_output)
        return feature_extractor
    except ValueError as e:
        raise ValueError(f"Could not find layer '{layer_name}'. Ensure the BiLSTM model is built properly.") from e

def extract_features(feature_extractor, X_data, batch_size=32):
    """
    Passes the time-series data through the BiLSTM up to the shared layer
    to yield the static, learned representations.
    """
    return feature_extractor.predict(X_data, batch_size=batch_size)

def build_hybrid_ensemble():
    """
    Builds the Hybrid Ensemble Model (Bagging, Boosting, Stacking)
    using scikit-learn.
    """
    # 1. Base Learners
    # Bagging Component: Random Forest
    rf_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    
    # Boosting Component: Gradient Boosting
    # (Using scikit-learn's built-in GradientBoosting to ensure compatibility)
    gb_clf = GradientBoostingClassifier(n_estimators=100, random_state=42)
    
    base_learners = [
        ('rf', rf_clf),
        ('gb', gb_clf)
    ]
    
    # 2. Meta-Learner for Stacking
    # Logistic Regression is a robust meta-learner for binary classification tasks
    meta_learner = LogisticRegression()
    
    # 3. Stacking Classifier (The Stacking Component)
    stacking_clf = StackingClassifier(
        estimators=base_learners,
        final_estimator=meta_learner,
        cv=5
    )
    
    # 4. Multi-Output Wrapper
    # Wraps the StackingClassifier to handle the 3 concurrent disease targets 
    # (Diabetes, Heart Disease, Stroke). 
    # Note: If sequential inter-disease dependency is desired (as hinted in the thesis),
    # this could be swapped with sklearn.multioutput.ClassifierChain.
    multi_target_ensemble = MultiOutputClassifier(stacking_clf, n_jobs=-1)
    
    return multi_target_ensemble

def train_hybrid_ensemble(ensemble_model, X_train_features, y_train):
    """
    Trains the hybrid ensemble model on the shared features extracted from the BiLSTM.
    """
    print("Training Hybrid Ensemble Model... (This may take a moment)")
    ensemble_model.fit(X_train_features, y_train)
    return ensemble_model

def save_hybrid_pipeline(ensemble_model, filepath='hybrid_ensemble_model.pkl'):
    """
    Saves the trained hybrid model pipeline for future use in the web app.
    """
    joblib.dump(ensemble_model, filepath)
    print(f"Ensemble model saved successfully to {filepath}")

def load_hybrid_pipeline(filepath='hybrid_ensemble_model.pkl'):
    """
    Loads the trained hybrid model pipeline.
    """
    return joblib.load(filepath)

if __name__ == "__main__":
    import os
    import sys
    
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from bilstm_model import get_models
    
    print("1. Creating uncompiled BiLSTM model...")
    uncompiled, _ = get_models(time_steps=5, num_features=41)
    
    print("2. Setting up Feature Extractor (Targeting 'shared_feature_extractor')...")
    extractor = get_feature_extractor(uncompiled)
    
    print("3. Generating dummy time-series data for testing...")
    X_dummy = np.random.rand(100, 5, 41)
    y_dummy = np.random.randint(0, 2, size=(100, 3))
    
    print("4. Extracting features from BiLSTM shared layer...")
    X_features = extract_features(extractor, X_dummy)
    print(f"   -> Extracted features shape: {X_features.shape}")
    
    print("5. Building Hybrid Ensemble Pipeline...")
    hybrid_model = build_hybrid_ensemble()
    
    print("6. Training Hybrid Ensemble on extracted features...")
    trained_hybrid_model = train_hybrid_ensemble(hybrid_model, X_features, y_dummy)
    
    print("7. Evaluating on dummy data...")
    score = trained_hybrid_model.score(X_features, y_dummy)
    print(f"   -> Dummy Accuracy Score: {score:.4f}")
    
    print("8. Saving the model pipeline...")
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    save_path = os.path.join(models_dir, 'hybrid_ensemble_model.pkl')
    save_hybrid_pipeline(trained_hybrid_model, save_path)
