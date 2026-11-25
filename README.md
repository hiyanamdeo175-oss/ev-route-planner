EV SmartRoute

Intelligent EV route planning and charging slot booking.

🔗 Live demo: https://ev-route-planner-three.vercel.app

<!-- Add a demo GIF or screenshot here, e.g. ![EV SmartRoute demo](screenshots/demo.gif) -->
Overview

Electric vehicle drivers on long trips face three recurring problems: charging availability is uncertain, existing apps rarely let you reserve a slot, and range anxiety makes trips hard to plan. EV SmartRoute plans a route around your vehicle's real constraints, finds suitable charging stations along it, and lets you book a charging slot before you arrive.

Features
Route planning: enter a start and destination and get a route checked against the vehicle's range.
Charging station discovery: nearest suitable stations along the route, from live station data.
Slot booking: reserve a charging slot instead of arriving and hoping.
Trip and battery predictions: estimated energy consumption and a feasibility check for the trip.
Travel assistant: guidance for the journey and charging stops.
How it works
The user enters a route and vehicle details.
The system checks the vehicle and route status.
It shows the nearest suitable stations along the route.
The user books a slot and starts navigation.
Architecture
  User (browser)
       │
       ▼
  Frontend  ──────────►  Backend API (REST)
  (Vite, Vercel)             │
                             ├── Routing engine ──► Maps & Routing API
                             ├── Station service ─► Charging Station API
                             ├── Prediction module ► Traffic & Elevation API
                             └── Slot booking

The backend is modular and API-driven: station data ingestion, consumption prediction, routing and booking are separate pieces behind one REST API.

Tech Stack
Layer	Technology
Frontend	Vite, [React / confirm framework]
Backend	[Node.js, Express / confirm]
Data store	[state what you use now, since MongoDB was removed]
External APIs	[Maps & Routing API name], [Charging Station API name], [Traffic & Elevation API name]
Deployment	Frontend on Vercel, backend on Render (render.yaml)
Project Structure
ev-route-planner/
├── public/          # static assets
├── src/             # frontend source
├── server/          # backend API
├── render.yaml      # Render deployment config
├── vite.config.js
└── package.json
Getting Started
Prerequisites
Node.js 18 or later and npm
API keys for the services listed in the Tech Stack table
1. Clone the repository
bash
git clone https://github.com/hiyanamdeo175-oss/ev-route-planner.git
cd ev-route-planner
2. Configure environment variables

Copy the example file and fill in your own keys. Never commit a real .env file.

bash
cp .env.example .env
Variable	Purpose
[MAPS_API_KEY]	Maps and routing
[CHARGING_API_KEY]	Charging station data
[VITE_API_URL]	Backend URL used by the frontend
3. Run the backend
bash
cd server
npm install
npm start
4. Run the frontend

In a second terminal, from the project root:

bash
npm install
npm run dev

The app runs at http://localhost:5173.

API Reference
<!-- List your real endpoints. Example format: -->
Method	Endpoint	Description
GET	/[stations]	[Find charging stations near a route]
POST	/[book]	[Book a charging slot]
POST	/[predict]	[Estimate trip energy use and feasibility]
Team & Contributions
Name	Role
Hiya Namdeo	Backend: [APIs, slot booking, prediction logic, deployment]
Dhruv Rabadiya	[Frontend and UI / confirm with Dhruv]

Both authors worked on this project together. Early commits were pushed from a single account.

Limitations
[Be honest here, e.g. station data depends on third-party API coverage.]
[e.g. Slot booking is a prototype and is not connected to real station operators.]
[e.g. The consumption model uses simplified assumptions about the vehicle.]
Future Work
Real-time station availability from operators
Support for multiple vehicle profiles and connector types
User accounts and booking history
A more accurate consumption model using real driving data
Authors
Hiya Namdeo: GitHub
Dhruv Rabadiya: GitHub
