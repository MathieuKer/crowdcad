# CrowdCAD

[![CI](https://github.com/evanqua/crowdcad/workflows/CI/badge.svg)](https://github.com/evanqua/crowdcad/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE.md)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)

CrowdCAD is an open-source, browser-based **Computer-Aided Dispatch (CAD)** system specifically designed for volunteer EMS, first responders, and event medical teams. It provides a real-time interface for managing interventions, tracking teams, and coordinating emergency responses.

Demo and more information: [crowdcad.org](https://crowdcad.org)

---

## 🚀 Features

- **Real-time Dispatching**: Manage and track emergency calls as they happen.
- **Team Management**: Coordinate volunteer teams, equipment, and supervisors.
- **Interactive Mapping**: Place and track markers for locations, teams, and equipment on venue-specific maps.
- **Service Monitoring**: Track clinical interventions and walk-ups.
- **FSD Architecture**: Built with a modular Feature-Sliced Design for better maintainability.

## 🛠 Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [HeroUI](https://heroui.com/), [Lucide React](https://lucide.dev/)
- **Backend/Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
- **Deployment**: [Docker](https://www.docker.com/) & [GitHub Actions](https://github.com/features/actions)

---

## 📥 Getting Started

### 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **Package Manager**: `npm` (included with Node.js)
- **Docker**: Optional, but recommended for consistent environments

### ⚙️ Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your Firebase configuration variables in `.env.local`. 

For development and testing, you can use these pre-configured values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyApb8e4ttLGlfWlu6g7e7pJ8e05tJVr-0A
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=crowdcad-math.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=crowdcad-math
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=crowdcad-math.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1060321130787
NEXT_PUBLIC_FIREBASE_APP_ID=1:1060321130787:web:f81da994b66d138bf9f496
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DVBXZ4ZMTF

DISABLE_TELEMETRY=true
```

### 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🐳 Docker Setup

CrowdCAD is fully containerized for easy deployment and testing.

### 🏗️ Build and Run (Recommended)

To start the application using Docker Compose (which handles building the image with your environment variables):

```bash
npm run docker:dev
```

This command runs `docker compose --env-file .env.local up --build` under the hood.

### 🛑 Stop the Container

```bash
docker compose down
```

### 📝 Docker Troubleshooting
- Ensure `.env.local` is present and filled before building.
- If you change environment variables, you must rebuild the image using the `--build` flag.

---

## 🔑 Default Credentials

For initial testing after launching the project, use the following credentials:

- **Email:** `test@test.test`
- **Password:** `Allo1234`

---

## 📂 Project Structure

- `src/app`: Next.js App Router pages and global layouts.
- `src/features`: Focused business logic (Dispatch, Events, Teams, Venues) using Feature-Sliced Design.
- `src/components`: Reusable UI components.
- `src/services`: Shared services layer (Firestore, Auth).
- `src/hooks`: Custom React hooks for shared logic.
- `docs/`: Comprehensive technical and operational documentation.

---

## 🏛️ Project Architecture

CrowdCAD follows a **Feature-Sliced Design (FSD)** inspired architecture, organized around functional domains (e.g., Dispatch, Events, Teams). It uses a clean service layer to abstract Firebase interactions, ensuring that business logic remains decoupled from infrastructure.

For a detailed breakdown of the technical design, directory structure, and core principles, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## 📖 Further Documentation

- **User Guide:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **Architecture Details:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Firebase Setup:** [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)
- **Deployment & Compliance:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our workflow and PR guidance.

## 🛡️ Security

To report security issues, please refer to [SECURITY.md](SECURITY.md).

## ⚖️ License

CrowdCAD is licensed under the [AGPL-3.0 License](LICENSE.md).

---

> [!IMPORTANT]
> CrowdCAD is an open-source software framework. It does not provide HIPAA compliance out of the box. Organizations hosting CrowdCAD are solely responsible for ensuring their implementation meets applicable legal and regulatory requirements.
