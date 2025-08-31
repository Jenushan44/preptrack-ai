# PrepTrack AI

PrepTrack AI is an AI-powered productivity and planning tool built with Next.js, FastAPI and OpenAI. It helps users turn any goals whether it is studying for exams or training for fitness into structured tasks with intelligent predictions about task difficuly. 

Table of Contents
- [Motivation](#motivation)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Future Improvements](#future-improvements)

## Motivation

It is difficuly to turn a big goal into daily steps you’ll actually do. I wanted a simple tool where I can:
- Write a goal like “Finish Assignment” 
- Get a plain list of suggested tasks to start working from.
- See a difficulty hint (Likely / 50-50 / Tough) so I can plan my day better.
- Keep everything in one place.

This project also helped me:
- Practice full-stack development with Next.js and Firebase.
- Build a small prediction service in Python (FastAPI + scikit-learn).
- Create a data path from Firestore → CSV → model → back into the UI.
- Make something that’s not just for students—works for fitness, reading, shows, assignments, and personal projects.

## Features

- Task Suggestions: A server endpoint takes your goal text and returns a list of tasks (e.g., Study / Practice / Review).
- Firestore Storage: Suggested tasks are saved per user.
- Export to CSV: A script dumps tasks from Firestore into tasks_train.csv for training.
- Prediction Service (FastAPI): A small Python service returns a probability for each task.
- Batch Predictions: Send multiple tasks at once to get a list of probabilities.

## Technologies Used 

- Frontend: Next.js (React, App Router), TailwindCSS
- Backend (App): Next.js API Routes, Firebase Firestore
- Prediction Service: Python, FastAPI, scikit-learn, joblib, Uvicorn

## Future Improvements

- Auth: Google login/logout and email/password via Firebase Auth.
- Daily & Long-Term Scheduling: Break multi-month goals into weekly/daily plans.
- Auto Rebalancing: If tasks are missed, shift the remaining plan forward.
- Calendar Sync: Push to Google Calendar with reminders.
- Personalized Difficulty: Adjust predictions using each user’s history (time of day, streaks).
- Progress & Labels: Mark complete/missed, create clean labels for training and show progress stats.
- Dashboard: See completion rates, time spent, best hours of the day.
