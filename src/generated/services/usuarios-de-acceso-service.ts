import type { UsuariosDeAcceso } from '../models/usuarios-de-acceso-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class UsuariosDeAccesoService {
  static async create(record: Omit<UsuariosDeAcceso, 'id'>): Promise<UsuariosDeAcceso> {
    const response = await fetch(`${API_BASE_URL}/UsuariosDeAcceso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear usuario de acceso: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<UsuariosDeAcceso, 'id'>>): Promise<UsuariosDeAcceso> {
    const response = await fetch(`${API_BASE_URL}/UsuariosDeAcceso/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar usuario de acceso: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as UsuariosDeAcceso;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/UsuariosDeAcceso/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar usuario de acceso: ${response.statusText}`);
  }

  static async get(id: string): Promise<UsuariosDeAcceso> {
    const response = await fetch(`${API_BASE_URL}/UsuariosDeAcceso/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener usuario de acceso: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<UsuariosDeAcceso[]> {
    const response = await fetch(`${API_BASE_URL}/UsuariosDeAcceso`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener usuarios de acceso: ${response.statusText}`);
    return response.json();
  }
}