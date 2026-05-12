# Farmer Data Collection System
### Automatic Logistics Data Generation — Short Food Supply Chains

> **Goal:** Enable farmers with basic smartphones to log harvest, condition, and transport data passively — through photos and a 5-field form — without active data entry effort. All collected data feeds the central logistics management system.

---

## Table of Contents

1. [Background & Problem Statement](#1-background--problem-statement)
2. [System Overview](#2-system-overview)
3. [Data Schemas](#3-data-schemas)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Implementation Plan](#6-implementation-plan)
7. [Tech Stack](#7-tech-stack)
8. [Farmer-Facing App Design](#8-farmer-facing-app-design)
9. [AI Processing Pipeline](#9-ai-processing-pipeline)
10. [Integration with Logistics Dashboard](#10-integration-with-logistics-dashboard)
11. [Validation & Accuracy](#11-validation--accuracy)
12. [Post-MVP Roadmap](#12-post-mvp-roadmap)

---

## 1. Background & Problem Statement

Short food supply chains lack logistical data at the source — the farm level. Farmers are not data workers and cannot be expected to manually enter structured records into a system. However, they do take photos, they do carry smartphones, and they do move products through predictable locations.

This system solves the data gap by meeting farmers where they are:

- A photo of a crate or storage area automatically generates a structured logistics record
- A 5-field form serves as the fallback for anything the photo cannot capture
- The farmer confirms, not types — AI pre-fills the form from the photo
- Data flows automatically to the logistics management system

**Target user:** Farmer with a smartphone, low technical literacy, no tolerance for complex forms or multi-step workflows.

---

## 2. System Overview

```
Farmer (smartphone)
        │
   ┌────┴────┐
   │         │
Photo      Quick
capture    form
(auto)    (fallback)
   │         │
   └────┬────┘
        │
   AI Processing Layer
   ┌─────────────────────┐
   │  Vision model       │ ← object detection, quantity estimation, condition
   │  OCR engine         │ ← labels, expiry dates, lot numbers
   │  Form parser        │ ← normalise and validate form inputs
   └────────┬────────────┘
            │
   Structured Data Record (JSON)
            │
   Logistics Dashboard & LMS
```

### Two input paths

| Path | When used | What it captures |
|---|---|---|
| Photo | Primary — farmer takes a photo of crates, storage, or transport | Product type, quantity estimate, condition, expiry date, labels, location cues |
| Quick form | Fallback — no photo, or photo yields low confidence | Product type, quantity, unit, condition, location (all 5 fields required) |

Both paths produce the same structured output record. The photo path pre-fills the form; the farmer confirms or corrects.

---

## 3. Data Schemas

### 3.1 Farmer submission — input payload

This is what the mobile app sends to the backend when a farmer submits a record.

```json
{
  "submission": {
    "farmer_id": "string (UUID)",
    "submitted_at": "ISO 8601 datetime",
    "input_method": "photo | form | mixed",
    "location_id": "string (UUID) — selected from predefined list",
    "photo": {
      "file_url": "string (S3 URL) or null",
      "taken_at": "ISO 8601 datetime or null",
      "device_model": "string or null"
    },
    "form_fields": {
      "product_type": "string or null",
      "quantity": "number or null",
      "quantity_unit": "crates | kg | units | boxes | null",
      "condition": "good | mixed | damaged | null",
      "notes": "string (max 200 chars) or null"
    }
  }
}
```

### 3.2 Processed logistics record — output payload

This is what the AI pipeline produces and stores. It is the canonical record for the logistics system.

```json
{
  "record_id": "string (UUID)",
  "farmer_id": "string (UUID)",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime",
  "status": "pending | confirmed | flagged | rejected",

  "product": {
    "type": "string",
    "variety": "string or null",
    "category": "vegetables | fruit | dairy | grain | other"
  },

  "quantity": {
    "estimated": "number",
    "unit": "crates | kg | units | boxes",
    "source": "photo | form | calculated"
  },

  "condition": {
    "rating": "good | mixed | damaged",
    "notes": "string or null",
    "source": "photo | form"
  },

  "provenance": {
    "farm_id": "string (UUID)",
    "location_id": "string (UUID)",
    "location_type": "field | storage | transport | distribution_point",
    "location_label": "string"
  },

  "traceability": {
    "expiry_date": "ISO 8601 date or null",
    "lot_number": "string or null",
    "batch_id": "string or null"
  },

  "extraction": {
    "method": "photo_only | form_only | photo_plus_form",
    "photo_url": "string or null",
    "ocr_raw_text": "string or null",
    "model_used": "string (e.g. gpt-4o-vision, yolov8)",
    "confidence": {
      "product_type": 0.0,
      "quantity": 0.0,
      "condition": 0.0,
      "expiry_date": 0.0,
      "location": 0.0,
      "overall": 0.0
    },
    "low_confidence_fields": ["array of field names where confidence < 0.6"]
  }
}
```

### 3.3 Location — predefined lookup

Locations are fixed and set up by a supply chain manager, not entered freehand by the farmer. This prevents typos and makes routing computable.

```json
{
  "location_id": "string (UUID)",
  "farm_id": "string (UUID)",
  "label": "string (e.g. Field A, North storage shed, Main gate)",
  "type": "field | storage | transport | distribution_point",
  "coordinates": {
    "lat": "number or null",
    "lng": "number or null"
  },
  "active": true
}
```

### 3.4 Farmer profile

```json
{
  "farmer_id": "string (UUID)",
  "name": "string",
  "farm_id": "string (UUID)",
  "preferred_language": "string (ISO 639-1 code, e.g. nl, fr, en)",
  "phone_number": "string or null",
  "created_at": "ISO 8601 datetime",
  "last_active_at": "ISO 8601 datetime"
}
```

### 3.5 CSV export format

For stakeholders who work in spreadsheets rather than JSON.

```
record_id, farmer_id, farm_id, submitted_at, product_type, product_category,
quantity, quantity_unit, condition, location_label, location_type,
expiry_date, lot_number, input_method, overall_confidence, status
```

---

## 4. Database Schema

### Technology: PostgreSQL

All records are stored relationally. The `records` table is the central fact table. Photos are stored in object storage (S3 or equivalent); only the URL is stored in the database.

### Tables

#### `farmers`
| Column | Type | Notes |
|---|---|---|
| `farmer_id` | UUID PK | |
| `farm_id` | UUID FK → `farms` | |
| `name` | VARCHAR(120) | |
| `phone_number` | VARCHAR(20) | nullable |
| `preferred_language` | CHAR(2) | default `nl` |
| `created_at` | TIMESTAMPTZ | |
| `last_active_at` | TIMESTAMPTZ | |

#### `farms`
| Column | Type | Notes |
|---|---|---|
| `farm_id` | UUID PK | |
| `name` | VARCHAR(120) | |
| `owner_name` | VARCHAR(120) | |
| `region` | VARCHAR(80) | |
| `created_at` | TIMESTAMPTZ | |

#### `locations`
| Column | Type | Notes |
|---|---|---|
| `location_id` | UUID PK | |
| `farm_id` | UUID FK → `farms` | |
| `label` | VARCHAR(100) | e.g. "North storage shed" |
| `type` | ENUM(field, storage, transport, distribution_point) | |
| `lat` | DECIMAL(9,6) | nullable |
| `lng` | DECIMAL(9,6) | nullable |
| `active` | BOOLEAN | default true |

#### `records`
| Column | Type | Notes |
|---|---|---|
| `record_id` | UUID PK | |
| `farmer_id` | UUID FK → `farmers` | |
| `farm_id` | UUID FK → `farms` | denormalised for query speed |
| `location_id` | UUID FK → `locations` | |
| `submitted_at` | TIMESTAMPTZ | when the farmer submitted |
| `created_at` | TIMESTAMPTZ | when the record was processed |
| `updated_at` | TIMESTAMPTZ | |
| `status` | ENUM(pending, confirmed, flagged, rejected) | default `pending` |
| `input_method` | ENUM(photo_only, form_only, photo_plus_form) | |
| `photo_url` | TEXT | nullable, S3 URL |
| `ocr_raw_text` | TEXT | nullable |
| `model_used` | VARCHAR(60) | |

#### `record_products`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `record_id` | UUID FK → `records` | |
| `product_type` | VARCHAR(80) | e.g. "Tomatoes" |
| `product_category` | ENUM(vegetables, fruit, dairy, grain, other) | |
| `variety` | VARCHAR(80) | nullable |
| `quantity` | DECIMAL(10,2) | |
| `quantity_unit` | ENUM(crates, kg, units, boxes) | |
| `quantity_source` | ENUM(photo, form, calculated) | |

#### `record_condition`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `record_id` | UUID FK → `records` | |
| `rating` | ENUM(good, mixed, damaged) | |
| `notes` | VARCHAR(200) | nullable |
| `source` | ENUM(photo, form) | |

#### `record_traceability`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `record_id` | UUID FK → `records` | |
| `expiry_date` | DATE | nullable |
| `lot_number` | VARCHAR(60) | nullable |
| `batch_id` | VARCHAR(60) | nullable |

#### `record_confidence`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `record_id` | UUID FK → `records` | |
| `product_type` | DECIMAL(4,3) | 0.000–1.000 |
| `quantity` | DECIMAL(4,3) | |
| `condition` | DECIMAL(4,3) | |
| `expiry_date` | DECIMAL(4,3) | nullable |
| `location` | DECIMAL(4,3) | |
| `overall` | DECIMAL(4,3) | |
| `low_confidence_fields` | TEXT[] | fields where confidence < 0.6 |

### Key indexes

```sql
CREATE INDEX idx_records_farmer ON records(farmer_id);
CREATE INDEX idx_records_farm ON records(farm_id);
CREATE INDEX idx_records_submitted_at ON records(submitted_at DESC);
CREATE INDEX idx_records_status ON records(status);
CREATE INDEX idx_records_location ON records(location_id);
```

---

## 5. API Specification

Base URL: `https://api.yourapp.com/v1`

All requests require `Authorization: Bearer <token>` header.

### 5.1 Submit a new record

```
POST /records
```

**Request body:** Farmer submission payload (see Schema 3.1)

**Response `201 Created`:**
```json
{
  "record_id": "uuid",
  "status": "pending",
  "estimated_processing_ms": 3000,
  "message": "Record received. AI processing started."
}
```

### 5.2 Get a processed record

```
GET /records/{record_id}
```

**Response `200 OK`:** Full processed logistics record (see Schema 3.2)

### 5.3 List records for a farm

```
GET /records?farm_id={uuid}&from={date}&to={date}&status={status}&limit=50&offset=0
```

### 5.4 Upload a photo

```
POST /photos/upload
Content-Type: multipart/form-data
```

**Response `200 OK`:**
```json
{
  "photo_url": "https://s3.../photo-uuid.jpg",
  "upload_id": "uuid"
}
```
Upload the photo first, then include `photo_url` in the record submission.

### 5.5 Get locations for a farm

```
GET /locations?farm_id={uuid}
```

**Response `200 OK`:**
```json
{
  "locations": [
    {
      "location_id": "uuid",
      "label": "North storage shed",
      "type": "storage"
    }
  ]
}
```

### 5.6 Confirm or flag a record (admin / logistics manager)

```
PATCH /records/{record_id}
```

**Request body:**
```json
{
  "status": "confirmed | flagged | rejected",
  "reviewer_notes": "string or null"
}
```

### 5.7 Export records as CSV

```
GET /records/export?farm_id={uuid}&from={date}&to={date}&format=csv
```

Returns a `text/csv` file download.

---

## 6. Implementation Plan

Estimated total: **10–12 weeks**

---

### Phase 1 — Foundation (Weeks 1–2)

**Goal:** Project scaffold, data model, and manual form working end-to-end before any AI is added.

#### Tasks
- Initialise Git repository with monorepo structure (`/app`, `/api`, `/pipeline`, `/dashboard`)
- Set up PostgreSQL database and run initial migrations
- Implement all database tables and indexes (see Section 4)
- Build the farmer-facing mobile form (manual path only — no photo yet)
- Build `POST /records` and `GET /records/{record_id}` endpoints
- Set up S3 bucket and `POST /photos/upload` endpoint
- Implement `GET /locations` endpoint with seed data for one test farm
- Deploy a staging environment

**Design decisions to lock in during this phase:**
- Final JSON schema (Section 3.2) — agreed before any pipeline code is written
- Location list for the first pilot farm
- Preferred language for the UI (Dutch / French / English)

**Deliverable:** Farmer can open the app, fill in a 5-field form, and see the record appear in the database. No AI yet.

---

### Phase 2 — Photo Upload & AI Extraction (Weeks 3–5)

**Goal:** Photo-based extraction working — farmer takes a photo, fields are pre-filled.

#### Tasks
- Add photo capture to the mobile app (camera + gallery picker)
- Upload photo to S3 on capture; return URL to app
- Build the AI processing pipeline:
  - Integrate vision model (GPT-4o Vision for rapid start, or YOLOv8 for self-hosted)
  - Detect and classify product type and category
  - Estimate quantity from object count / volume
  - Assess visible condition (fresh, bruised, damaged)
  - Run OCR (Tesseract or EasyOCR) to extract labels, expiry dates, lot numbers
  - Normalise and map all extracted values to the record schema
  - Compute per-field confidence scores
- Return pre-filled form fields + confidence scores to the app within 5 seconds
- App pre-fills form fields; highlights low-confidence fields in amber so farmer knows to check them
- Store raw OCR text and model name in `records` table

**Confidence thresholds:**
- ≥ 0.85 → auto-fill, no highlight
- 0.60–0.84 → pre-fill, amber highlight (farmer should verify)
- < 0.60 → leave blank, prompt farmer to fill manually

**Deliverable:** Farmer takes a photo → form is pre-filled within 5 seconds → farmer confirms and submits.

---

### Phase 3 — Mobile App Polish (Weeks 5–7)

**Goal:** App is usable by a non-technical farmer without explanation.

#### Tasks
- Implement offline support: queue submissions locally if no internet, sync when connection returns
- Add multilingual support (Dutch as primary; French and English as secondary)
- Show submission history: last 10 records, each showing product, quantity, date, status badge
- Add status feedback: "Record confirmed ✓" / "Needs review ⚠" pushed via notification or visible on next app open
- Batch submission: allow submitting multiple crates / products in one session
- Handle bad photos gracefully: if AI confidence is very low overall (< 0.4), show "Photo unclear — please fill manually" without crashing
- Test on low-end Android devices (the most common among the target user group)

**UI principles to maintain:**
- No free-text fields except the optional notes field
- Maximum 5 required fields — never ask for more in the main flow
- One screen, one submit button — no multi-step wizards
- Condition is always a 3-chip tap (Good / Mixed / Damaged), never a text field

**Deliverable:** App works offline, supports Dutch, and a first-time farmer can complete a submission without assistance.

---

### Phase 4 — Logistics Dashboard (Weeks 7–9)

**Goal:** Supply chain managers and buyers can see and act on the data farmers submit.

#### Features
- Overview table: all records from all connected farms, sortable by date / farm / product / status
- Record detail view: photo, extracted fields, confidence scores, confirm / flag / reject action
- Flagged records queue: records with overall confidence < 0.6 shown for human review
- Aggregate views: total quantity by product per week, condition breakdown per farm
- CSV export of any filtered view
- Webhook trigger: when a record reaches `confirmed` status, push payload to external LMS endpoint

**Deliverable:** A manager can open the dashboard, review the day's records, confirm or flag them, and export a CSV.

---

### Phase 5 — Validation & Accuracy Testing (Weeks 9–11)

**Goal:** Measure extraction quality and document results.

#### Tasks
- Collect ≥ 50 test images covering a variety of products, conditions, lighting conditions, and crate types
- Manually label all 50 images as ground truth
- Run the full AI pipeline against all 50 images
- Compute per-field accuracy: product type, quantity estimate (within ±20%), condition rating, expiry date extraction
- Document failure modes: image types where accuracy is consistently low
- Tune confidence thresholds based on results
- Expand dataset and retune if overall accuracy is below 75%

**Accuracy targets (minimum for MVP sign-off):**

| Field | Target accuracy |
|---|---|
| Product type | ≥ 85% |
| Quantity estimate (±20%) | ≥ 70% |
| Condition rating | ≥ 80% |
| Expiry date (when visible) | ≥ 75% |
| Location (from form) | 100% — always from dropdown |

**Deliverable:** Accuracy report with per-field metrics, documented failure modes, tuned thresholds.

---

### Phase 6 — Hardening & Handoff (Weeks 11–12)

**Goal:** System is stable, documented, and ready for a pilot with real farmers.

#### Tasks
- Rate limiting on all API endpoints (max 100 requests / minute per farmer)
- Input validation and sanitisation on all POST endpoints
- Logging and error monitoring (Sentry or equivalent)
- Admin endpoint to deactivate a farmer account or farm
- Full API documentation (auto-generated from FastAPI OpenAPI spec)
- Pilot onboarding guide for farmers (one-page PDF, with screenshots)
- Pilot onboarding guide for supply chain managers
- Runbook for common failure scenarios (photo upload fails, AI pipeline timeout, database connectivity)

**Deliverable:** Staged pilot-ready system with documentation for both farmer and manager user types.

---

## 7. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Mobile app | React Native (Expo) | Single codebase for iOS and Android; Expo simplifies camera and offline support |
| Backend API | FastAPI (Python) | Async, lightweight, auto-generates OpenAPI docs |
| AI — vision | GPT-4o Vision (MVP) → YOLOv8 (optimised) | GPT-4o for rapid start without training; YOLOv8 for production speed and cost |
| AI — OCR | EasyOCR | Better multilingual support than Tesseract; no training required |
| Database | PostgreSQL | Relational, mature, good JSON support for flexible fields |
| Object storage | AWS S3 (or MinIO for self-hosted) | Photo storage; presigned URLs for secure upload |
| Queue | Redis + Celery | Async AI processing so the API responds immediately |
| Dashboard | React + Recharts | Familiar, component-rich, easy CSV export |
| Hosting | Docker + Railway or Render | Simple containerised deploy without heavy DevOps |
| Monitoring | Sentry | Error tracking for both API and mobile app |

### Repository structure

```
/
├── app/               React Native mobile app (farmer-facing)
├── api/               FastAPI backend
│   ├── routers/       records, photos, locations, farmers
│   ├── models/        SQLAlchemy ORM models
│   ├── schemas/       Pydantic input/output schemas
│   └── pipeline/      AI extraction logic
├── dashboard/         React web dashboard (manager-facing)
├── migrations/        Alembic database migrations
├── tests/             API tests, pipeline accuracy tests
└── docs/              API docs, onboarding guides
```

---

## 8. Farmer-Facing App Design

### Screen flow

```
App open
   └── Home screen
         ├── "Log a harvest" button  →  Submission screen
         └── "My records" tab        →  History list
                                            └── Record detail

Submission screen
   ├── [Take a photo]         → Camera → AI processing → Pre-filled form
   ├── [Choose from gallery]  → Same as above
   └── [Fill in manually]     → Empty form
         │
         └── Form: product type, quantity, unit, condition, location, notes (optional)
               └── [Submit]  →  Success screen  →  Home
```

### Form fields — full specification

| Field | Input type | Options / validation |
|---|---|---|
| Product type | Dropdown | Predefined list per farm + "Other" |
| Quantity | Number input | Positive number, max 4 digits |
| Unit | Dropdown | Crates, Kg, Units, Boxes |
| Condition | 3-chip selector | Good / Mixed / Damaged |
| Location | Dropdown | Predefined locations for the farmer's farm |
| Notes (optional) | Text area | Max 200 characters |

### Offline behaviour

- Submissions made without internet are stored in local device storage
- A banner shows "Offline — 2 records queued" when connectivity is lost
- Records sync automatically when internet returns; farmer sees "Synced ✓"
- Photos are compressed to ≤ 1.5 MB before upload to reduce data usage

### Accessibility & localisation

- Primary language: Dutch (`nl`)
- Secondary: French (`fr`), English (`en`)
- Font size: minimum 16px for all body text — larger for buttons and labels
- Tap targets: minimum 48×48px
- High-contrast mode supported via OS accessibility settings

---

## 9. AI Processing Pipeline

### Processing flow

```
1. Receive photo URL from submission
2. Download photo from S3
3. Pre-process: resize to 1024px longest side, normalise brightness
4. Run vision model → extract product type, quantity, condition, bounding boxes
5. Run OCR on full image and on cropped label regions → extract text
6. Parse OCR output: expiry date (regex), lot number (regex), product name (fuzzy match)
7. Map all extracted values to record schema fields
8. Compute per-field confidence scores
9. Merge with form fields (form fields always override AI if provided by farmer)
10. Write completed record to database
11. Emit webhook if record confidence > 0.85 (auto-confirm) or flag for review
```

### Confidence scoring

Confidence for each field is computed as follows:

- Vision model returns a native confidence score for object classification
- OCR confidence is based on character recognition score from EasyOCR
- Form-supplied fields get confidence = 1.0 (farmer-entered data is treated as ground truth)
- Overall confidence = weighted average: product type (0.3), quantity (0.3), condition (0.2), expiry (0.1), location (0.1)

### Merge rules — photo vs form

When both a photo and a form submission are present:

| Field | Rule |
|---|---|
| Product type | Form wins if provided; otherwise use AI |
| Quantity | Form wins if provided; otherwise use AI |
| Condition | Form wins if provided; otherwise use AI |
| Expiry date | AI only (OCR); not asked in form |
| Lot number | AI only (OCR); not asked in form |
| Location | Form always (dropdown selection) |

### Timeout handling

- AI pipeline target: complete within 5 seconds
- Hard timeout: 15 seconds
- If timeout occurs: record is stored with `status = pending`, `extraction.method = timeout`; a retry job is queued automatically

---

## 10. Integration with Logistics Dashboard

### Webhook — outbound push

When a record reaches `confirmed` status (manually or automatically), the system posts to a configurable webhook URL:

```json
{
  "event": "record.confirmed",
  "record_id": "uuid",
  "farm_id": "uuid",
  "confirmed_at": "ISO 8601 datetime",
  "record": { "...full processed record payload..." }
}
```

The receiving logistics management system can use this to update stock levels, trigger transport routing, or notify buyers.

### Pull API — batch sync

Logistics systems that prefer polling over webhooks can call:

```
GET /records?farm_id={uuid}&status=confirmed&from={datetime}&limit=100
```

Returns a paginated list of confirmed records since the given datetime.

### CSV integration

For systems that ingest spreadsheets rather than JSON, a daily CSV export can be scheduled:

```
GET /records/export?farm_id={uuid}&from={yesterday}&to={today}&format=csv
```

This can be triggered by a cron job and emailed to a distribution list or dropped into a shared folder.

---

## 11. Validation & Accuracy

### Test image dataset — requirements

The validation set must include:

- At least 50 images total
- At least 5 different product types
- A mix of good, mixed, and damaged condition examples
- Indoor and outdoor lighting conditions
- Close-up (label-readable) and wide-angle (full crate / storage) shots
- At least 10 images with visible expiry dates or lot numbers

### Ground truth labelling

Each image in the test set must be manually labelled with:

```json
{
  "image_id": "string",
  "ground_truth": {
    "product_type": "string",
    "quantity": "number or null",
    "quantity_unit": "string or null",
    "condition": "good | mixed | damaged",
    "expiry_date": "ISO date or null",
    "lot_number": "string or null"
  }
}
```

### Accuracy metrics

For each field, accuracy is computed as:

- Product type: exact string match after normalisation (lowercase, strip whitespace)
- Quantity: within ±20% of ground truth value
- Condition: exact match (good / mixed / damaged)
- Expiry date: exact date match
- Lot number: exact string match

Report format:

| Field | Correct | Total | Accuracy | Notes |
|---|---|---|---|---|
| Product type | x | 50 | x% | |
| Quantity (±20%) | x | 50 | x% | |
| Condition | x | 50 | x% | |
| Expiry date | x | n (images with visible date) | x% | |
| Lot number | x | n | x% | |
| **Overall** | | | | weighted average |

---

## 12. Post-MVP Roadmap

After the pilot is validated, the following features are prioritised:

### Near-term (3–6 months post-MVP)
- Yield estimation: combine quantity records over time to predict harvest volume by week
- Integration with yield estimation project (see Project 1 — Visual Inputs)
- Push notifications to farmers when their record is confirmed or flagged
- In-app photo quality guidance: real-time feedback ("Move closer", "More light") before capture

### Medium-term (6–12 months)
- Freshness and shelf-life estimation from visual cues (colour, texture)
- Multi-product submissions: log several products in one session (e.g. a mixed-harvest day)
- Transport leg tracking: farmer marks "loaded onto truck" → transport partner marks "delivered"
- Buyer-facing view: let local consumers or buyers see aggregate availability by product type

### Long-term
- Fine-tuned vision model trained on farm-specific product images for higher accuracy
- Mobile-optimised capture interface: dedicated camera mode with overlay guides for crate photography
- Role-based access: different views for farmer, transport partner, distribution point, buyer, and manager

---

## Remarks

- A targeted product domain (e.g. vegetables, dairy, grain) should be chosen before the pilot to allow the predefined location list and product dropdown to be meaningful
- The yield estimation project (Project 1) shares the same JSON output schema — coordination between the two systems is recommended from the start
- Mock or historical image data is sufficient for accuracy testing during development; real farm images should be collected for the pilot validation phase
- Farmer onboarding should be done in person for the first pilot group — a one-page printed guide and a 10-minute walkthrough is sufficient for the 5-field form flow
