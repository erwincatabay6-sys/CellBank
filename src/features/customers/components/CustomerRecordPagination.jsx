import "./CustomerRecordPagination.css";

export default function CustomerRecordPagination({
  label, page, pageCount, onPageChange, numbered = false, disabled = false, children,
}) {
  const first = Math.max(1, Math.min(page - 2, pageCount - 4));
  const numbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => first + index);

  return (
    <div className="customer-record-footer">
      <p role="status">{children}</p>
      {pageCount > 1 && (
        <nav className="customer-record-pagination" aria-label={label}>
          <button
            className="secondary-repair-button"
            type="button"
            disabled={disabled || page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          {numbered && (
            <>
              <div className="customer-record-page-numbers">
                {numbers.map((number) => (
                  <button
                    key={number}
                    className="secondary-repair-button"
                    type="button"
                    aria-label={`Page ${number}`}
                    aria-current={number === page ? "page" : undefined}
                    disabled={disabled}
                    onClick={() => onPageChange(number)}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <span className="customer-record-page-position">Page {page} of {pageCount}</span>
            </>
          )}
          <button
            className="secondary-repair-button"
            type="button"
            disabled={disabled || page === pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
