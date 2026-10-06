const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AdminUser = {
  id: number;
  nome: string;
  login: string;
  perfil: "ADMIN" | "ALMOXARIFE" | "SOLICITANTE" | "GESTOR";
  setor_id: number | null;
  ativo: boolean;
};

export type AdminSector = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
};

export class AdminApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AdminApiError";
  }
}

export async function adminRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new AdminApiError(result?.detail ?? "Não foi possível concluir a operação.", response.status);
  }
  return result as T;
}
