# Database Design

## Database

PostgreSQL

ORM:

Prisma

---

# Core Entities

## User

Fields:

- id
- email
- passwordHash
- role
- createdAt
- updatedAt

Roles:

TEACHER
STUDENT

---

## TeacherProfile

Fields:

- id
- userId
- fullName

Relationship:

User 1 → 1 TeacherProfile

---

## StudentProfile

Fields:

- id
- userId
- studentNumber
- fullName

Relationship:

User 1 → 1 StudentProfile

---

## Class

Fields:

- id
- name
- description

---

## Enrollment

Connects students to classes.

Fields:

- id
- studentId
- classId

---

## TeacherClass

Connects teacher to class.

Fields:

- id
- teacherId
- classId

---

## Assignment

Fields:

- id
- teacherId
- classId
- title
- description
- instructions
- deadline
- maxPages
- status
- createdAt
- updatedAt

---

## Rubric

Fields:

- id
- assignmentId
- title
- totalScore

---

## RubricCriterion

Fields:

- id
- rubricId
- name
- description
- maxScore
- order

Total maxScore must equal 100.

---

## Submission

Fields:

- id
- assignmentId
- studentId
- status
- submittedAt
- createdAt
- updatedAt

---

## SubmissionPage

Fields:

- id
- submissionId
- pageNumber
- storageKey
- originalFileName
- mimeType
- fileSize

---

## SubmissionDocument

Fields:

- id
- submissionId
- storageKey
- fileSize
- pageCount
- createdAt

Used for generated PDF.

---

## OCRResult

Fields:

- id
- submissionId
- provider
- extractedText
- confidence
- status
- processedAt

---

## AIAssessment

Fields:

- id
- submissionId
- provider
- suggestedScore
- confidence
- feedback
- status
- createdAt

---

## AssessmentCriterion

Fields:

- id
- assessmentId
- rubricCriterionId
- score
- maxScore
- reason

---

## TeacherReview

Fields:

- id
- submissionId
- teacherId
- finalScore
- finalFeedback
- status
- reviewedAt

Statuses:

DRAFT
APPROVED
PUBLISHED

---

# Main Relationships

User
├── TeacherProfile
└── StudentProfile

Teacher
└── Class
    └── Students

Teacher
└── Assignment
    └── Rubric
        └── RubricCriteria

Student
└── Submission
    ├── SubmissionPages
    ├── SubmissionDocument
    ├── OCRResult
    ├── AIAssessment
    │   └── AssessmentCriteria
    └── TeacherReview



    