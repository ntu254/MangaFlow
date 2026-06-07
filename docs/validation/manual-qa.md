# Manual QA Checklist

## Auth

- Login as Admin
- Create Mangaka, Assistant, Editor, Board
- Suspend user and confirm login fails

## Series flow

- Mangaka creates Series
- Upload manuscript
- Submit to Editor
- Editor requests revision
- Mangaka uploads new version
- Editor forwards to Board
- Board approves
- Mangaka creates Chapter

## Task flow

- Upload page
- Create region
- Add Assistant to Production Team
- Assign task
- Assistant opens Task Workspace
- Assistant submits
- Mangaka approves
- Editor approves
- Payroll created

## Forbidden checks

- Assistant cannot open page workspace directly
- Assistant outside Production Team cannot be assigned
- Chapter cannot be created before approval
- Publish fails with unresolved comments
