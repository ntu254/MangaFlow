# ADR 0003 — Database Design

## Status

Accepted

## Decision

Use MongoDB collections with Mongoose schemas.

Core relationship model:

```txt
User
Series
SeriesMember
Chapter
Page
Region
Task
Submission
Comment
BoardVote
Ranking
Payroll
```

## Reason

MangaFlow entities are workflow documents with nested metadata, versions, and flexible relationships. Mongoose supports fast schema iteration while still enforcing validation and indexes.
