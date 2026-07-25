# Business Flow — MapsChatbot AI Backend

## Overview

A chat interface where users ask location-based questions (e.g. *"Where should I eat sushi?"*, *"Best coffee shop nearby"*) and receive an AI-generated answer with Google Places data. The backend orchestrates communication between the frontend, a local LLM (Ollama), and Google Places API — the frontend never calls external services directly.

---

## Core Workflow

```
Frontend
    │
    ▼
POST /api/chat  { message: string }
    │
    ▼
Validate Request (Zod)
    │
    ▼
Conversation Service
    │
    ▼
LLM Provider (Ollama)
    │
    ▼
Does AI require a tool (Google Places)?
    │
    ├── YES ──► Google Places API ──► Normalize Result ──► LLM Final Response
    │
    └── NO  ──► Generate Response directly
                         │
                         ▼
                   JSON Response
                         │
                         ▼
                    Frontend
```

**Rule**: The LLM must never fabricate location data. All location data must come from Google Places API.

---

## Step-by-step

### 1. User sends a message

Frontend sends `POST /api/chat`:

```json
{
  "message": "Where should I eat sushi in Batam?"
}
```

### 2. Validate request

Zod validates the body. Invalid requests return a `422` with a descriptive error.

### 3. Conversation Service orchestrates the flow

The service passes the message to the LLM Provider, which decides whether Google Places lookup is needed.

### 4. LLM decides tool usage

If the query requires location data, the LLM triggers `search_places()`. The backend executes the tool call — the LLM never calls Google APIs directly.

### 5. Google Places API

The backend queries Google Places API with the extracted parameters. Results are normalized into a consistent format.

### 6. LLM summarizes

The normalized Places data is fed back to the LLM, which generates a natural-language answer enriched with the real location data.

### 7. API responds

```json
{
  "success": true,
  "data": {
    "answer": "Here are the best sushi places in Batam...",
    "places": [
      {
        "name": "Sushi Restaurant A",
        "rating": 4.8,
        "address": "Batam Center",
        "latitude": 1.111,
        "longitude": 104.111,
        "mapsUrl": "https://www.google.com/maps/place/..."
      }
    ]
  }
}
```

---

## API Contract

### `POST /api/chat`

**Request:**
```json
{
  "message": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "answer": "string",
    "places": [
      {
        "name": "string",
        "rating": "number",
        "address": "string",
        "latitude": "number",
        "longitude": "number",
        "mapsUrl": "string"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "string"
}
```

---

## Response Format Rules

| Scenario | HTTP Code |
|---|---|
| Success | 200 |
| Bad Request | 400 |
| Validation Error | 422 |
| Rate Limited | 429 |
| Internal Error | 500 |
| Service Unavailable | 503 |

Never expose stack traces.

---

## Architecture Layers

```
Controller  (thin — validates, delegates)
    │
    ▼
Service     (business logic)
    │
    ▼
Provider    (wraps external APIs)
    │
    ▼
External API (Google Places, Ollama)
```

- **Controllers** — must remain thin, no business logic
- **Services** — contain all business logic
- **Providers** — wrap external APIs, replaceable via interfaces
- **Dependency injection** — services depend on abstractions, not concrete implementations

---

## Key Components

| Component | File | Responsibility |
|---|---|---|
| `POST /api/chat` | `src/routes/chat.ts` | Validate input, delegate to service |
| Conversation Service | `src/services/conversation.ts` | Orchestrate LLM + Places flow |
| LLM Provider | `src/providers/llm/ollama.ts` | Call Ollama, parse intent |
| Google Places Provider | `src/providers/places/google.ts` | Query Google Places, normalize results |

---

## Provider Replaceability

**LLM Providers:**
- `OllamaProvider` (current)
- `OpenAIProvider` (future)
- `ClaudeProvider` (future)
- `GeminiProvider` (future)

**Maps Providers:**
- `GooglePlacesProvider` (current)
- `MapboxProvider` (future)
- `HereProvider` (future)

All providers implement a common interface — swapping them requires no controller or service changes.

---

## Tool Calling Flow

```
User: "I want ramen."
    │
    ▼
LLM: decides tool required
    │
    ▼
Backend executes: search_places("ramen")
    │
    ▼
Google Places API returns results
    │
    ▼
LLM: summarizes results into final answer
    │
    ▼
Response to frontend
```

---

## Environment Variables

```
PORT=
NODE_ENV=
GOOGLE_MAPS_API_KEY=
OLLAMA_HOST=
OLLAMA_MODEL=
```

No secrets hardcoded.

---

## Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Validation | Zod on every endpoint |
| Logging | Pino — log requests, response time, errors; never log secrets |
| Rate Limiting | 100 req/min/IP |
| Timeouts | Google Places: 5s, LLM: 60s |
| Retries | 3 retries with exponential backoff (transient failures only) |
| Security | Helmet, CORS, env vars |
| Error Handling | Global error handler, no try/catch in controllers |
