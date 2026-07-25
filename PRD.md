# Backend Product Requirements Document (PRD)

# MapsChatbot AI Backend

Version: 1.0

Status: In Development

---

# Overview

MapsChatbot AI Backend is responsible for orchestrating the communication between the frontend, Local LLM, and Google Maps Platform.

The backend owns all business logic.

The frontend must never communicate directly with external services.

---

# Primary Responsibilities

The backend MUST:

- Validate every request.
- Orchestrate conversations.
- Execute Tool Calling.
- Query Google Places API.
- Format AI responses.
- Handle failures gracefully.
- Secure all API keys.
- Log application events.
- Provide stable REST APIs.

---

# Core Workflow

```
Frontend

↓

POST /api/chat

↓

Validate Request

↓

Conversation Service

↓

LLM Provider

↓

Does AI require a tool?

↓

YES ---------------------- NO
│                          │
▼                          ▼

Google Places API      Generate Response

↓

Normalize Result

↓

LLM Final Response

↓

JSON Response

↓

Frontend
```

The Local LLM MUST NEVER fabricate location information.

All location data MUST come from Google Places API.

---

# SOLID Principles

The entire backend MUST follow SOLID principles.

## Single Responsibility Principle (SRP)

Each class should have only one responsibility.

Good

UserService

GooglePlacesProvider

ChatController

Bad

ChatService

- validation
- logging
- prompt generation
- Google API calls
- response mapping

---

## Open/Closed Principle (OCP)

The system should be open for extension but closed for modification.

Adding a new AI provider should not require modifying existing services.

Example

OllamaProvider

↓

OpenAIProvider

↓

ClaudeProvider

↓

GeminiProvider

---

## Liskov Substitution Principle (LSP)

Every provider implementation must be interchangeable.

For example:

LLMProvider

↓

OllamaProvider

↓

OpenAIProvider

↓

ClaudeProvider

All implementations should behave consistently.

---

## Interface Segregation Principle (ISP)

Avoid large interfaces.

Prefer:

ChatProvider

PlacesProvider

EmbeddingProvider

instead of

AIProvider

with dozens of unrelated methods.

---

## Dependency Inversion Principle (DIP)

Services must depend on abstractions instead of concrete implementations.

Good

ChatService

↓

LLMProvider

↓

OllamaProvider

Bad

ChatService

↓

new OllamaProvider()

---

# Functional Requirements

## Chat

Users should be able to ask:

- Where should I eat?
- Best coffee shop nearby
- Tourist attractions
- Family restaurants
- Halal restaurants
- Sushi near Batam Center

The backend determines whether Google Places lookup is required.

---

## Tool Calling

The backend owns tool execution.

The LLM must never directly call Google APIs.

Example

```
User

↓

"I want ramen."

↓

LLM

↓

Tool Required

↓

search_places()

↓

Google Places

↓

LLM

↓

Final Answer
```

---

# External Services

## Local LLM

Provider

Ollama

Responsibilities

- Generate reasoning
- Decide tool usage
- Summarize results

The provider implementation must be replaceable.

---

## Google Places API

Responsibilities

- Search locations
- Retrieve ratings
- Retrieve addresses
- Retrieve coordinates
- Generate Maps links

Google API keys must remain server-side.

---

# REST API

Base URL

```
/api
```

---

## POST /chat

Description

Main chat endpoint.

Request

```json
{
  "message": [
    {
      "role": "user",
      "content": "Where should I eat sushi in Batam?"
    }
  ],
  "options": {
    "stream": true
  }
}
```

Response

```json
{
  "success": true,
  "data": {
    "message": {
      "role": "assistant",
      "content": "I recommend Sushi Tei Batam Center because..."
    },
    "places": [
      {
        "id": "ChIJ...",
        "name": "Sushi Tei Batam Center",
        "address": "...",
        "rating": 4.7,
        "location": {
          "lat": 1.1301,
          "lng": 104.0542
        },
        "mapsUrl": "https://..."
      }
    ]
  }
}
```

---

## GET /health

Response

```json
{
  "status": "ok"
}
```

---

## GET /version

Response

```json
{
  "name": "MapsChatbot AI Backend",
  "version": "1.0.0"
}
```

---

# Request Validation

Every endpoint must validate:

- body
- params
- query
- headers

Validation library

Zod

Never trust client input.

---

# Response Format

Success

```json
{
  "success": true,
  "data": {}
}
```

Failure

```json
{
  "success": false,
  "message": "..."
}
```

Never expose stack traces.

---

# HTTP Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

422 Validation Error

429 Too Many Requests

500 Internal Server Error

503 Service Unavailable

---

# Error Handling

All errors must be centralized.

Controllers must never contain try/catch business logic.

Use Global Error Handler.

---

# Logging

Use Pino.

Log

- incoming requests
- response time
- tool execution
- Google API errors
- LLM errors
- unexpected exceptions

Never log

- API Keys
- Secrets
- Tokens

---

# Rate Limiting

Every public endpoint must be protected.

Example

100 requests / minute / IP

---

# Timeout

Google Places

5 seconds

LLM

60 seconds

Requests exceeding timeout should fail gracefully.

---

# Retry Strategy

Retry only for transient failures.

Maximum

3 retries

Use exponential backoff.

Never retry validation errors.

---

# Security

Use

- Helmet
- CORS
- Rate Limit
- Environment Variables

Never expose:

- Google API Key
- Ollama configuration
- Internal stack traces

---

# Environment Variables

Required

```
PORT=

NODE_ENV=

GOOGLE_MAPS_API_KEY=

OLLAMA_HOST=

OLLAMA_MODEL=
```

No secrets should be hardcoded.

---

# Architecture Principles

Follow Clean Architecture.

```
Controller

↓

Service

↓

Provider

↓

External API
```

Controllers should remain thin.

Business logic belongs inside Services.

Providers wrap external APIs.

---

# AI Provider Rules

The provider must be replaceable.

Current implementation

```
OllamaProvider
```

Future

```
OpenAIProvider

ClaudeProvider

GeminiProvider
```

No controller changes should be required.

---

# Google Provider Rules

The provider must abstract Google APIs.

Current

```
GooglePlacesProvider
```

Future

```
MapboxProvider

HereProvider
```

Business logic should not change.

---

# Performance

Prefer

- Async operations
- Streaming responses
- Connection reuse

Avoid

- Blocking operations
- Duplicate requests
- Nested service calls

---

# Definition of Done

A feature is complete only if:

✓ TypeScript passes

✓ ESLint passes

✓ Validation exists

✓ Logging exists

✓ Error handling exists

✓ Uses dependency injection

✓ Uses service layer

✓ No duplicated logic

✓ Uses environment variables

✓ Secure API implementation

✓ Clean architecture

✓ Documentation updated
