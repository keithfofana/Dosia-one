import { apiClient } from './client';
import type { DocumentFile, PaginatedResponse } from '../types/models';

export async function listDocuments(): Promise<PaginatedResponse<DocumentFile>> {
  const { data } = await apiClient.get<PaginatedResponse<DocumentFile>>('/documents');
  return data;
}

export async function createDocument(title: string, type: DocumentFile['type'], file: File): Promise<DocumentFile> {
  const form = new FormData();
  form.append('title', title);
  form.append('type', type);
  form.append('file', file);
  const { data } = await apiClient.post<DocumentFile>('/documents', form);
  return data;
}

export async function updateDocument(
  id: number,
  title: string,
  type: DocumentFile['type'],
  file?: File
): Promise<DocumentFile> {
  const form = new FormData();
  form.append('title', title);
  form.append('type', type);
  if (file) form.append('file', file);
  // Laravel ne parse pas multipart/form-data sur une vraie requete PUT ;
  // on POST avec _method=PUT (method spoofing), pattern standard Laravel.
  form.append('_method', 'PUT');
  const { data } = await apiClient.post<DocumentFile>(`/documents/${id}`, form);
  return data;
}

export async function deleteDocument(id: number): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

export async function downloadDocument(id: number, title: string): Promise<void> {
  // Le telechargement exige le token Bearer (route protegee) : un simple lien
  // <a href> n'enverrait pas l'en-tete Authorization, d'ou un fetch en blob.
  const { data } = await apiClient.get(`/documents/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = title;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
