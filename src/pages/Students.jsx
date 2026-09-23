import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import StudentCard from '../components/students/StudentCard'
import StudentForm from '../components/students/StudentForm'
import SearchBox from '../components/ui/SearchBox'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Plus, Users } from '../components/ui/Icon'

export default function Students() {
  const { students, classNamesOf, deleteStudent } = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  // The search term lives in the URL so the topbar search can deep-link here.
  const term = params.get('q') || ''
  const setTerm = (v) => setParams(v ? { q: v } : {}, { replace: true })

  const [editing, setEditing] = useState(null)   // student object or 'new'
  const [confirming, setConfirming] = useState(null)

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase()
    if (!t) return students
    return students.filter((s) =>
      [s.name, s.email, s.notes, ...classNamesOf(s)].join(' ').toLowerCase().includes(t)
    )
  }, [students, term, classNamesOf])

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h3>Students</h3>
          <p>Manage your student roster</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={20} /> Add student
        </button>
      </div>

      <SearchBox value={term} onChange={setTerm} placeholder="Search by name, email or class" />

      <div className="grid3">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Users size={30} />}
            title={term ? 'No students match that search' : 'No students yet'}
            body={term ? 'Try a different name, email or class.' : 'Add your first student to start building the roster.'}
            actionLabel="Add student"
            onAction={() => setEditing('new')}
          />
        ) : (
          visible.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onEdit={() => setEditing(s)}
              onDelete={() => setConfirming(s)}
            />
          ))
        )}
      </div>

      {editing && (
        <StudentForm
          student={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete student?"
          body={`${confirming.name} will be removed from your roster and from every class. This can't be undone.`}
          confirmLabel="Delete student"
          onConfirm={async () => {
            try { await deleteStudent(confirming.id); toast('Student deleted.') }
            catch { toast('Could not delete that student.') }
          }}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  )
}
