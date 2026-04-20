import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def load_and_preprocess_data(data_dir):
    """
    Loads diabetes, heart disease, and stroke datasets, combines them,
    handles missing values, and applies Min-Max scaling as per Chapter 3
    of the thesis methodology.
    """
    # 1. Load datasets
    diabetes_path = os.path.join(data_dir, 'diabetes.csv')
    heart_path = os.path.join(data_dir, 'heart.csv')
    stroke_path = os.path.join(data_dir, 'stroke.csv')
    
    df_diabetes = pd.read_csv(diabetes_path)
    df_heart = pd.read_csv(heart_path)
    df_stroke = pd.read_csv(stroke_path)
    
    # 2. Standardize column names (lowercase) to naturally align shared features like 'Age' and 'BMI'
    df_diabetes.columns = [col.lower() for col in df_diabetes.columns]
    df_heart.columns = [col.lower() for col in df_heart.columns]
    df_stroke.columns = [col.lower() for col in df_stroke.columns]
    
    # Pre-process target variables to represent binary classification as per thesis
    # Heart disease target is 'num' (>0 means disease)
    if 'num' in df_heart.columns:
        df_heart['num'] = (df_heart['num'] > 0).astype(int)
        
    # Rename target variables for clarity in multi-task learning
    df_diabetes.rename(columns={'outcome': 'target_diabetes'}, inplace=True)
    df_heart.rename(columns={'num': 'target_heart'}, inplace=True)
    df_stroke.rename(columns={'stroke': 'target_stroke'}, inplace=True)
    
    # 3. Combine into a single unified dataset
    df_combined = pd.concat([df_diabetes, df_heart, df_stroke], axis=0, ignore_index=True)
    
    # 4. Data Cleaning
    # Remove irrelevant identifiers
    if 'id' in df_combined.columns:
        df_combined.drop(columns=['id'], inplace=True)
        
    # Handle string 'N/A' or 'Unknown' as NaN for proper imputation later
    df_combined.replace({'N/A': np.nan, 'Unknown': np.nan}, inplace=True)
    
    # Ensure numerical columns are properly cast (e.g., BMI might be object due to 'N/A')
    for col in df_combined.columns:
        if df_combined[col].dtype == 'object':
            try:
                df_combined[col] = pd.to_numeric(df_combined[col])
            except ValueError:
                pass # keep as object if it's truly categorical
                
    # Separate columns by data type
    numerical_cols = df_combined.select_dtypes(include=['int64', 'float64']).columns
    categorical_cols = df_combined.select_dtypes(include=['object', 'bool']).columns
    
    # 5. Handle Missing Values
    # Median imputation for numerical features
    for col in numerical_cols:
        median_val = df_combined[col].median()
        if pd.isna(median_val):
            median_val = 0 # Fallback in case a column is entirely NaN
        df_combined[col] = df_combined[col].fillna(median_val)
        
    # Mode imputation for categorical features
    for col in categorical_cols:
        mode_series = df_combined[col].mode()
        if not mode_series.empty:
            mode_val = mode_series[0]
            df_combined[col] = df_combined[col].fillna(mode_val)
        else:
            df_combined[col] = df_combined[col].fillna("Missing")
            
    # 6. Feature Scaling
    # Min-max normalization for numerical features to [0, 1]
    scaler = MinMaxScaler(feature_range=(0, 1))
    df_combined[numerical_cols] = scaler.fit_transform(df_combined[numerical_cols])
    
    return df_combined

if __name__ == "__main__":
    # Basic execution test
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_directory = os.path.join(current_dir, '..', 'data')
    
    try:
        processed_df = load_and_preprocess_data(data_directory)
        print(f"Data preprocessing successful.")
        print(f"Combined dataset shape: {processed_df.shape}")
        print("Features have been scaled and missing values imputed.")
        print("\nFirst 5 rows of target variables:")
        print(processed_df[['target_diabetes', 'target_heart', 'target_stroke']].head())
    except Exception as e:
        print(f"Error during preprocessing: {e}")
