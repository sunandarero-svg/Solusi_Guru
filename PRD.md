# Product Requirements Document
# AI Scan & Assessment

## 1. Product Overview

AI Scan & Assessment adalah aplikasi web untuk membantu guru
memeriksa tugas tulisan tangan siswa secara lebih cepat.

Siswa memfoto atau menscan tulisan tangan menggunakan perangkat mereka.

Sistem akan melakukan:

Scan/Upload
→ Quality Check
→ Multi-page Processing
→ PDF Generation
→ OCR
→ AI Assessment
→ Rubric Scoring
→ AI Feedback
→ Teacher Review
→ Final Grade
→ Publish Result

AI memberikan rekomendasi nilai dan feedback.

Guru tetap memiliki otoritas penuh terhadap nilai akhir.

---

## 2. Initial Pilot

Target MVP:

- 1 Teacher
- 310 Students
- 1 Subject
- Up to 10 active assignments
- Maximum 5 pages per submission

Development testing stages:

1. 10 students
2. 30 students
3. 100 students
4. 310 students

---

## 3. Problem Statement

Teachers spend significant time:

- Collecting assignments
- Reading handwritten answers
- Scoring assignments
- Applying rubrics
- Writing feedback
- Recording grades
- Identifying students needing attention

The system aims to reduce repetitive assessment work.

---

## 4. Product Goal

Primary goal:

Reduce teacher grading time by at least 50 percent.

Secondary goals:

- Enable students to submit handwritten assignments independently
- Standardize rubric-based assessment
- Generate draft feedback automatically
- Give teachers final control over grades
- Provide simple class-level assessment analytics

---

## 5. Users

### TEACHER

Teacher can:

- Login
- Manage students
- Create assignments
- Create rubrics
- Review submissions
- View PDF
- View OCR result
- View AI assessment
- Edit scores
- Edit feedback
- Approve grades
- Publish grades
- Export results

### STUDENT

Student can:

- Login
- View assignments
- View instructions
- View deadlines
- Scan/upload assignments
- Add multiple pages
- Preview pages
- Delete pages
- Reorder pages
- Submit assignments
- View submission status
- View published grades
- View feedback

---

## 6. Core Workflow

### Teacher

Create Assignment
→ Create Rubric
→ Publish
→ Students Submit
→ AI Processing
→ Teacher Review
→ Approve
→ Publish Grades

### Student

Login
→ Select Assignment
→ Scan/Upload
→ Preview
→ Add Pages
→ Generate PDF
→ Submit
→ Processing
→ View Result

---

## 7. Assignment Requirements

An assignment contains:

- Title
- Description
- Instructions
- Subject
- Deadline
- Maximum page count
- Status

Assignment statuses:

DRAFT
PUBLISHED
CLOSED
ARCHIVED

---

## 8. Rubric Requirements

A rubric contains multiple criteria.

Example:

Content: 30
Structure: 25
Language: 20
Spelling: 15
Neatness: 10

Total score must equal 100.

Each criterion contains:

- Name
- Description
- Maximum score
- Weight
- Optional performance guidance

---

## 9. Submission Requirements

Students can submit:

- JPG
- JPEG
- PNG

MVP maximum:

- 5 pages
- Configurable file size limit

Student actions:

- Capture image
- Upload image
- Preview
- Rotate
- Delete
- Reorder
- Retake

Submission statuses:

DRAFT
SUBMITTED
PROCESSING
OCR_COMPLETED
AI_COMPLETED
NEEDS_TEACHER_REVIEW
APPROVED
PUBLISHED
FAILED

A failed OCR or AI process must never delete the student submission.

---

## 10. PDF Requirements

System generates a PDF from ordered submission pages.

Requirements:

- Preserve page order
- Optimize file size
- Maintain readable handwriting
- Store PDF metadata
- Do not mix application metadata with OCR answer pages

---

## 11. Quality Check

System checks:

- File type
- File size
- Orientation
- Basic blur detection
- Basic brightness detection

The system may warn students if:

- Image is too blurry
- Image is too dark
- Image quality is too low

MVP must not claim perfect handwriting detection.

---

## 12. OCR Requirements

OCR pipeline:

Submission Pages
→ Image Processing
→ OCR Provider
→ Extracted Text
→ Confidence Score

Store:

- Extracted text
- Confidence
- Provider
- Processing status

Low-confidence results should be flagged for teacher review.

---

## 13. AI Assessment

AI receives:

- Assignment instructions
- Rubric
- OCR extracted text

AI returns structured JSON.

Example:

{
  "totalScore": 84,
  "confidence": 0.91,
  "criteria": [
    {
      "criterion": "Content",
      "score": 27,
      "maxScore": 30,
      "reason": "..."
    }
  ],
  "feedback": "..."
}

AI score is never automatically considered the final score.

---

## 14. Teacher Review

Teacher can:

- View PDF
- View OCR text
- View OCR confidence
- View AI score
- View criterion scores
- View AI feedback
- Edit score
- Edit feedback
- Approve assessment

Final grade requires teacher approval.

---

## 15. Grade Publishing

After approval:

Teacher clicks Publish.

Student can view:

- Final score
- Criterion results
- Teacher feedback
- Publication date

---

## 16. AI Provider Requirements

AI implementation must support:

- Multiple providers
- Provider abstraction
- Structured output
- Fallback
- Rate limit handling
- Retry limits
- Error logging

Initial development must support mock AI.

Business logic must never depend directly on one provider.

---

## 17. OCR Provider Requirements

OCR implementation must support:

- Provider abstraction
- Mock provider
- Provider replacement
- Error handling
- Confidence scores

Business logic must never depend directly on one OCR provider.

---

## 18. Security Requirements

- Secure password hashing
- Role-based access
- Student only accesses own data
- Teacher accesses assigned students only
- Validate uploads
- Validate file size
- Validate MIME type
- Store secrets in environment variables
- Never expose API keys in browser code

---

## 19. Performance Requirements

Initial target:

- Dashboard normal load under 3 seconds
- Upload progress visible
- AI processing asynchronous
- Application remains responsive during AI processing

310 submissions must not trigger simultaneous uncontrolled AI requests.

---

## 20. MVP Out of Scope

Not included initially:

- Parent dashboard
- WhatsApp integration
- Payment system
- Multi-school SaaS
- Advanced plagiarism detection
- Perfect handwriting recognition
- Automatic final grade without teacher review
- Complex microservice architecture

---

## 21. MVP Success Criteria

Pilot is successful when:

- At least 90% of students can submit independently
- At least 90% of submissions are successfully processed
- AI/OCR failures do not cause data loss
- Teacher saves at least 50% grading time
- Teacher maintains final grading control
- Pilot works with 310 students