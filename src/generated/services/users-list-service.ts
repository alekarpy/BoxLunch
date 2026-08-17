import type { UsersList } from '../models/users-list-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class UsersListService {
  static async create(record: Omit<UsersList, 'id'>): Promise<UsersList> {
    const response = await fetch(`${API_BASE_URL}/UsersList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear usuario: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<UsersList, 'id'>>): Promise<UsersList> {
    const response = await fetch(`${API_BASE_URL}/UsersList/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar usuario: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as UsersList;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/UsersList/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar usuario: ${response.statusText}`);
  }

  static async get(id: string): Promise<UsersList> {
    const response = await fetch(`${API_BASE_URL}/UsersList/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener usuario: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<UsersList[]> {
    const response = await fetch(`${API_BASE_URL}/UsersList`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener usuarios: ${response.statusText}`);
    return response.json();
  }
}