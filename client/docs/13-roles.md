# Roles

5 roles defined in `src/lib/role.tsx`:

| id        | label     | JP           |
| --------- | --------- | ------------ |
| admin     | Admin     | 管理者       |
| mangaka   | Mangaka   | 漫画家       |
| editor    | Editor    | 担当編集     |
| assistant | Assistant | アシスタント |
| board     | Board     | 編集会議     |

## Visibility (Phase 1)

The Sidebar filters items by role (`src/components/site/Sidebar.tsx`). Within
a page, gate destructive or role-specific actions with a simple
`useRole()` check — do not branch route trees by role. There is no real
auth in Phase 1; `RoleProvider` just stores the chosen role in
`localStorage`.

## Phase-2 plan

When Cloud is enabled, replace `RoleProvider` with a hook that reads the
authenticated user + their `user_roles` rows via the `has_role()` security
definer function (see Lovable's user-roles knowledge). Route guards then
move into `_authenticated` and a role-specific `beforeLoad`.
