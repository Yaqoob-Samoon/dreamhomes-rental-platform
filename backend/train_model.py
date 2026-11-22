import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

print("1. Generating Pakistan Real Estate Dataset...")
np.random.seed(42)
n_samples = 10000

cities = ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'hyderabad', 'peshawar']
city_encoded = np.random.randint(0, len(cities), n_samples)

area = np.random.randint(200, 5000, n_samples)
bedrooms = np.random.randint(1, 8, n_samples)
bathrooms = np.random.randint(1, 8, n_samples)
furnished = np.random.randint(0, 2, n_samples)
parking = np.random.randint(0, 2, n_samples)

# Base market logic for training data with realistic variance
base_rates = [45.0, 40.0, 55.0, 30.0, 25.0, 28.0]
rent = np.zeros(n_samples)

for i in range(n_samples):
    r = area[i] * base_rates[city_encoded[i]]
    r += (bedrooms[i] * 4000) + (bathrooms[i] * 2000)
    if furnished[i]: r *= 1.25
    if parking[i]: r += 3000
    
    # Introduce market noise (15% variance) so the model learns patterns, not just formulas
    rent[i] = r * np.random.uniform(0.85, 1.15)

X = np.column_stack((city_encoded, area, bedrooms, bathrooms, furnished, parking))
y = rent

print("2. Training RandomForestRegressor AI Model...")
model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
model.fit(X, y)

print("3. Evaluating Model Accuracy...")
score = model.score(X, y)
print(f"R^2 Score: {score:.4f}")

model_path = os.path.join(os.path.dirname(__file__), 'ai_rent_model.pkl')
joblib.dump(model, model_path)
print(f"✅ Enterprise AI Model compiled and saved successfully as '{model_path}'")