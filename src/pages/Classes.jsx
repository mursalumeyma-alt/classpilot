import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import ClassCard from '../components/classes/ClassCard'
import ClassForm from '../components/classes/ClassForm'
import ClassDetail from '../components/classes/ClassDetail'
import StudentForm from '../components/students/StudentForm'
import SearchBox from '../components/ui/SearchBox'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Plus, Book } from '../components/ui/Icon'

export default function Classes() {
  const { classes, deleteClass } = useData()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  const [term, setTerm] = useState('')
  const [editing, setEditing] = useState(null)       // class object or 'new'
  const [viewing, setViewing] = useState(null)       // class object
  const [editingStudent, setEditingStudent] = useState(null)
  const [confirming, setConfirming] = useState(null)

  // Dashboard links in with ?open=<classId> to jump straight to the roster.
  const openId = params.get('open')
  useEffect(() => {
    if (!openId) return
    const found = classes.find((c) => c.id === openId)
    if (found) setViewing(found)
    setParams({}, { replace: true })
  }, [openId, classes, setParams])

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase()
    if (!t) return classes
    return classes.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(t))
  }, [classes, term])

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h3>Classes</h3>
          <p>Manage your class roster and curriculum</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={20} /> Create class
        </button>
      </div>

      <SearchBox value={term} onChange={setTerm} placeholder="Search classes by name or description" />

      <div className="grid3">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Book size={30} />}
            title={term ? 'No classes match that search' : 'No classes yet'}
            body={term ? 'Try a different name or description.' : 'Create a class, then assign students to it.'}
            actionLabel="Create class"
            onAction={() => setEditing('new')}
          />
        ) : (
          visible.map((c) => (
            <ClassCard
              key={c.id}
              klass={c}
              onOpen={() => setViewing(c)}
              onEdit={() => setEditing(c)}
              onDelete={() => setConfirming(c)}
            />
          ))
        )}
      </div>

      {editing && (
        <ClassForm klass={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}

      {viewing && (
        <ClassDetail
          klass={classes.find((c) => c.id === viewing.id) || viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
          onEditStudent={(s) => { setEditingStudent(s); setViewing(null) }}
        />
      )}

      {editingStudent && (
        <StudentForm student={editingStudent} onClose={() => setEditingStudent(null)} />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete class?"
          body={`${confirming.name} will be deleted. Students stay on your roster but lose this class assignment.`}
          confirmLabel="Delete class"
          onConfirm={async () => {
            try { await deleteClass(confirming.id); toast('Class deleted.') }
            catch { toast('Could not delete that class.') }
          }}
          onClose={() => setConfirming(null)}
        />
      )}
    </>
  )
}
