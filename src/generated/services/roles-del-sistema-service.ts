import type { RolesDelSistema } from '../models/roles-del-sistema-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class RolesDelSistemaService {
  static async create(record: Omit<RolesDelSistema, 'id'>): Promise<RolesDelSistema> {
    const response = await fetch(`${API_BASE_URL}/RolesDelSistema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear rol: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<RolesDelSistema, 'id'>>): Promise<RolesDelSistema> {
    const response = await fetch(`${API_BASE_URL}/RolesDelSistema/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar rol: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as RolesDelSistema;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/RolesDelSistema/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar rol: ${response.statusText}`);
  }

  static async get(id: string): Promise<RolesDelSistema> {
    const response = await fetch(`${API_BASE_URL}/RolesDelSistema/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener rol: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<RolesDelSistema[]> {
    const response = await fetch(`${API_BASE_URL}/RolesDelSistema`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener roles: ${response.statusText}`);
    return response.json();
  }
}