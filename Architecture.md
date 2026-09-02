# System Architecture
# AI Scan & Assessment

## Architecture Goal

Build a simple modular monolith suitable for:

- 1 teacher
- 310 students
- Initial Railway deployment

The system must be able to grow without requiring an immediate rewrite.

---

## Technology Stack

Frontend:
Next.js
TypeScript

Backend:
Next.js API / Server Actions / Route Handlers

Database:
PostgreSQL

ORM:
Prisma

Deployment:
Railway

File Processing:
Image processing abstraction
PDF generation module

OCR:
OCRProvider abstraction

AI:
AIProvider abstraction

Storage:
StorageProvider abstraction

---

## High-Level Architecture

Client
│
├── Student Web Interface
│
├── Teacher Web Interface
│
▼
Next.js Application
│
├── Authentication Module
├── Authorization Module
├── Assignment Module
├── Rubric Module
├── Submission Module
├── PDF Module
├── OCR Module
├── AI Assessment Module
├── Teacher Review Module
└── Analytics Module
│
├───────────────┬────────────────┐
▼               ▼                ▼
PostgreSQL   StorageProvider   Background Jobs
                 │                │
                 ▼                ▼
              PDF Files      OCRProvider
                              AIProvider

---

## Design Principle

Use a modular monolith.

Do not create microservices during MVP.

Each major module must have clear responsibilities.

---

## Provider Architecture

### AIProvider

Interface responsibilities:

- gradeAssignment()
- validateResponse()
- reportUsage()

Providers may include:

- MockAIProvider
- GeminiProvider
- GroqProvider
- Future providers

AI business logic must use AIProvider interface.

---

### OCRProvider

Interface responsibilities:

- extractText()
- returnConfidence()

Providers may include:

- MockOCRProvider
- Future OCR providers

---

### StorageProvider

Interface responsibilities:

- upload()
- getUrl()
- delete()
- getMetadata()

Providers:

- LocalStorageProvider for development
- Railway-compatible storage during pilot
- Future object storage provider

---

## Processing Workflow

Student submits pages.

1. Submission stored.
2. Submission status becomes SUBMITTED.
3. Background processing starts.
4. Generate PDF.
5. Run OCR.
6. Store OCR result.
7. Run AI assessment.
8. Validate structured result.
9. Store AI assessment.
10. Mark NEEDS_TEACHER_REVIEW.

Teacher reviews result.

---

## Failure Handling

If PDF fails:

Submission remains stored.

If OCR fails:

Submission status is FAILED.
Error is logged.
Retry may be attempted.

If AI fails:

OCR result remains stored.
Submission is not deleted.
AI may retry using another provider.

---

## Queue Principle

AI processing must not run synchronously during student submission.

Submission must return quickly.

Processing happens asynchronously.

MVP may use a simple database-backed job approach.

Do not add Redis unless proven necessary.

---

## Scalability Principle

Initial:

1 Teacher
310 Students

Future:

10+ Teachers
3,000+ Students

Scale components independently when required:

- Application service
- Background worker
- Database
- Storage

Do not prematurely optimize.
