import type { Empleado } from '../models/empleado-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class EmpleadoService {
  static async create(record: Omit<Empleado, 'id'>): Promise<Empleado> {
    const response = await fetch(`${API_BASE_URL}/Empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear empleado: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<Empleado, 'id'>>): Promise<Empleado> {
    const response = await fetch(`${API_BASE_URL}/Empleados/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar empleado: ${response.statusText}`);
    if (response.status === 204) return { id, ...changedFields } as Empleado;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Empleados/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar empleado: ${response.statusText}`);
  }

  static async get(id: string): Promise<Empleado> {
    const response = await fetch(`${API_BASE_URL}/Empleados/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener empleado: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<Empleado[]> {
    const response = await fetch(`${API_BASE_URL}/Empleados`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener empleados: ${response.statusText}`);
    return response.json();
  }
}