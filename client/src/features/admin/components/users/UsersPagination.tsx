import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsersPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function UsersPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: UsersPaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white rounded-b-xl">
      <div className="text-xs text-gray-500">
        Showing {start} to {end} of {totalItems} users
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="min-w-16 text-center text-xs font-semibold text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
