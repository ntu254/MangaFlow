# Sample Story

## User Story US-001

As a Mangaka, I want to assign a translation task to an Assistant for one bubble region while giving read-only access to previous and next pages, so the Assistant can translate with context without seeing the whole chapter.

## Contract

`docs/contracts/task-assignment.md`

## Acceptance criteria

- Assistant must already be in Production Team.
- Task can be region-level.
- Context pages must belong to same chapter.
- Assistant can only edit assigned task.
- Assistant can view context pages read-only.
- Assistant cannot view unrelated pages.

## Verify

```bash
npm run test -- task-assignment
npm run build
```

Manual QA:

1. Add Assistant to Production Team.
2. Create region on Page 5.
3. Assign task with context pages 4 and 6.
4. Login as Assistant.
5. Confirm Assistant can see Page 5, 4, 6.
6. Confirm Assistant cannot see Page 1.
