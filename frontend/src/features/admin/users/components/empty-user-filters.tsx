export function EmptyUserFilters() {
  return (
    <div className="py-3">
      <p className="font-semibold text-[var(--admin-ink)]">No users match the current filters.</p>
      <p className="mt-1 text-xs text-[var(--admin-faint)]">
        Clear search or broaden role/status filters.
      </p>
    </div>
  );
}
