import { useState } from 'react'

// Popup form to add a new book
function AddBookModal({ onClose, onAdd }) {

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('Computer Science')
  const [isbn, setIsbn] = useState('')
  const [copies, setCopies] = useState(1)
  const [error, setError] = useState('')

  function handleSubmit() {
    // Validation
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setError('Title, Author and ISBN are required!')
      return
    }
    const numCopies = parseInt(copies, 10)
    if (isNaN(numCopies) || numCopies < 1) {
      setError('Total copies must be at least 1!')
      return
    }
    // Send data to parent
    onAdd({
      title: title.trim(),
      author: author.trim(),
      genre,
      isbn: isbn.trim(),
      copies: numCopies,
      available: numCopies
    })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>➕ Add New Book</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">⚠️ {error}</div>}

          <div className="form-group">
            <label>Book Title *</label>
            <input className="form-control" placeholder="Enter book title"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Author *</label>
              <input className="form-control" placeholder="Enter author name"
                value={author} onChange={e => setAuthor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Genre / Subject</label>
              <select className="form-control" value={genre} onChange={e => setGenre(e.target.value)}>
                <option>Computer Science</option>
                <option>Physics</option>
                <option>Mathematics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>Fiction</option>
                <option>History</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ISBN Number *</label>
              <input className="form-control" placeholder="e.g. ISBN-001"
                value={isbn} onChange={e => setIsbn(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Total Copies</label>
              <input className="form-control" type="number" min="1"
                value={copies} onChange={e => setCopies(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-gray" onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" onClick={handleSubmit}>Add Book</button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Books Page - Main Component
// =============================================
export default function Books({ books, setBooks, showToast, API, currentUser }) {

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.role === 'Super Admin' || currentUser?.username?.toLowerCase() === 'superadmin'

  // Search filter with safe property access
  const filteredBooks = (books || []).filter(b => b && (
    (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase()) ||
    (isSuperAdmin && b.accountUsername && b.accountUsername.toLowerCase().includes(search.toLowerCase()))
  ))

  // Add a new book (backend + state update)
  async function handleAddBook(bookData) {
    try {
      const payload = {
        ...bookData,
        accountUsername: currentUser?.username || ''
      }
      const res = await fetch(`${API}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add book')
      }
      setBooks(prev => [...prev, data])
      showToast(`"${bookData.title}" has been added successfully!`)
    } catch (err) {
      showToast(err.message || 'Failed to add book!', 'error')
    }
  }

  // Delete a book
  async function handleDelete(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      const res = await fetch(`${API}/books/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete book')
      }
      setBooks(prev => prev.filter(b => b._id !== id))
      showToast(`"${title}" has been deleted`)
    } catch (err) {
      showToast(err.message || 'Failed to delete book!', 'error')
    }
  }

  return (
    <div>
      {/* Filter Row */}
      <div className="filter-row">
        <div className="search-box" style={{ flex: 1 }}>
          🔍 <input placeholder={isSuperAdmin ? "Search by book title, author, or account..." : "Search by book title or author..."}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-blue" onClick={() => setShowModal(true)}>
          ➕ Add Book
        </button>
      </div>

      {/* Books Table */}
      <div className="card">
        <div className="card-header">
          <h3>📚 Book List ({filteredBooks.length})</h3>
        </div>
        <div className="table-wrap">
          {filteredBooks.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">📭</div>
              <p>No books found. Use the "Add Book" button above to add one.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>ISBN</th>
                  <th>Total</th>
                  <th>Available</th>
                  {isSuperAdmin && <th>Account</th>}
                  <th>Status</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book, index) => (
                  <tr key={book._id}>
                    <td style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{index + 1}</td>
                    <td><strong>{book.title}</strong></td>
                    <td>{book.author}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{book.genre}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{book.isbn}</td>
                    <td>{book.copies}</td>
                    <td><strong style={{ color: book.available === 0 ? 'var(--danger)' : 'var(--success)' }}>{book.available}</strong></td>
                    {isSuperAdmin && (
                      <td>
                        <span className="badge badge-admin" style={{ fontSize: 11 }}>
                          @{book.accountUsername || 'admin'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`badge ${book.available > 0 ? 'badge-available' : 'badge-issued'}`}>
                        {book.available > 0 ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-red" style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => handleDelete(book._id, book.title)}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && <AddBookModal onClose={() => setShowModal(false)} onAdd={handleAddBook} />}
    </div>
  )
}
