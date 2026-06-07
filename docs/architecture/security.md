# Security Rules

## Role-based access

All sensitive routes must use backend permission checks.

Admin cannot override Board decisions.

## Assistant access

Assistant can access only:

- Assigned task
- Assigned page/region
- Selected context pages read-only
- Own submissions

Assistant cannot access full chapter by default.

## File access

- Private storage only.
- Signed URL required.
- Original files should not be downloadable unless explicitly allowed.

## High-risk endpoints

- Role update
- Board decision
- Payroll calculation
- File signed URL
- AI processing
- Task workspace access

## AI output storage

Do not store base64 AI image output in MongoDB.
