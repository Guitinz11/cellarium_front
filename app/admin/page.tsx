"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Building2, Check, LogOut, Pencil, Plus, ShieldCheck, Trash2, UserRound, UserX, X } from "lucide-react";
import { AdminApiError, adminRequest, type AdminSector, type AdminUser } from "@/lib/admin-api";
import ThemeToggle from "@/components/theme-toggle";
import BrandLogo from "@/components/brand-logo";
import { Button, Card, Metric, PageHeading } from "@/components/ui";

type AdminProfile = "ADMIN" | "ALMOXARIFE" | "SOLICITANTE" | "GESTOR";

export default function AdminPage() {
  const router = useRouter();
  const tokenRef = useRef("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sectors, setSectors] = useState<AdminSector[]>([]);
  const [tab, setTab] = useState<"users" | "sectors">("users");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<AdminProfile>("SOLICITANTE");
  const [sectorId, setSectorId] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [sectorCode, setSectorCode] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const loadData = useCallback(async (authToken: string) => {
    const me = await adminRequest<{ perfil: string }>("/auth/me", authToken);
    if (me.perfil !== "ADMIN") {
      window.sessionStorage.removeItem("cellarium-admin-token");
      router.replace("/acesso-negado");
      return;
    }
    const [userRows, sectorRows] = await Promise.all([
      adminRequest<AdminUser[]>("/usuarios?apenas_ativos=false&page=1&limit=100", authToken),
      adminRequest<AdminSector[]>("/setores?apenas_ativos=false&page=1&limit=200", authToken),
    ]);
    setUsers(userRows);
    setSectors(sectorRows);
  }, [router]);

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem("cellarium-admin-token");
    if (!storedToken) {
      router.replace("/acesso-negado");
      return;
    }
    tokenRef.current = storedToken;
    // This asynchronously loads data from the API; state updates happen after the network responses resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData(storedToken).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o painel.");
      if (cause instanceof AdminApiError && (cause.status === 401 || cause.status === 403)) {
        window.sessionStorage.removeItem("cellarium-admin-token");
        window.sessionStorage.removeItem("cellarium-admin-user");
        router.replace("/acesso-negado");
      }
    });
  }, [loadData, router]);

  const activeCount = useMemo(() => users.filter((user) => user.ativo).length, [users]);
  const profileCounts = useMemo(() => ({
    admins: users.filter((user) => user.ativo && user.perfil === "ADMIN").length,
    operators: users.filter((user) => user.ativo && user.perfil === "ALMOXARIFE").length,
    requesters: users.filter((user) => user.ativo && user.perfil === "SOLICITANTE").length,
  }), [users]);

  function startEditingUser(user: AdminUser) {
    setEditingUser(user);
    setName(user.nome);
    setLogin(user.login);
    setProfile(user.perfil);
    setSectorId(user.setor_id ? String(user.setor_id) : "");
    setPassword("");
    setError("");
    setNotice("");
  }

  function cancelEditingUser() {
    setEditingUser(null);
    setName(""); setLogin(""); setPassword(""); setSectorId("");
    setProfile("SOLICITANTE");
    setError(""); setNotice("");
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const body = { nome: name, login, senha: password || undefined, perfil: profile, setor_id: profile === "SOLICITANTE" && sectorId ? Number(sectorId) : null };
      if (editingUser) {
        await adminRequest<AdminUser>(`/usuarios/${editingUser.id}`, tokenRef.current, { method: "PUT", body: JSON.stringify(body) });
        setNotice(`Dados de ${name} atualizados.`);
      } else {
        await adminRequest<AdminUser>("/usuarios", tokenRef.current, { method: "POST", body: JSON.stringify({ ...body, senha: password }) });
        setNotice("Usuário criado e salvo no banco de dados.");
      }
      setEditingUser(null);
      setName(""); setLogin(""); setPassword(""); setSectorId(""); setProfile("SOLICITANTE");
      await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o usuário.");
    } finally { setBusy(false); }
  }

  async function deactivateUser(user: AdminUser) {
    if (!window.confirm(`Desativar o acesso de ${user.nome}? O histórico será preservado.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest<AdminUser>(`/usuarios/${user.id}`, tokenRef.current, { method: "PUT", body: JSON.stringify({ ativo: false }) });
      setNotice(`Acesso de ${user.nome} desativado.`);
      await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível desativar a conta.");
    } finally { setBusy(false); }
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Desativar o acesso de ${user.nome} (${user.login})? O histórico será preservado.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await adminRequest<{ message: string }>(`/usuarios/${user.id}`, tokenRef.current, { method: "DELETE" });
      setNotice(result.message || `Acesso de ${user.nome} desativado; histórico preservado.`);
      if (editingUser?.id === user.id) cancelEditingUser();
      await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir a conta.");
    } finally { setBusy(false); }
  }

  async function reactivateUser(user: AdminUser) {
    setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest<AdminUser>(`/usuarios/${user.id}`, tokenRef.current, { method: "PUT", body: JSON.stringify({ ativo: true }) });
      setNotice(`Acesso de ${user.nome} reativado.`);
      await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível reativar a conta.");
    } finally { setBusy(false); }
  }

  async function createSector(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest<AdminSector>("/setores", tokenRef.current, { method: "POST", body: JSON.stringify({ nome: sectorName, codigo: sectorCode }) });
      setSectorName(""); setSectorCode(""); setNotice("Setor cadastrado no banco de dados."); await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o setor.");
    } finally { setBusy(false); }
  }

  async function toggleSector(sector: AdminSector) {
    setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest<AdminSector>(`/setores/${sector.id}`, tokenRef.current, { method: "PUT", body: JSON.stringify({ ativo: !sector.ativo }) });
      setNotice(`Setor ${sector.ativo ? "desativado" : "reativado"}.`); await loadData(tokenRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o setor.");
    } finally { setBusy(false); }
  }

  function logout() {
    window.sessionStorage.removeItem("cellarium-admin-token");
    window.sessionStorage.removeItem("cellarium-admin-user");
    router.replace("/login");
  }

  return <div className="warehouse-app admin-app">
    <a href="#admin-main" className="skip-link">Pular para o conteúdo</a>
    <header className="shell-topbar admin-topbar">
      <div className="flex min-w-0 items-center gap-4"><a href="/admin" aria-label="Marcon, painel administrativo"><BrandLogo className="w-[112px] sm:w-[132px]" priority/></a><span className="h-6 w-px bg-slate-300" aria-hidden="true"/><div className="shell-breadcrumb"><ShieldCheck size={17} aria-hidden="true"/><strong>Administração</strong></div></div>
      <div className="flex items-center gap-2"><ThemeToggle/><button onClick={logout} className="shell-icon-button" aria-label="Sair" title="Sair"><LogOut size={18}/></button></div>
    </header>
    <main id="admin-main" tabIndex={-1} className="warehouse-content">
      <PageHeading eyebrow="Acesso restrito" title="Administração" description="Gerencie contas e setores. As alterações são validadas pela API e salvas no banco de dados." action={<span className="ui-badge ui-badge--success"><span aria-hidden="true"/>ADMIN autenticado</span>}/>
      <section className="metrics-strip" aria-label="Resumo do sistema">
        <Metric label="Contas ativas" value={activeCount} note="Acessos habilitados" icon={<UserRound/>}/>
        <Metric label="Almoxarifes" value={profileCounts.operators} note="No perfil operacional" icon={<Boxes/>}/>
        <Metric label="Setores ativos" value={sectors.filter((sector) => sector.ativo).length} note="Disponíveis para operação" icon={<Building2/>}/>
      </section>
      <nav className="admin-tabs" aria-label="Seções administrativas">
        <button type="button" onClick={() => setTab("users")} className={`admin-tab ${tab === "users" ? "is-active" : ""}`}>Usuários <span>{activeCount}</span></button>
        <button type="button" onClick={() => setTab("sectors")} className={`admin-tab ${tab === "sectors" ? "is-active" : ""}`}>Setores <span>{sectors.length}</span></button>
      </nav>
      {(error || notice) && <div role={error ? "alert" : "status"} className={`mb-5 rounded-lg px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</div>}
      {tab === "users" ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="admin-panel">
          <div className="admin-panel-head"><div><h2>Contas do sistema</h2><p>{profileCounts.admins} administradores · {profileCounts.requesters} solicitantes ativos</p></div></div>
          <div className="overflow-x-auto"><table className="admin-table responsive-table w-full min-w-[650px] text-left text-sm"><thead><tr><th className="px-5 py-3">Pessoa</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td data-label="Pessoa" className="px-5 py-3.5 font-medium">{user.nome}</td><td data-label="Login" className="px-4 py-3.5">{user.login}</td><td data-label="Perfil" className="px-4 py-3.5"><span className="admin-tag">{user.perfil}</span></td><td data-label="Estado" className="px-4 py-3.5"><span className={user.ativo ? "admin-active" : "admin-muted"}>{user.ativo ? "Ativo" : "Desativado"}</span></td><td data-label="Ações" className="px-5 py-3.5 text-right"><div className="flex justify-end gap-1"><button type="button" disabled={busy} onClick={() => startEditingUser(user)} aria-label={`Editar ${user.nome}`} title="Editar usuário" className="shell-icon-button"><Pencil size={16}/></button>{user.ativo ? <button type="button" disabled={busy} onClick={() => void deactivateUser(user)} aria-label={`Desativar ${user.nome}`} title="Desativar usuário" className="shell-icon-button admin-delete-button"><UserX size={16}/></button> : <button type="button" disabled={busy} onClick={() => void reactivateUser(user)} className="admin-reactivate">Reativar</button>}<button type="button" disabled={busy} onClick={() => void deleteUser(user)} aria-label={`Desativar acesso de ${user.nome}`} title="Desativar acesso e preservar histórico" className="shell-icon-button admin-permanent-delete-button"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
          {users.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Nenhuma conta encontrada.</p>}
        </Card>
        <Card className="admin-panel admin-form-panel">
          <div className="admin-panel-head"><div className="flex items-center gap-2">{editingUser ? <Pencil size={17}/> : <Plus size={17}/>}<h2>{editingUser ? "Editar usuário" : "Criar usuário"}</h2></div>{editingUser && <button type="button" className="shell-icon-button" onClick={cancelEditingUser} aria-label="Cancelar edição"><X size={17}/></button>}</div>
          <form onSubmit={saveUser} className="admin-form">
            <label>Nome completo<input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)}/></label>
            <label>Login<input required maxLength={50} value={login} onChange={(event) => setLogin(event.target.value)}/></label>
            <label>{editingUser ? "Nova senha (opcional)" : "Senha inicial"}<input required={!editingUser} minLength={password || !editingUser ? 6 : undefined} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password"/><span>Mínimo de 6 caracteres{editingUser ? "; deixe em branco para manter a atual" : ""}.</span></label>
            <label>Perfil<select value={profile} onChange={(event) => setProfile(event.target.value as AdminProfile)}><option value="SOLICITANTE">Solicitante</option><option value="ALMOXARIFE">Almoxarife</option><option value="GESTOR">Gestor</option><option value="ADMIN">Administrador</option></select></label>
            {profile === "SOLICITANTE" && <label>Setor<select required value={sectorId} onChange={(event) => setSectorId(event.target.value)}><option value="">Selecione</option>{sectors.filter((sector) => sector.ativo).map((sector) => <option key={sector.id} value={sector.id}>{sector.nome}</option>)}</select></label>}
            <div className="admin-form-actions"><Button type="submit" loading={busy}><Check size={15}/>{editingUser ? "Salvar alterações" : "Criar conta"}</Button>{editingUser && <Button type="button" variant="secondary" onClick={cancelEditingUser}>Cancelar</Button>}</div>
          </form>
        </Card>
      </div> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="admin-panel"><div className="admin-panel-head"><div><h2>Setores</h2><p>Cadastros usados nas requisições e nas contas solicitantes.</p></div></div><div className="admin-sector-list">{sectors.map((sector) => <div key={sector.id} className="admin-sector-row"><div><p>{sector.nome}</p><span>Código {sector.codigo} · {sector.ativo ? "Ativo" : "Desativado"}</span></div><Button variant="secondary" disabled={busy} onClick={() => void toggleSector(sector)}>{sector.ativo ? "Desativar" : "Reativar"}</Button></div>)}</div></Card>
        <Card className="admin-panel admin-form-panel"><div className="admin-panel-head"><div className="flex items-center gap-2"><Plus size={17}/><h2>Adicionar setor</h2></div></div><form onSubmit={createSector} className="admin-form"><label>Nome<input required maxLength={100} value={sectorName} onChange={(event) => setSectorName(event.target.value)}/></label><label>Código<input required maxLength={20} value={sectorCode} onChange={(event) => setSectorCode(event.target.value)}/></label><Button type="submit" loading={busy}><Plus size={15}/>Cadastrar setor</Button></form></Card>
      </div>}
      <p className="mt-6 text-xs text-slate-500">A desativação de usuários preserva registros históricos e movimentações no banco.</p>
    </main>
    <footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> Gestão de materiais</span><span>Painel administrativo</span></footer>
  </div>;
}
