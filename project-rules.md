# AI Scan & Assessment Project Rules

## Project Goal
Build a web-based AI assessment system for handwritten student assignments.

Initial pilot:
- 1 teacher
- 310 students
- 1 subject
- Student self-upload
- Handwritten assignment scanning
- Multi-page submission
- PDF generation
- OCR
- AI rubric-based assessment
- AI feedback
- Teacher review and approval

## Technology
- Next.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Railway deployment
- JavaScript/TypeScript ecosystem

## Architecture Principles
1. Keep the MVP modular and simple.
2. Do not introduce microservices unless necessary.
3. AI providers must be abstracted behind an AIProvider interface.
4. OCR providers must be abstracted behind an OCRProvider interface.
5. Never hardcode API keys.
6. All secrets must use environment variables.
7. PostgreSQL stores metadata and assessment results.
8. File storage must be replaceable through a StorageProvider abstraction.
9. AI must never directly publish final grades.
10. Teacher approval is required before final grade publication.

## AI Rules
- AI returns structured JSON only.
- Validate all AI responses before saving.
- Support provider fallback.
- Do not retry endlessly.
- Failed AI jobs must not delete student submissions.
- Log provider errors without exposing API secrets.

## Security
- Passwords must be securely hashed.
- Implement role-based access.
- Students can access only their own submissions.
- Teacher can access only assigned students.
- Validate file types and file sizes.
- Do not expose secrets to the browser.

## Development Process
Before implementing a major feature:
1. Analyze requirements.
2. Create or update relevant documentation.
3. Propose the implementation plan.
4. Implement in small modules.
5. Run tests.
6. Fix errors.
7. Do not change unrelated files.

## MVP Priority
P0:
- Authentication
- Student management
- Assignment
- Rubric
- Student submission
- Multi-page scan
- PDF generation
- OCR
- AI assessment
- Teacher review
- Grade publishing

P1:
- Excel export
- Analytics
- Advanced image processing

P2:
- Parent dashboard
- WhatsApp
- Payments
- Multi-school SaaS