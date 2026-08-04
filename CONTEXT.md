# Manga Production

This context defines how a manga Series moves from production work to editorial review and publication.

## Language

**Tantou Editor**:
The single active Editor assigned to a Series who reviews complete Chapters and controls their editorial decision.
_Avoid_: EIC, Page reviewer

**Page**:
A content unit inside a Chapter and the assignment unit for Assistant work. A Page has no Tantou review lifecycle of its own.
_Avoid_: Review item, editorial submission

**Page Task**:
Work assigned to one Assistant for one Page and accepted or rejected by that Assistant before work starts.
_Avoid_: Region task, Chapter task

**Chapter Review**:
The Tantou decision process over a complete Chapter after the Mangaka has approved all Assistant results and finished production.
_Avoid_: Page review, Assistant review

**Review Snapshot**:
The immutable Chapter and Page-asset versions captured when a Chapter enters Tantou review.
_Avoid_: Draft, live pages

**Supporting Material**:
An optional reference attachment that gives context to a Proposal or Series. It has no review, approval, or archive lifecycle of its own.
_Avoid_: Manuscript, review item, approved material

**Archive**:
A retained but inactive Proposal or Series. Chapters and Supporting Materials follow their parent lifecycle and are never archived independently.
_Avoid_: Archived Chapter, archived material, deleted record

**Board Voting Session**:
An immutable decision round for one Proposal using a snapshot of the eligible Board electorate and the Proposal version.
_Avoid_: Board vote, tie-break session

**Re-vote**:
The single additional Board Voting Session opened after a fully participated tied round.
_Avoid_: Tie-break, unlimited re-vote

**Tie Policy**:
The rule applied when the Re-vote is also tied: the Chair decides, the Proposal is rejected, or the Proposal returns to the Board queue.
_Avoid_: Tie-break action
