# 🏔 Snowsport Management System

Εφαρμογή διαχείρισης μαθημάτων σκι και snowboard.

## 📋 Προαπαιτούμενα

- Node.js v18+
- PostgreSQL 18
- npm

## 🚀 Εγκατάσταση

### 1. Κλωνοποίηση repository
```bash
git clone https://github.com/BachasTheofanisDev/snowsport-management.git
cd snowsport-management
```

### 2. Backend
```bash
cd backend
npm install
```

Δημιούργησε αρχείο `.env` στον φάκελο `backend`:
```
DATABASE_URL="postgresql://postgres:ΚΩΔΙΚΟΣ@localhost:5432/snowsport_db"
PORT=5000
JWT_SECRET=snowsport_secret_key_2024
```

```bash
npx prisma db push
npx prisma generate
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 👥 Ρόλοι Χρηστών

| Ρόλος | Περιγραφή |
|---|---|
| Resort | Διαχείριση σχολών |
| School | Διαχείριση εκπαιδευτών & μαθημάτων |
| Instructor | Προβολή προγράμματος |
| Customer | Online κράτηση μαθημάτων |

## 🛠 Τεχνολογίες

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT