import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE

def transform_data(df, time_steps=5, test_size=0.2, random_state=42):
    """
    Transforms the preprocessed dataframe by encoding categorical features,
    splitting the data, applying SMOTE to the training set (to prevent data leakage),
    and converting static data into a time-series representation (sliding window).
    """
    print("Encoding categorical variables...")
    # 1. Encode categorical variables using One-Hot Encoding
    categorical_cols = df.select_dtypes(include=['object', 'bool']).columns
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    
    # Separate features and targets
    targets = ['target_diabetes', 'target_heart', 'target_stroke']
    X = df_encoded.drop(columns=targets)
    y = df_encoded[targets]
    
    print("Performing Train-Test split (80/20)...")
    # 2. Train-Test Split BEFORE SMOTE to prevent data leakage into the test set
    X_train_orig, X_test, y_train_orig, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y['target_stroke']
    )
    
    print("Applying SMOTE on the training set for stroke class imbalance...")
    # 3. Apply SMOTE specifically for the stroke dataset
    # We append the other targets to X temporarily so they are preserved and interpolated
    # synchronously with the features.
    y_train_stroke = y_train_orig['target_stroke']
    X_train_temp = pd.concat([X_train_orig, y_train_orig[['target_diabetes', 'target_heart']]], axis=1)
    
    smote = SMOTE(random_state=random_state)
    X_train_res_temp, y_train_stroke_res = smote.fit_resample(X_train_temp, y_train_stroke)
    
    # Extract the other targets back and round them (since SMOTE outputs floats for interpolated points)
    y_train_res = X_train_res_temp[['target_diabetes', 'target_heart']].copy()
    y_train_res['target_stroke'] = y_train_stroke_res
    
    y_train_res['target_diabetes'] = y_train_res['target_diabetes'].round().astype(int)
    y_train_res['target_heart'] = y_train_res['target_heart'].round().astype(int)
    
    X_train_res = X_train_res_temp.drop(columns=['target_diabetes', 'target_heart'])
    
    print(f"Applying sliding window (T={time_steps}) to convert to time-series...")
    # 4. Time-Series Conversion (Sliding Window Replication)
    # The thesis replicates static tabular data across T=5 time steps.
    # New shape: (Num_Samples, Time_Steps, Num_Features)
    X_train_array = X_train_res.values
    X_test_array = X_test.values
    
    # np.newaxis adds the time dimension, np.tile replicates along it
    X_train_series = np.tile(X_train_array[:, np.newaxis, :], (1, time_steps, 1))
    X_test_series = np.tile(X_test_array[:, np.newaxis, :], (1, time_steps, 1))
    
    y_train_final = y_train_res.values
    y_test_final = y_test.values
    
    return X_train_series, X_test_series, y_train_final, y_test_final

if __name__ == "__main__":
    import os
    import sys
    
    # Add src to path to import preprocess
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from preprocess import load_and_preprocess_data
    
    data_directory = os.path.join(os.path.dirname(__file__), '..', 'data')
    print("Step 1: Loading and preprocessing data...")
    df = load_and_preprocess_data(data_directory)
    
    print("\nStep 2: Applying data transformations...")
    X_train, X_test, y_train, y_test = transform_data(df, time_steps=5)
    
    print("\nTransformation Complete!")
    print("-" * 30)
    print(f"X_train shape: {X_train.shape} (Samples, Time Steps, Features)")
    print(f"X_test shape:  {X_test.shape}")
    print(f"y_train shape: {y_train.shape} (target_diabetes, target_heart, target_stroke)")
    print(f"y_test shape:  {y_test.shape}")
