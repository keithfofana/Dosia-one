import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import {
  createDocument,
  deleteDocument,
  downloadDocument,
  listDocuments,
  updateDocument,
} from '../api/documents';
import type { DocumentFile } from '../types/models';

const typeLabels: Record<DocumentFile['type'], string> = {
  contrat: 'Contrat',
  facture: 'Facture',
  rapport: 'Rapport',
  archive: 'Archive',
  autre: 'Autre',
};

export function DocumentsPage() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'documents.update');
  const canDelete = hasPermission(user, 'documents.delete');

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentFile | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentFile['type']>('autre');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listDocuments().then((res) => setDocuments(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setType('autre');
    setShowForm(true);
  };

  const openEdit = (doc: DocumentFile) => {
    setEditing(doc);
    setTitle(doc.title);
    setType(doc.type);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (editing) {
        await updateDocument(editing.id, title, type, file);
      } else {
        if (!file) return;
        await createDocument(title, type, file);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: DocumentFile) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.')) return;
    await deleteDocument(doc.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Documents</h1>
        <button onClick={openCreate}>+ Nouveau document</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Type</th>
              <th>Ajouté par</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td><span className="badge">{typeLabels[doc.type]}</span></td>
                <td>{doc.uploaded_by?.name ?? '—'}</td>
                <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="secondary" onClick={() => downloadDocument(doc.id, doc.title)}>Télécharger</button>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(doc)}>Modifier</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(doc)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Modifier le document' : 'Nouveau document'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Titre
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value as DocumentFile['type'])}>
                  <option value="contrat">Contrat</option>
                  <option value="facture">Facture</option>
                  <option value="rapport">Rapport</option>
                  <option value="archive">Archive</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <label>
                Fichier {editing && '(laisser vide pour conserver le fichier actuel)'}
                <input type="file" ref={fileInputRef} required={!editing} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
