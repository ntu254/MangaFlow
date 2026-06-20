# Workflows (state machines)

## Manuscript / Chapter

```
draft ──submit──> in-review ──request revision──> revision ──┐
                       │                                      │
                       ├──forward to board──> board ──vote──> approved / rejected
                       │                                      │
                       └────────────────────────────────────> approved ──schedule──> scheduled ──publish──> published
```

## Submission (two rounds)

```
assigned → in-progress → submitted
                         │
                         ├── Mangaka approve (round 1) ──> awaiting Editor
                         │                                  │
                         │                                  ├── Editor approve (round 2) ──> approved
                         │                                  └── Request changes ──────────> back to Assistant
                         └── Request changes ─────────────> back to Assistant
```

## Board vote

```
open ──collect votes──> tally ──(majority)──> approve | revision | reject
                                 ──(tie)──> Chair tie-break
```

## Publication

```
ready ──schedule(date)──> scheduled ──publish──> published
                          └── unschedule ──> ready
                          └── cancel    ──> cancelled
```

## Payroll

```
task.approved ──auto─create──> pending ──confirm──> confirmed ──mark paid──> paid
```
