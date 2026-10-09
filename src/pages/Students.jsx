import { useState } from 'react'

// Popup form to add or edit a student
function StudentModal({ initialData, onClose, onSave }) {

  // If initialData is provided, use it (Edit Mode). Otherwise, use defaults (Add Mode).
  const isEditMode = !!initialData
  
  // Determine if branch is standard or custom
  const standardBranches = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical']
  const initialBranch = isEditMode ? initialData.branch : 'Computer Science'
  const isCustomBranch = isEditMode && !standardBranches.includes(initialBranch)
  
  const [name, setName] = useState(initialData?.name || '')
  const [rollNo, setRollNo] = useState(initialData?.rollNo || '')
  const [branch, setBranch] = useState(isCustomBranch ? 'Other' : initialBranch)
  const [customBranch, setCustomBranch] = useState(isCustomBranch ? initialBranch : '')
  const [year, setYear] = useState(initialData?.year || '1st Year')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [error, setError] = useState('')

  function handlePhoneChange(e) {
    // Allow only digits
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 10) {
      setPhone(value)
    }
  }

  function handleBranchChange(e) {
    setBranch(e.target.value)
    if (e.target.value !== 'Other') {
      setCustomBranch('')
    }
  }

  function handleSubmit() {
    if (!name || !rollNo) {
      setError('Name and Roll Number are required!')
      return
    }
    if (!phone || phone.length !== 10) {
      setError('Phone number must be exactly 10 digits!')
      return
    }
    if (branch === 'Other' && !customBranch.trim()) {
      setError('Please enter your branch name!')
      return
    }

    const finalBranch = branch === 'Other' ? customBranch.trim() : branch
    
    // Pass back data, including _id if editing
    const studentData = { name, rollNo, branch: finalBranch, year, phone, email }
    if (isEditMode) {
      studentData._id = initialData._id
    }
    
    onSave(studentData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>🎓 {isEditMode ? 'Edit Student' : 'Add New Student'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">⚠️ {error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" placeholder="Enter full name"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Roll Number *</label>
              <input className="form-control" placeholder="e.g. CS2201"
                value={rollNo} onChange={e => setRollNo(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Branch</label>
              <select className="form-control" value={branch} onChange={handleBranchChange}>
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
                <option>Electrical</option>
                <option>Other</option>
              </select>
              {branch === 'Other' && (
                <input className="form-control" style={{ marginTop: 8 }}
                  placeholder="Enter your branch name"
                  value={customBranch} onChange={e => setCustomBranch(e.target.value)} />
              )}
            </div>
            <div className="form-group">
              <label>Year</label>
              <select className="form-control" value={year} onChange={e => setYear(e.target.value)}>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input className="form-control" type="tel" placeholder="10 digit number"
                maxLength={10} value={phone} onChange={handlePhoneChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="student@college.edu"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-gray" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={handleSubmit}>
            {isEditMode ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Students Page - Main Component
// =============================================
export default function Students({ students, setStudents, showToast, API, currentUser }) {

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.role === 'Super Admin' || currentUser?.username?.toLowerCase() === 'superadmin'

  // Search filter with safe property access
  const filteredStudents = (students || []).filter(s => s && (
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo || '').toLowerCase().includes(search.toLowerCase()) ||
    (isSuperAdmin && s.accountUsername && s.accountUsername.toLowerCase().includes(search.toLowerCase()))
  ))

  // Add or Edit a student
  async function handleSaveStudent(studentData) {
    // Check duplicate roll number for same account
    const isDuplicateRoll = (students || []).some(s =>
      s &&
      s._id !== studentData._id &&
      s.rollNo?.toLowerCase() === studentData.rollNo?.toLowerCase() &&
      (!studentData.accountUsername || s.accountUsername?.toLowerCase() === studentData.accountUsername?.toLowerCase())
    )
    if (isDuplicateRoll) {
      showToast(`Roll number "${studentData.rollNo}" is already assigned to another student!`, 'error')
      return
    }

    if (studentData._id) {
      // Edit Mode
      try {
        const res = await fetch(`${API}/students/${studentData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update student')
        }
        setStudents(prev => prev.map(s => s._id === studentData._id ? data : s))
        showToast(`${studentData.name}'s details updated successfully!`)
      } catch (err) {
        showToast(err.message || 'Failed to update student!', 'error')
      }
    } else {
      // Add Mode
      try {
        const payload = {
          ...studentData,
          accountUsername: currentUser?.username || ''
        }
        const res = await fetch(`${API}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to add student')
        }
        setStudents(prev => [...prev, data])
        showToast(`${studentData.name} has been added successfully!`)
      } catch (err) {
        showToast(err.message || 'Failed to add student!', 'error')
      }
    }
    setShowModal(false)
    setEditingStudent(null)
  }

  // Delete a student
  async function handleDelete(id, name) {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return
    try {
      const res = await fetch(`${API}/students/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete student')
      }
      setStudents(prev => prev.filter(s => s._id !== id))
      showToast(`${name} has been removed`)
    } catch (err) {
      showToast(err.message || 'Failed to delete student!', 'error')
    }
  }
  
  function openAddModal() {
    setEditingStudent(null)
    setShowModal(true)
  }
  
  function openEditModal(student) {
    setEditingStudent(student)
    setShowModal(true)
  }

  return (
    <div>
      {/* Filter Row */}
      <div className="filter-row">
        <div className="search-box" style={{ flex: 1 }}>
          🔍 <input placeholder={isSuperAdmin ? "Search by student name, roll number, or account..." : "Search by student name or roll number..."}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-green" onClick={openAddModal}>
          ➕ Add Student
        </button>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="card-header">
          <h3>🎓 Student List ({filteredStudents.length})</h3>
        </div>
        <div className="table-wrap">
          {filteredStudents.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">👤</div>
              <p>No students found. Use the button above to add one.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Phone</th>
                  {isSuperAdmin && <th>Account</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id}>
                    <td style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{index + 1}</td>
                    <td>
                      <strong>{student.name}</strong>
                      {student.email && <><br /><small style={{ color: 'var(--text-muted)' }}>{student.email}</small></>}
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        {student.rollNo}
                      </code>
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{student.branch}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{student.year}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{student.phone || '—'}</td>
                    {isSuperAdmin && (
                      <td>
                        <span className="badge badge-admin" style={{ fontSize: 11 }}>
                          @{student.accountUsername || 'admin'}
                        </span>
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-blue" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => openEditModal(student)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-red" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => handleDelete(student._id, student.name)}>
                          🗑️ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <StudentModal 
          initialData={editingStudent} 
          onClose={() => {
            setShowModal(false)
            setEditingStudent(null)
          }} 
          onSave={handleSaveStudent} 
        />
      )}
    </div>
  )
}
