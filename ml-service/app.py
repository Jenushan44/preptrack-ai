from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from scipy.sparse import hstack
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
model, encoder = joblib.load("model.joblib")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class TaskIn(BaseModel): 
    category: str
    priority: str 
    estMinutes: float 


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(task: TaskIn):
    one_task_dict = {
        "category": task.category,
        "priority": task.priority,
        "estMinutes": task.estMinutes,
    }

    task_list = [one_task_dict]
    df = pd.DataFrame(task_list) # Turns list into pandas DataFrame
    cat_features = df[["category", "priority"]]
    X_cat = encoder.transform(cat_features)
    X_num = df[["estMinutes"]].values
    X = hstack([X_cat, X_num])
    probabilities = model.predict_proba(X)
    p = float(probabilities[0][1]) # Takes first row and second column
    return { "p" : p }


@app.post("/predict-batch")
def predict_batch(tasks: list[TaskIn]):
   
    if not tasks:
        return {"p": []}

    task_dicts = []
    for t in tasks: # converts each object into a dictionary 
        row = {
            "category": t.category,
            "priority": t.priority,
            "estMinutes": t.estMinutes,
        }
        task_dicts.append(row)

    df = pd.DataFrame(task_dicts)
    cat_features = df[["category", "priority"]]
    X_cat = encoder.transform(cat_features)
    X_num = df[["estMinutes"]].values
    X = hstack([X_cat, X_num])
    probabilities = model.predict_proba(X) # Getst he probabilities for all the rows 
    ps = probabilities[:, 1]
    ps_list = ps.tolist()
    return {"p": ps_list}