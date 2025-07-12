# Processing Tier ↔ Management Tier Integration Specification

This document specifies the API interface between the Processing Tier and the Management Tier of the ComputePortal Marketplace Transaction Engine.

---

## Base URL

```
http://<management-tier-host>:9000/api/management/integration
```

---

## 1. Resource Sync
- **Endpoint:** `/resources/sync`
- **Method:** `POST`
- **Description:** Sync resource state from processing to management.
- **Payload:**
  ```json
  {
    "clusterId": "string", // Cluster ID
    "cpu": number,
    "gpu": number,
    "memory": number
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Resource sync stored" }
  ```

---

## 2. Order State Update
- **Endpoint:** `/orders/update`
- **Method:** `POST`
- **Description:** Update order state in management.
- **Payload:**
  ```json
  {
    "orderId": "string",
    "userId": "string",
    "status": "string",
    "amount": number
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Order update stored" }
  ```

---

## 3. Transaction State Update
- **Endpoint:** `/transactions/update`
- **Method:** `POST`
- **Description:** Update transaction state in management.
- **Payload:**
  ```json
  {
    "transactionId": "string",
    "orderId": "string",
    "userId": "string",
    "status": "string",
    "amount": number,
    "fees": number
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Transaction update stored" }
  ```

---

## 4. Fee Config Fetch
- **Endpoint:** `/fees/config`
- **Method:** `GET`
- **Description:** Fetch current fee configuration from management.
- **Response:**
  ```json
  {
    "buyerFee": number,
    "sellerFee": number,
    "tiers": [
      {
        "id": "string",
        "name": "string",
        "minVolume": number,
        "maxVolume": number,
        "buyerFee": number,
        "sellerFee": number
      },
      ...
    ]
  }
  ```

---

## 5. Settlement Instruction
- **Endpoint:** `/settlement/execute`
- **Method:** `POST`
- **Description:** Instruct management to execute a settlement (stub only).
- **Payload:**
  ```json
  {
    "transactionId": "string"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Settlement instruction received" }
  ```

---

## 6. Compliance/Audit Event
- **Endpoint:** `/audit/log`
- **Method:** `POST`
- **Description:** Log a compliance or audit event in management.
- **Payload:**
  ```json
  {
    "eventType": "string",
    "eventData": { ... }
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Audit event received" }
  ```

---

## 7. Analytics Ingest
- **Endpoint:** `/analytics/ingest`
- **Method:** `POST`
- **Description:** Ingest analytics event data into management.
- **Payload:**
  ```json
  {
    "eventType": "string",
    "eventData": { ... }
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Analytics event stored" }
  ```

---

## 8. Cluster/State Sync
- **Endpoint:** `/clusters`
- **Method:** `GET`
- **Description:** Fetch all registered clusters from management.
- **Response:**
  ```json
  {
    "clusters": [
      {
        "id": "string",
        "name": "string",
        "status": "string",
        "endpoint": "string",
        "region": "string",
        "created_at": "ISO8601 string",
        "updated_at": "ISO8601 string"
      },
      ...
    ]
  }
  ```

- **Endpoint:** `/clusters`
- **Method:** `POST`
- **Description:** Register or update a cluster in management.
- **Payload:**
  ```json
  {
    "id": "string",
    "name": "string",
    "endpoint": "string",
    "region": "string"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Cluster registered successfully" }
  ```

---

## Notes
- All endpoints return `500` with `{ success: false, error: "..." }` on error.
- All payloads and responses are JSON.
- All IDs are strings (UUID or unique name). 