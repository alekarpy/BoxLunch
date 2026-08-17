import type { Pedido } from '../models/pedido-model';
import type { IOperationOptions } from '../models/common-models';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class PedidoService {
  static async create(record: Omit<Pedido, 'id'>): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/Pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Error al crear pedido: ${response.statusText}`);
    return response.json();
  }

  static async update(id: string, changedFields: Partial<Omit<Pedido, 'id'>>): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/Pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(changedFields),
    });
    if (!response.ok) throw new Error(`Error al actualizar pedido: ${response.statusText}`);
    // PATCH devuelve 204 No Content
    if (response.status === 204) return { id, ...changedFields } as Pedido;
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Pedidos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Error al eliminar pedido: ${response.statusText}`);
  }

  static async get(id: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/Pedidos/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener pedido: ${response.statusText}`);
    return response.json();
  }

  static async getAll(_options?: IOperationOptions): Promise<Pedido[]> {
    const response = await fetch(`${API_BASE_URL}/Pedidos`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Error al obtener pedidos: ${response.statusText}`);
    return response.json();
  }
}