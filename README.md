# 🧠 Identity Reconciliation Service

A backend service that consolidates customer contact information by linking related records based on shared email addresses and phone numbers.

This project implements identity resolution logic using **Node.js, TypeScript, Express, Prisma ORM, and PostgreSQL**.

---

## 🚀 Live API

**Base URL**

```
https://identity-reconciliation-gm9i.onrender.com
```

**Endpoint**

```
POST /identify
```

Full URL:

```
https://identity-reconciliation-gm9i.onrender.com/identify
```

---

## 📌 Problem Overview

When users sign up or interact with a system using different combinations of:

- Email addresses
- Phone numbers

Multiple contact records may be created for the same person.

This service:

- Identifies related contacts
- Maintains a single **primary contact**
- Links other contacts as **secondary**
- Merges multiple primaries if they become connected
- Returns a consolidated response

---

## 🏗 Tech Stack

- Node.js
- Express.js
- TypeScript (Strict Mode)
- Prisma ORM (v5)
- PostgreSQL
- Render (Deployment)

---

## 🗄 Database Schema

```prisma
model Contact {
  id             Int      @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  linkedContact     Contact?  @relation("SelfRelation", fields: [linkedId], references: [id])
  secondaryContacts Contact[] @relation("SelfRelation")
}
```

---

## 🔎 API Specification

### Request

```
POST /identify
```

### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

At least one of `email` or `phoneNumber` must be provided.

---

### Response Format

```json
{
  "contact": {
    "primaryContactId": number,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [number]
  }
}
```

---

## 🧠 Business Logic

### 1️⃣ New Contact

If no existing contact matches:
- A new **primary contact** is created.

---

### 2️⃣ Existing Contact

If a matching contact exists:
- The primary contact is identified.
- If new information is introduced → a **secondary contact** is created.

---

### 3️⃣ Primary Merge Logic

If multiple primary contacts become connected:

- The **oldest contact remains primary**
- Newer primary contacts are converted to secondary
- All related records are re-linked to the oldest primary
- The response is consolidated

---

## 🧪 Example Scenarios

### Example 1 — New Contact

**Request**

```json
{
  "email": "x@gmail.com",
  "phoneNumber": "111"
}
```

**Response**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["x@gmail.com"],
    "phoneNumbers": ["111"],
    "secondaryContactIds": []
  }
}
```

---

### Example 2 — Linking Contacts

If the system receives:

```json
{
  "email": "x@gmail.com",
  "phoneNumber": "222"
}
```

It merges related records and maintains a single primary contact.

---

## 📂 Project Structure

```
src/
 ├── controllers/
 │    └── identify.controller.ts
 │
 ├── services/
 │    └── identify.service.ts
 │
 ├── routes/
 │    └── identify.routes.ts
 │
 ├── prisma/
 │    └── client.ts
 │
 ├── app.ts
 └── server.ts

prisma/
 └── schema.prisma
```

---

## 🛠 Local Setup

### 1️⃣ Clone Repository

```
git clone <repo-url>
cd identity-reconciliation
```

---

### 2️⃣ Install Dependencies

```
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed"
```

---

### 4️⃣ Run Migration

```
npx prisma migrate dev
```

---

### 5️⃣ Start Development Server

```
npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## 🧪 Prisma Studio

To inspect database:

```
npx prisma studio
```

---

## 📦 Production Build

```
npm run build
npm start
```

---

## 🌍 Deployment

Deployed on **Render**

Build Command:

```
npm install && npx prisma migrate deploy && npm run build
```

Start Command:

```
npm start
```

Environment Variable Required:

```
DATABASE_URL
```

---

## ✅ Features Implemented

- Contact creation
- Secondary contact linking
- Primary merge handling
- Unique consolidation of emails
- Unique consolidation of phone numbers
- Strict TypeScript safety
- Clean Controller → Service architecture
- Production deployment

---

## 👨‍💻 Author

**Anurag Singh**  
B.Tech Electrical Engineering  
MNNIT Allahabad