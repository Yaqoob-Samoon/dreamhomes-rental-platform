# 🏠 DreamHomes — AI-Powered Real Estate Rental Platform

DreamHomes is a full-stack real estate rental platform built with **React**, **FastAPI**, and **PostgreSQL**, featuring three integrated Machine Learning and NLP systems to help tenants find fair-priced homes and landlords list properties effectively.

---

## ✨ Key Features

### 🤖 AI & Machine Learning Modules
1. **AI Fair Rent Predictor (Supervised ML — Random Forest Regressor)**
   - Predicts fair market rent and a confidence range (min–max) based on city, area, bedrooms, bathrooms, furnishing, and parking.
   - Served via a pre-trained Scikit-Learn model (`ai_rent_model.pkl`) loaded directly on FastAPI startup.
2. **Property Recommendation Engine (Unsupervised ML — K-Nearest Neighbors)**
   - Dynamically trains a KNN model (`metric='cosine'`) on live published PostgreSQL inventory.
   - Builds a normalized **User Profile Vector** from a tenant's favorited properties to recommend the most mathematically similar listings in real time.
3. **Smart AI Assistant Chatbot (NLP & Context Memory)**
   - Floating chat widget supporting natural language queries in English and Roman Urdu (e.g., *"Karachi mein 50k tak ka 3 bed ghr chahiye"*).
   - Extracts city aliases, budgets (`k`, `lac`, `lakh`), bedroom counts, property types, and sorting intent (`cheap`/`sasta` vs. `luxury`).
   - Maintains conversation context (`context_ids`) to answer follow-up questions like *"in mein se sab se behtar konsa hai?"*.

### 👥 Role-Based Platform Capabilities
- **Tenant:** Register/login with OTP verification, search & filter listings, view property details, check AI fair rent, save favorites, receive personalized KNN recommendations, send inquiries, and chat with landlords.
- **Landlord:** Add/edit/delete properties, upload multiple images via Cloudinary, get AI fair-rent estimates, submit listings for admin review, renew 30-day listings, and manage tenant inquiries.
- **Admin:** Review, approve (with automatic 30-day expiry), or reject submitted properties, manage users, and oversee platform activity.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, React Router, Axios, Lucide Icons |
| **Backend** | Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| **Database** | PostgreSQL |
| **AI / ML** | Scikit-Learn (`RandomForestRegressor`, `NearestNeighbors`), NumPy, Joblib, Python Regex (NLP) |
| **Media & Auth** | Cloudinary (Image Hosting), JWT Authentication, OTP Email Verification |

---

## 📁 Project Structure

```text
rental-platform/
├── backend/
│   ├── app/
│   │   ├── core/           # Database & config setup
│   │   ├── routers/        # Auth, Properties, AI/ML, Chat endpoints
│   │   ├── main.py         # FastAPI entry point
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   └── schemas.py      # Pydantic validation schemas
│   ├── ai_rent_model.pkl   # Trained Random Forest model
│   └── venv/               # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Layout, AIChatbotWidget, etc.
│   │   ├── pages/          # Home, Dashboard, Register, PropertyDetails, Admin
│   │   └── App.jsx         # Application routes
│   └── package.json
├── ml/                     # Reserved for standalone ML experiments/datasets
└── README.md