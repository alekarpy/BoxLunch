import type { AsignacionesDeRolDeUsuario } from '../models/asignaciones-de-rol-de-usuario-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class AsignacionesDeRolDeUsuarioService {
  static async create(record: Omit<AsignacionesDeRolDeUsuario, 'id'>): Promise<AsignacionesDeRolDeUsuario> {
    const response = await fetch(`${API_BASE_URL}/AsignacionesRolUsuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear asignación: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<AsignacionesDeRolDeUsuario, 'id'>>): Promise<AsignacionesDeRolDeUsuario> {
    const response = await fetch(`${API_BASE_URL}/AsignacionesRolUsuario/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar asignación: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as AsignacionesDeRolDeUsuario;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/AsignacionesRolUsuario/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar asignación: ${response.statusText}`);
  }

  static async get(id: string): Promise<AsignacionesDeRolDeUsuario> {
    const response = await fetch(`${API_BASE_URL}/AsignacionesRolUsuario/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener asignación: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<AsignacionesDeRolDeUsuario[]> {
    const response = await fetch(`${API_BASE_URL}/AsignacionesRolUsuario`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener asignaciones: ${response.statusText}`);
    return response.json();
  }
}