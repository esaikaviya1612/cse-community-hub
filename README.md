# CSE Community Hub

Full-stack CSE department community portal for Tech Society and IEI.

## Stack
React + Vite, Node.js + Express, MongoDB + Mongoose, JWT + bcrypt, XLSX.

## Demo accounts
- Student: student@csehub.local / Student@123
- Coordinator: coordinator@csehub.local / Coordinator@123
- Staff: staff@csehub.local / Staff@123

## Run backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
```

## Run frontend
Open another PowerShell:
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

Local MongoDB:
`mongodb://127.0.0.1:27017/cse_community_hub`

For MongoDB Atlas, put your Atlas connection string in `backend/.env` as `MONGO_URI`.

Workflow: Coordinator creates event -> Pending -> Staff approves/rejects -> only approved events are visible to students. Registrations are stored in MongoDB and event-wise Excel export is available to Coordinator/Staff.
