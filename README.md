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
GROQ_API_KEY=το_δικο_σου_groq_key
```

```bash
npx prisma db push
npx prisma generate
npm run seed
node prisma/createSuperAdmin.js
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

## 🤖 AI Level Assessment

Η εφαρμογή χρησιμοποιεί το **Groq API** (δωρεάν) για την αξιολόγηση επιπέδου των πελατών μέσω ενός έξυπνου ερωτηματολογίου.

Για να αποκτήσεις δωρεάν API key:

1. Πήγαινε στο https://console.groq.com
2. Δημιούργησε λογαριασμό
3. Πήγαινε στο "API Keys" και δημιούργησε ένα
4. Πρόσθεσέ το στο `.env` ως `GROQ_API_KEY`

## 👥 Ρόλοι & Στοιχεία Σύνδεσης (μετά το seed)

| Ρόλος          | Email                         | Password      |
| -------------- | ----------------------------- | ------------- |
| 👑 Super Admin | superadmin@snowsport.gr       | superadmin123 |
| 🏔 Resort      | admin@kalavritaskiresort.gr   | kalavrita     |
| 🎿 Σχολή 1     | academy@kalavrita.gr          | academy123    |
| 🎿 Σχολή 2     | alpine@kalavrita.gr           | alpine123     |
| 👨‍🏫 Εκπαιδευτής | vasilis@academy.gr            | vasilis123    |
| 👤 Πελάτης     | giorgospapadopoulos@gmail.com | giorgos123    |

## ✅ Λειτουργίες

### Διαχείριση & Ρόλοι

- Σύστημα 5 ρόλων (Super Admin, Χιονοδρομικό, Σχολή, Εκπαιδευτής, Πελάτης) με JWT authentication
- Ιεραρχική δομή: Χιονοδρομικό → Σχολές → Εκπαιδευτές
- Προφίλ & πληροφορίες (περιγραφή, φωτογραφίες gallery, χάρτης πιστών, υψόμετρα, πίστες ανά επίπεδο)

### Μαθήματα

- **Κλειστά μαθήματα** — ατομικά ή παρέες που γνωρίζονται μεταξύ τους (κλιμακωτή τιμολόγηση)
- **Ανοιχτά ομαδικά μαθήματα** — άγνωστοι συμμετέχοντες σε κοινό μάθημα (σταθερή τιμή/άτομο)
- Online κράτηση από πελάτες με επιλογή επιπέδου, αθλήματος, διάρκειας

### Ανοιχτά Ομαδικά (κύριο χαρακτηριστικό)

- Η σχολή δημιουργεί ομαδικό **χωρίς προκαθορισμένη ώρα/εκπαιδευτή**
- Οι πελάτες δηλώνουν **προτιμώμενες ώρες** κατά τη συμμετοχή
- **Αυτόματο κλείδωμα ώρας** όταν ≥ ελάχιστου αριθμού συμμετεχόντων συμφωνούν σε κοινή ώρα (επιλέγεται η νωρίτερη)
- **Έξυπνο χειροκίνητο κλείδωμα** από τη σχολή με οπτικές μπάρες προτίμησης ανά ώρα
- Δυναμικές μπάρες προόδου πληρότητας

### Πρόγραμμα (Schedule Grid)

- Οπτικό grid εκπαιδευτών × ωρών
- **Drag & drop** μετακίνηση μαθημάτων μεταξύ εκπαιδευτών/ωρών
- **Pending panel** — μαθήματα χωρίς εκπαιδευτή, με drag & drop ανάθεση/αφαίρεση
- Αυτόματοι έλεγχοι: ειδικότητα εκπαιδευτή, επικαλύψεις, όρια ωραρίου (09:00–16:00)

### Επιπλέον

- Στατιστικά εσόδων & αναλυτικά KPIs
- Αξιολογήσεις εκπαιδευτών (1–5 ⭐) & σταθμισμένος μέσος όρος σχολής
- AI αξιολόγηση επιπέδου πελάτη (Groq)
- 🌙 **Dark mode** (global, με αποθήκευση προτίμησης)

## 🏗 Αρχιτεκτονική

Αρχιτεκτονική **πελάτη–διακομιστή τριών επιπέδων** (three-tier):

```
┌─────────────────────────────────┐
│  Επίπεδο Παρουσίασης             │
│  React 18 + Vite (SPA)          │
└─────────────────────────────────┘
              ↕ REST API (JSON / JWT)
┌─────────────────────────────────┐
│  Επίπεδο Λογικής                │
│  Node.js + Express              │
│  (routes / controllers /        │
│   middleware / utils)           │
└─────────────────────────────────┘
              ↕ Prisma ORM
┌─────────────────────────────────┐
│  Επίπεδο Δεδομένων              │
│  PostgreSQL                     │
└─────────────────────────────────┘
```

- Το backend ακολουθεί οργάνωση κατά το πρότυπο **MVC** (με το View αποσυνδεδεμένο ως ανεξάρτητη React εφαρμογή)
- **Stateless** αυθεντικοποίηση με JWT
- Το frontend είναι δομημένο με **επαναχρησιμοποιήσιμα components** και κοινή βιβλιοθήκη UI

### Δομή Frontend

```
frontend/src/
├── components/
│   ├── ui/          # Κοινή βιβλιοθήκη (DashboardShell, Card, Modal, FormField, ...)
│   ├── school/      # Feature components σχολής
│   ├── resort/      # Feature components χιονοδρομικού
│   ├── admin/       # Feature components διαχειριστή
│   ├── ScheduleGrid.jsx
│   └── ...
├── pages/           # Dashboards ανά ρόλο + Login/Register
├── context/         # AuthContext, ThemeContext
└── api/             # Κλήσεις REST API
```

## 🛠 Τεχνολογίες

| Κατηγορία | Τεχνολογία                       |
| --------- | -------------------------------- |
| Frontend  | React 18 + Vite                  |
| Backend   | Node.js + Express                |
| Database  | PostgreSQL 18 + Prisma 7         |
| Auth      | JWT + bcryptjs                   |
| AI        | Groq (GPT-OSS-120b)              |
| Styling   | CSS Variables (light/dark theme) |
| Uploads   | Multer                           |
