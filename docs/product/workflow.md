# Manga Production Workflow

## Core Workflow

```text
Clerk login
  -> create series
  -> upload manuscript
  -> editor manuscript review
  -> create chapter and upload pages
  -> annotate page regions
  -> assign assistant tasks
  -> assistant submits work
  -> mangaka reviews submission
  -> editor final approval
  -> board vote and ranking review
  -> publication decision
  -> payroll tracking
```

## Series Approval

- A series starts as a draft or submitted proposal.
- Editors and board members review eligible series.
- Board votes are collected from board members.
- The board chair finalizes approval, rejection, or cancellation decisions.
- Ranking and reader score signals support publishing decisions.

## Page Production

- Manga pages can have original, preview, thumbnail, AI-processed, and
  submitted file versions.
- Regions identify work areas on a page.
- Region coordinates must be normalized to support responsive display and
  different image sizes.
- Tasks can target a page or a specific region.

## Assistant Task Flow

- Tasks are assigned to assistants with type, deadline, page/region context,
  and instructions.
- Assistants submit one or more work versions.
- Mangaka reviews assistant submissions first.
- Approved work can feed assistant earnings.
- Revision requests keep work visible until resolved.

## Comment Resolution

- Comments support editor and mangaka feedback loops.
- Comment states must make unresolved work visible.
- Final responsibility depends on workflow context: mangaka handles assistant
  submission feedback, editor handles final production approval feedback.

## Ranking

- Reader score is normalized before ranking calculations.
- Ranking combines vote count and normalized reader score.
- Simple sum is not used because it can overweight raw scale differences.
- Low ranking can trigger at-risk or cancellation review workflows.

## Payroll

- Payroll tracks assistant earnings from approved task work.
- Task rates are configurable by task type.
- Deadline bonus and penalty rules affect final payment.
- Payroll is product evidence, not just a report; it must be derived from
  approved workflow state.

## Phase 0 Boundary

Phase 0 only proves that the application surfaces exist and can expose health
or build smoke checks. No production workflow states are implemented in Phase
0.
