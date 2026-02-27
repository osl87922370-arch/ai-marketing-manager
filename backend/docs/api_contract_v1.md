# API Contract v1

- api_version: v1
- pricing_version: 2026-02-23

## Principles

1. Top-level Response Envelope shape is immutable in v1.
2. Backward-compatible changes = adding optional fields only.
3. Removing or renaming fields requires v2.
4. All endpoints must return the same top-level structure.

---

## 1) Response Envelope (All Endpoints)

### Success

```json
{
  "ok": true,
  "request_id": "req_123",
  "api_version": "v1",
  "data": {},
  "error": null
}
```

### Failure


```json
{
  "ok": false,
  "request_id": "req_124",
  "api_version": "v1",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": null
  }
}
```
