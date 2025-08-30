import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import joblib
import numpy as np
from scipy.sparse import hstack

df = pd.read_csv("../tasks_train.csv")
X = df[["category", "priority", "estMinutes"]] # inputs used for prediction 
y = df["completed_on_time"] # answer column used to predict 
y = y.astype(int) # Makes sure labels are 0 or 1 integers
encoder = OneHotEncoder(handle_unknown="ignore")
X_cat = encoder.fit_transform(X[["category", "priority"]])
X_num = X[["estMinutes"]].values
X_all = hstack([X_cat, X_num])

counts = y.value_counts()
min_class = counts.min() if not counts.empty else 0
do_split = min_class >= 2 and len(df) >= 10  

if do_split:
    X_train, X_val, y_train, y_val = train_test_split(
        X_all, y, test_size=0.2, random_state=42, stratify=y
    )
    split_note = "80/20 split used."
else:
    X_train, y_train = X_all, y
    X_val, y_val = X_all, y
    split_note = ( "Not enough data to split, trained on everything and may be wrong." )

model = LogisticRegression(max_iter=1000, class_weight="balanced")
model.fit(X_train, y_train)

if do_split:
    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val)[:, 1]
    acc = accuracy_score(y_val, y_pred)
    f1 = f1_score(y_val, y_pred)
    auc = roc_auc_score(y_val, y_prob)
else:
    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val)[:, 1]
    acc = "N/A"
    f1 = "N/A"
    auc = "N/A"

print(split_note)
print("Label counts:", counts.to_dict())
print("Accuracy:", acc)
print("F1:", f1)
print("AUC:", auc)
joblib.dump((model, encoder), "model.joblib")
print("Model and encoder saved to model.joblib")