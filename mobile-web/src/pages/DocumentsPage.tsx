import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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

export function DocumentsPage() {
  const { t } = useTranslation();
  const typeLabels: Record<DocumentFile['type'], string> = {
    contrat: t('documents.type.contrat'),
    facture: t('documents.type.facture'),
    rapport: t('documents.type.rapport'),
    archive: t('documents.type.archive'),
    autre: t('documents.type.autre'),
  };

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
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteDocument(doc.id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('documents.title')}</h1>
        <button onClick={openCreate}>{t('documents.newDocument')}</button>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('documents.titleField')}</th>
              <th>{t('common.type')}</th>
              <th>{t('documents.uploadedBy')}</th>
              <th>{t('common.date')}</th>
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
                  <button className="secondary" onClick={() => downloadDocument(doc.id, doc.title)}>{t('common.download')}</button>
                  {canUpdate && <button className="secondary" onClick={() => openEdit(doc)}>{t('common.edit')}</button>}
                  {canDelete && <button className="secondary" onClick={() => handleDelete(doc)}>{t('common.delete')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? t('common.edit') : t('documents.newDocumentModalTitle')}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                {t('documents.titleField')}
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                {t('common.type')}
                <select value={type} onChange={(e) => setType(e.target.value as DocumentFile['type'])}>
                  <option value="contrat">{t('documents.type.contrat')}</option>
                  <option value="facture">{t('documents.type.facture')}</option>
                  <option value="rapport">{t('documents.type.rapport')}</option>
                  <option value="archive">{t('documents.type.archive')}</option>
                  <option value="autre">{t('documents.type.autre')}</option>
                </select>
              </label>
              <label>
                {t('documents.file')} {editing && t('documents.fileKeepHint')}
                <input type="file" ref={fileInputRef} required={!editing} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? '...' : t('common.save')}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
