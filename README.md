# 🏔 Snowsport Management System

Εφαρμογή διαχείρισης μαθημάτων σκι και snowboard για χιονοδρομικά κέντρα και σχολές σκι.

> **Διπλωματική Εργασία** — "Ανάπτυξη εφαρμογής ιστού για την αυτόματη διαχείριση ομαδικών μαθημάτων χιονοδρομίας"

## 📋 Προαπαιτούμενα

- Node.js v18+
- PostgreSQL 18
- npm
- Git

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
npm run seed
npm run dev
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

## 🌐 URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 👥 Ρόλοι & Στοιχεία Σύνδεσης (μετά το seed)

| Ρόλος          | Email                         | Password   |
| -------------- | ----------------------------- | ---------- |
| 🏔 Resort      | admin@kalavritaskiresort.gr   | kalavrita  |
| 🎿 Σχολή 1     | academy@kalavrita.gr          | academy123 |
| 🎿 Σχολή 2     | alpine@kalavrita.gr           | alpine123  |
| 👨‍🏫 Εκπαιδευτής | vasilis@academy.gr            | vasilis123 |
| 👤 Πελάτης     | giorgospapadopoulos@gmail.com | giorgos123 |

## ✅ Λειτουργίες

- Σύστημα ρόλων (Resort, Σχολή, Εκπαιδευτής, Πελάτης)
- Ατομικά & ομαδικά μαθήματα
- Online κράτηση από πελάτες
- Grid προγράμματος εκπαιδευτών
- Στατιστικά εσόδων
- Αυτόματοι έλεγχοι ωραρίων & επικαλύψεων

## 🛠 Τεχνολογίες

| Κατηγορία | Τεχνολογία               |
| --------- | ------------------------ |
| Frontend  | React 18 + Vite          |
| Backend   | Node.js + Express        |
| Database  | PostgreSQL 18 + Prisma 7 |
| Auth      | JWT                      |
| Styling   | CSS Variables            |
