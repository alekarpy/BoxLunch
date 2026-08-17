import type { Notificacin } from '../models/notificacin-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class NotificacinService {
  static async create(record: Omit<Notificacin, 'id'>): Promise<Notificacin> {
    const response = await fetch(`${API_BASE_URL}/Notificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear notificación: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<Notificacin, 'id'>>): Promise<Notificacin> {
    const response = await fetch(`${API_BASE_URL}/Notificaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar notificación: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as Notificacin;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Notificaciones/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar notificación: ${response.statusText}`);
  }

  static async get(id: string): Promise<Notificacin> {
    const response = await fetch(`${API_BASE_URL}/Notificaciones/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener notificación: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<Notificacin[]> {
    const response = await fetch(`${API_BASE_URL}/Notificaciones`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener notificaciones: ${response.statusText}`);
    return response.json();
  }
}