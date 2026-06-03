# Execution Plan

## Step 1: API Utilities
Create `client/src/features/comment/api/comment.ts` containing API request helpers to query and mutate comments:
- Fetch comments by target type and target ID.
- Create comments.
- Update/delete comments.
- Perform state transitions (`/mark-fixed`, `/verify-fixed`, `/resolve`, `/reopen`).

## Step 2: Component Structure
Create UI components in `client/src/features/comment/components/`:
- `CommentPanel.tsx`: The main sidebar container.
- `CommentList.tsx`: Displays list of messages with date/author.
- `CommentItem.tsx`: Individual comment bubble, displaying statuses, action logs, and role-based buttons.
- `ReopenDialog.tsx`: Dialog to prompt editors for a reason before reopening a comment.

## Step 3: Sidebar Integration
- Open `client/src/features/page/routes/PageWorkspacePage.tsx` or the corresponding workspace component.
- Integrate `CommentPanel` inside the right sidebar tabs, mapping the page target and annotation target.

## Step 4: Testing & Type Checking
- Write tests in `client/src/features/comment/components/CommentPanel.test.tsx` (mocking the API calls).
- Verify building and compilation.
