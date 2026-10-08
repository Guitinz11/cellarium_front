export type ApiSector = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
};

export type ApiAttendance = {
  id: number;
  usuario_id: number;
  setor_id: number;
  setor: string;
  data_inicio: string;
  data_fim: string | null;
  status: string;
};

export type ApiPendingRequest = {
  requisicao_id: number;
  numero: string;
  setor: string;
  setor_id: number;
  data: string;
  status: string;
  quantidade_itens: number;
};

export type ApiRequestSummary = {
  id: number;
  numero: string;
  setor: { id: number; nome: string };
  usuario_solicitante_id: number;
  solicitante: string;
  usuario_separador_id: number | null;
  separador: string | null;
  status: string;
  data_solicitacao: string;
  data_inicio_separacao: string | null;
  data_conclusao: string | null;
  os_encerrada_at: string | null;
  observacao: string | null;
  quantidade_itens: number;
};

export type ApiRequestItem = {
  id: number;
  material_id: number;
  codigo: string;
  descricao: string;
  unidade: { nome: string; sigla: string };
  quantidade_solicitada: number;
  quantidade_separada: number;
  quantidade_atendida: number;
  quantidade_sobrante: number | null;
  quantidade_pendente: number;
  status: string;
  observacao: string | null;
  estoque_atual: number | null;
};

export type ApiRequestDetail = {
  id: number;
  numero: string;
  setor: { id: number; nome: string };
  usuario_solicitante_id: number;
  solicitante: string;
  usuario_separador_id: number | null;
  separador: string | null;
  status: string;
  data_solicitacao: string;
  data_inicio_separacao: string | null;
  data_conclusao: string | null;
  os_encerrada_at: string | null;
  observacao: string | null;
  itens: ApiRequestItem[];
};

export type ApiMovement = {
  id: number;
  material_id: number;
  data: string;
  usuario: string;
  setor: string | null;
  material: string;
  unidade?: string | null;
  tipo: string;
  quantidade: number;
  estoque_anterior: number;
  estoque_posterior: number;
  observacao?: string | null;
  requisicao_id: number | null;
  setor_id: number | null;
  requisicao_numero?: string | null;
  requisicao_data?: string | null;
  solicitante?: string | null;
  separador?: string | null;
};

export type ApiStockItem = {
  estoque_id: number;
  material_id: number;
  codigo: string;
  material: string;
  categoria_id: number;
  categoria: string;
  unidade_medida_id: number;
  unidade: string;
  unidade_sigla: string;
  localizacao_id: number | null;
  localizacao_codigo: string | null;
  localizacao_descricao: string | null;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  lote: string | null;
  situacao: string;
};

export type ApiSectorStock = {
  id: number;
  setor_id: number;
  material_id: number;
  codigo: string;
  material: string;
  unidade_medida_id: number;
  unidade_sigla: string;
  quantidade_atual: number;
  updated_at: string;
};
export type ApiSectorMovement = {
  id: number;
  material_id: number;
  codigo: string;
  material: string;
  tipo: string;
  quantidade: number;
  saldo_anterior: number;
  saldo_posterior: number;
  observacao: string | null;
  created_at: string;
};
export type ApiMessage = {
  id: number;
  requisicao_id: number;
  usuario_id: number;
  usuario: string;
  texto: string;
  created_at: string;
};
export type ApiNotification = {
  id: number;
  requisicao_id: number | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
};

export type ApiMaterial = {
  id: number;
  codigo: string;
  descricao: string;
  categoria_id: number;
  unidade_medida_id: number;
  especificacao: string | null;
  qr_code: string | null;
  peso_unitario_g: number | null;
  ativo: boolean;
};

export type ApiUser = {
  id: number;
  nome: string;
  login: string;
  perfil: string;
  setor_id: number | null;
  ativo: boolean;
};

export type NormalizedUserRole = "funcionario" | "almoxarife" | "desconhecido";

export function normalizeUserProfile(
  profile?: string | null,
): NormalizedUserRole {
  const candidate = (profile ?? "").trim();
  if (!candidate) return "desconhecido";

  const upper = candidate.toLocaleUpperCase("en-US");
  if (["FUNCIONARIO", "SOLICITANTE", "REQUISITANTE"].includes(upper))
    return "funcionario";
  if (["ALMOXARIFE", "ADMIN", "GESTOR"].includes(upper)) return "almoxarife";
  return "desconhecido";
}

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const accessTokenKey = "cellarium-access-token";
const userKey = "cellarium-api-user";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiUnavailableError extends Error {
  constructor(message = "A API está indisponível.") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

export function getAccessToken() {
  return typeof window === "undefined"
    ? ""
    : (window.localStorage.getItem(accessTokenKey) ?? "");
}

export function storeApiSession(token: string, user: ApiUser) {
  const normalizedProfile = normalizeUserProfile(user.perfil);
  window.localStorage.setItem(accessTokenKey, token);
  window.localStorage.setItem(userKey, JSON.stringify(user));
  window.localStorage.setItem(
    "cellarium-user-role",
    normalizedProfile === "desconhecido"
      ? (user.perfil ?? "").trim().toLocaleLowerCase("pt-BR")
      : normalizedProfile,
  );
  for (const key of [
    "cellarium-submitted-requests",
    "cellarium-inventory-state",
    "marcon-sector-stock-v2",
    "cellarium-demo-attendance",
    "cellarium-demo-mode",
  ]) {
    window.localStorage.removeItem(key);
  }
}

export function getStoredApiUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(userKey) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const user = value as Partial<ApiUser>;
    return typeof user.nome === "string" &&
      typeof user.login === "string" &&
      typeof user.perfil === "string"
      ? (user as ApiUser)
      : null;
  } catch {
    return null;
  }
}

export function clearApiSession() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(userKey);
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "mensagem" in detail) {
      return String((detail as { mensagem: unknown }).mensagem);
    }
  }
  return fallback;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiUnavailableError();
  }
  if (response.status >= 500)
    throw new ApiUnavailableError(
      `A API respondeu com erro ${response.status}.`,
    );
  const payload: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (
    response.status === 401 &&
    path !== "/auth/login" &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(new Event("cellarium-session-invalid"));
  }
  if (!response.ok)
    throw new ApiError(
      errorMessage(payload, `Falha na solicitação (${response.status}).`),
      response.status,
    );
  return payload as T;
}

export async function login(login: string, senha: string) {
  return apiRequest<{
    access_token: string;
    token_type: string;
    usuario: ApiUser;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, senha }),
  });
}

export async function listSectors() {
  return apiRequest<ApiSector[]>("/setores?apenas_ativos=true&limit=200");
}

export async function getCurrentUser() {
  return apiRequest<
    ApiUser & { setor: string | null; atendimento_atual: ApiAttendance | null }
  >("/auth/me");
}

export async function listStock(
  params: { page?: number; limit?: number; busca?: string } = {},
) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
  });
  if (params.busca) query.set("busca", params.busca);
  return apiRequest<{
    dados: ApiStockItem[];
    total: number;
    page: number;
    limit: number;
  }>(`/estoque?${query}`);
}

export async function listMaterials(
  params: { page?: number; limit?: number; busca?: string } = {},
) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
    ativo: "true",
  });
  if (params.busca) query.set("busca", params.busca);
  return apiRequest<ApiMaterial[]>(`/materiais?${query}`);
}

export async function createRequest(payload: {
  observacao?: string;
  itens: Array<{ material_id: number; quantidade_solicitada: number }>;
}) {
  return apiRequest<ApiRequestDetail>("/requisicoes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listMyRequests(params: { status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
  });
  if (params.status) query.set("status", params.status);
  return apiRequest<{
    dados: ApiRequestSummary[];
    total: number;
    page: number;
    limit: number;
  }>(`/requisicoes?${query}`);
}

export async function listAllMyRequests(params: { status?: string } = {}) {
  const firstPage = await listMyRequests({ ...params, page: 1, limit: 100 });
  const dados = [...firstPage.dados];
  for (let page = 2; dados.length < firstPage.total; page += 1) {
    const nextPage = await listMyRequests({ ...params, page, limit: 100 });
    dados.push(...nextPage.dados);
    if (nextPage.dados.length === 0) break;
  }
  return { ...firstPage, dados };
}

export async function closeServiceOrder(
  requisitionId: number,
  itens: Array<{ item_id: number; quantidade_sobrante: number }>,
) {
  return apiRequest<ApiRequestDetail>(
    `/requisicoes/${requisitionId}/encerrar-os`,
    {
      method: "PATCH",
      body: JSON.stringify({ itens }),
    },
  );
}

export async function listSectorStock(sectorId?: number) {
  return apiRequest<ApiSectorStock[]>(
    `/estoque-setor${sectorId ? `?setor_id=${sectorId}` : ""}`,
  );
}
export async function listSectorStockHistory(sectorId?: number) {
  return apiRequest<ApiSectorMovement[]>(
    `/estoque-setor/historico${sectorId ? `?setor_id=${sectorId}` : ""}`,
  );
}
export async function consumeSectorStock(
  payload: { material_id: number; quantidade: number; observacao?: string },
  key: string,
) {
  return apiRequest<{ material_id: number; quantidade_atual: number }>(
    "/estoque-setor/consumos",
    {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(payload),
    },
  );
}
export async function listNotifications() {
  return apiRequest<ApiNotification[]>("/notificacoes");
}
export async function markNotificationRead(id: number) {
  return apiRequest<{ id: number; lida: boolean }>(`/notificacoes/${id}/lida`, {
    method: "PATCH",
  });
}
export async function markAllNotificationsRead() {
  return apiRequest<{ atualizadas: number }>("/notificacoes/lidas", {
    method: "PATCH",
  });
}
export async function deleteNotification(id: number) {
  return apiRequest<{ id: number; apagada: boolean }>(`/notificacoes/${id}`, {
    method: "DELETE",
  });
}
export async function deleteAllNotifications() {
  return apiRequest<{ apagadas: number }>("/notificacoes", {
    method: "DELETE",
  });
}
export async function listRequestMessages(id: number) {
  return apiRequest<ApiMessage[]>(`/requisicoes/${id}/mensagens`);
}
export async function sendRequestMessage(id: number, texto: string) {
  return apiRequest<ApiMessage>(`/requisicoes/${id}/mensagens`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  });
}

export async function getActiveAttendance() {
  try {
    return await apiRequest<ApiAttendance>("/atendimentos/ativo");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function startAttendance(setor_id: number) {
  return apiRequest<ApiAttendance>("/atendimentos/iniciar", {
    method: "POST",
    body: JSON.stringify({ setor_id }),
  });
}

export async function switchAttendance(setor_id: number) {
  return apiRequest<ApiAttendance>("/atendimentos/trocar", {
    method: "POST",
    body: JSON.stringify({ setor_id }),
  });
}

export async function listPendingRequests(options: { todos?: boolean } = {}) {
  type PendingResult = {
    dados: ApiPendingRequest[];
    total: number;
    page: number;
    limit: number;
  };
  const query = new URLSearchParams({ limit: "100" });
  if (options.todos) query.set("todos", "true");
  const firstPage = await apiRequest<PendingResult>(`/requisicoes/pendentes?${query}&page=1`);
  if (!options.todos || firstPage.dados.length >= firstPage.total) return firstPage;

  const dados = [...firstPage.dados];
  for (let page = 2; dados.length < firstPage.total; page += 1) {
    query.set("page", String(page));
    const result = await apiRequest<PendingResult>(`/requisicoes/pendentes?${query}`);
    dados.push(...result.dados);
    if (result.dados.length === 0) break;
  }
  return { ...firstPage, dados };
}

export async function resolveRequestId(identifier: string) {
  const normalized = identifier.trim();
  if (/^\d+$/.test(normalized)) return Number(normalized);
  const result = await apiRequest<{
    dados: Array<{ id: number; numero: string }>;
  }>(`/requisicoes?numero=${encodeURIComponent(normalized)}&limit=10`);
  return (
    result.dados.find(
      (item) =>
        item.numero.toLocaleLowerCase("pt-BR") ===
        normalized.toLocaleLowerCase("pt-BR"),
    )?.id ?? null
  );
}

export async function getRequestDetail(identifier: string) {
  const id = await resolveRequestId(identifier);
  if (id === null) throw new ApiError("Requisição não encontrada.", 404);
  return apiRequest<ApiRequestDetail>(`/requisicoes/${id}`);
}

export async function startRequestSeparation(id: number) {
  return apiRequest<ApiRequestDetail>(`/requisicoes/${id}/iniciar-separacao`, {
    method: "PATCH",
  });
}

export async function separateRequest(id: number, idempotencyKey: string) {
  return apiRequest<{
    requisicao_id: number;
    status: string;
    itens: Array<{
      id: number;
      material_id: number;
      quantidade_separada: number;
      status: string;
    }>;
  }>(`/requisicoes/${id}/separar`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function separateRequestItem(
  requisitionId: number,
  itemId: number,
  idempotencyKey: string,
) {
  return apiRequest<{
    item: {
      id: number;
      material_id: number;
      quantidade_solicitada: number;
      quantidade_separada: number;
      quantidade_atendida: number;
      status: string;
    };
    estoque_atual: number;
    status_requisicao: string;
  }>(`/requisicoes/${requisitionId}/itens/${itemId}/separar`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function concludeRequest(id: number) {
  return apiRequest<ApiRequestDetail>(`/requisicoes/${id}/concluir`, {
    method: "PATCH",
    body: JSON.stringify({ permitir_parcial: false }),
  });
}

export async function listMovements(params: { page?: number; limit?: number } = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
  });
  return apiRequest<{
    dados: ApiMovement[];
    total: number;
    page: number;
    limit: number;
  }>(`/movimentacoes?${query}`);
}

export async function listAllMovements() {
  const firstPage = await listMovements({ page: 1, limit: 100 });
  const dados = [...firstPage.dados];
  for (let page = 2; dados.length < firstPage.total; page += 1) {
    const nextPage = await listMovements({ page, limit: 100 });
    dados.push(...nextPage.dados);
    if (nextPage.dados.length === 0) break;
  }
  return { ...firstPage, dados };
}
