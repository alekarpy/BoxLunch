import type { MicrosoftEntraID } from '../models/microsoft-entra-id-model';

// URL base del API en C#
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Mapea el DTO del backend C# al modelo MicrosoftEntraID del frontend.
 */
function mapBackendDtoToModel(dto: any): MicrosoftEntraID {
  return {
    id: dto.id,
    nombreparamostrar: dto.nombreCompleto,
    correo: dto.email,
    nombreprincipaldeusuario: dto.email,
    puesto: dto.puesto,
    unidentificadornicoparamicrosoftentraid: dto.id,
    // Campos opcionales que el formulario podría buscar
    nombredepila: dto.nombreCompleto.split(' ')[0],
    apellido: dto.nombreCompleto.split(' ').slice(1).join(' '),
  };
}

const employeeGenders = [
  "M", "M", "M", "M", "F", "M", "M", "F", "F", "M", // 1-10
  "F", "M", "F", "M", "M", "F", "F", "M", "M", "F", // 11-20
  "M", "F", "M", "M", "F", "M", "M", "M", "M", "F", // 21-30
  "M", "M", "F", "M", "F", "M", "M", "F", "M", "F", // 31-40
  "F", "F", "M", "M", "M", "F", "M", "M", "M", "M", // 41-50
  "F", "M", "F", "F", "F", "M", "F", "M", "M", "F", // 51-60
  "F", "F", "M", "M", "M", "F", "F", "F", "F", "M", // 61-70
  "F", "M", "M", "F", "M", "M", "M", "M", "M", "M", // 71-80
  "M", "F", "M", "F", "M", "F", "M", "F", "F", "M", // 81-90
  "F", "M", "M", "M", "F", "M", "M", "M", "M", "F"  // 91-100
];

export class MicrosoftEntraIDService {
  static async getAll(_options?: any): Promise<MicrosoftEntraID[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Graph/empleados`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Error al obtener usuarios: ${response.statusText}`);
      }
      const data = await response.json();
      return (data as any[]).map(mapBackendDtoToModel);
    } catch (error) {
      console.error('[MicrosoftEntraIDService] Error:', error);
      throw error;
    }
  }

  static getPhotoUrl(entraObjectId: string | undefined): string | undefined {
    if (!entraObjectId) return undefined;
    
    // Mapeo especial para cuentas demo fijas
    if (entraObjectId === 'demo-admin') return 'https://randomuser.me/api/portraits/men/95.jpg';
    if (entraObjectId === 'demo-operativo') return 'https://randomuser.me/api/portraits/men/96.jpg';
    if (entraObjectId === 'demo-desarrollador') return 'https://randomuser.me/api/portraits/women/95.jpg';

    if (entraObjectId.startsWith('EMP-')) {
      const num = parseInt(entraObjectId.substring(4), 10);
      if (!isNaN(num) && num >= 1 && num <= 100) {
        // Dejar exactamente 4 sin fotografía (ej. 13, 37, 77, 91)
        if (num === 13 || num === 37 || num === 77 || num === 91) {
          return undefined;
        }

        const targetGender = employeeGenders[num - 1];
        let sameGenderCount = 0;
        for (let i = 0; i < num; i++) {
          if (employeeGenders[i] === targetGender) {
            sameGenderCount++;
          }
        }

        const folder = targetGender === 'F' ? 'women' : 'men';
        return `https://randomuser.me/api/portraits/${folder}/${sameGenderCount}.jpg`;
      }
    }
    
    return undefined;
  }

  /**
   * Obtiene un usuario de Entra ID por su Object ID.
   */
  static async get(id: string): Promise<MicrosoftEntraID> {
    const all = await MicrosoftEntraIDService.getAll();
    const found = all.find(u => u.id === id || u.unidentificadornicoparamicrosoftentraid === id);
    if (!found) throw new Error(`Usuario con ID ${id} no encontrado`);
    return found;
  }

  // Los métodos create/update/delete no son soportados por Graph API en este contexto
  static async create(_data: any): Promise<any> { throw new Error('Operación no soportada'); }
  static async update(_id: string, _changedFields: any): Promise<any> { throw new Error('Operación no soportada'); }
  static async delete(_id: string): Promise<any> { throw new Error('Operación no soportada'); }
}