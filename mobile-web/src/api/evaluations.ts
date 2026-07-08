import { apiClient } from './client';
import type { Evaluation, PaginatedResponse } from '../types/models';

export interface EvaluationInput {
  employee_id: number;
  evaluation_date: string;
  score?: number;
  notes?: string;
}

export async function listEvaluations(): Promise<PaginatedResponse<Evaluation>> {
  const { data } = await apiClient.get<PaginatedResponse<Evaluation>>('/evaluations');
  return data;
}

export async function createEvaluation(payload: EvaluationInput): Promise<Evaluation> {
  const { data } = await apiClient.post<Evaluation>('/evaluations', payload);
  return data;
}

export async function updateEvaluation(id: number, payload: EvaluationInput): Promise<Evaluation> {
  const { data } = await apiClient.put<Evaluation>(`/evaluations/${id}`, payload);
  return data;
}

export async function deleteEvaluation(id: number): Promise<void> {
  await apiClient.delete(`/evaluations/${id}`);
}
