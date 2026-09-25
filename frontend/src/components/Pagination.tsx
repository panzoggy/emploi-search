import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  
  const pages = []
  const showPages = 5
  let start = Math.max(1, currentPage - Math.floor(showPages / 2))
  let end = Math.min(totalPages, start + showPages - 1)
  
  if (end - start + 1 < showPages) {
    start = Math.max(1, end - showPages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {start > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            className={currentPage === 1 ? 'bg-primary-600 text-white' : ''}
          >
            1
          </Button>
          {start > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}
      
      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
          className="min-w-[40px]"
        >
          {page}
        </Button>
      ))}
      
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className={currentPage === totalPages ? 'bg-primary-600 text-white' : ''}
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}