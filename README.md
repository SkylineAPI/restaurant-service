# restaurant-service

Part of **FoodExpress**, a microservices-based online food ordering system.
This service owns restaurants and their menus, and validates order items for the Order Service.

| | |
|---|---|
| Language / framework | Node.js 20, Express 4 |
| Database | MongoDB 7 (Mongoose) – private to this service |
| Port | 3000 |
| Container image | `restaurant-service:1.0.0` |

## API

| Type | Method | Path | Description |
|---|---|---|---|
| Command | POST | `/restaurants` | Register a restaurant |
| Command | PATCH | `/restaurants/:id` | Update details (e.g. `isOpen`) |
| Command | POST | `/restaurants/:id/menu` | Add a menu item |
| Command | PUT | `/restaurants/:id/menu/:itemId` | Update price / availability |
| Command | DELETE | `/restaurants/:id/menu/:itemId` | Remove a menu item |
| Command | POST | `/restaurants/:id/validate-order` | Validate items and return authoritative prices (called by order-service) |
| Query | GET | `/restaurants?cuisine=&open=` | List / search restaurants |
| Query | GET | `/restaurants/:id` | Restaurant details |
| Query | GET | `/restaurants/:id/menu?available=true` | Menu |
| Probe | GET | `/health` | Liveness / readiness |

## Project structure

```
restaurant-service/
├── src/
│   ├── server.js              # entry point, MongoDB connection with retry
│   ├── app.js                 # Express app, /health, error handling
│   ├── validation.js          # pure order-validation business logic
│   ├── models/restaurant.js   # Mongoose schema (restaurant + embedded menu)
│   └── routes/restaurants.js  # REST endpoints
├── test/validation.test.js    # unit tests (node:test)
├── k8s/
│   ├── namespace.yaml
│   ├── mongo.yaml             # PVC + Deployment + ClusterIP Service
│   └── restaurant-service.yaml# ConfigMap + Deployment + NodePort Service + HPA
├── .github/workflows/ci.yml   # test → docker build → deploy to ephemeral minikube
├── Dockerfile
└── docker-compose.yml
```

## Run

```bash
# Unit tests
npm install && npm test

# Docker (creates the shared foodexpress-net network)
docker compose up -d --build
curl localhost:3000/health

# Kubernetes (minikube)
minikube image build -t restaurant-service:1.0.0 .
kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/
kubectl -n foodexpress port-forward svc/restaurant-service 3000:3000
```
