<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    AppWindow,
    ArrowLeft,
    Globe,
    Lock,
    Plus,
    Trash2,
    Shield,
    Key,
    ShieldCheck,
    Calendar,
    ExternalLink,
    LogOut
  } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const tabs = ['Settings', 'Redirect URIs', 'Post-Logout URIs', 'Roles'] as const;
  let activeTab = $state<typeof tabs[number]>('Settings');

  /* ── Dialogs ────────────────────────────────────────────── */
  let showAddRedirect = $state(false);
  let addingRedirect = $state(false);
  let showAddPostLogout = $state(false);
  let addingPostLogout = $state(false);
  let showCreateRole = $state(false);
  let creatingRole = $state(false);
  let showDeleteUri = $state(false);
  let deletingUri = $state(false);
  let deleteUriId = $state('');
  let deleteUriAction = $state('');
  let saving = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') {
        showToast(f.message, 'success');
        showAddRedirect = false;
        showAddPostLogout = false;
        showCreateRole = false;
        showDeleteUri = false;
      } else if (typeof f.error === 'string') {
        showToast(f.error, 'error');
      }
      addingRedirect = false;
      addingPostLogout = false;
      creatingRole = false;
      deletingUri = false;
      saving = false;
    }
  });

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  }

  const realm = $derived(page.params.realm);
</script>

<div class="client-detail">
  <a href="/realms/{realm}/clients" class="client-detail__back" use:ripple>
    <ArrowLeft size={16} /> Back to clients
  </a>

  <!-- ── Hero ──────────────────────────────────────────────── -->
  <section class="client-detail__hero glass-panel">
    <div class="client-detail__avatar">
      <AppWindow size={32} />
    </div>
    <div>
      <h2>{data.client.name}</h2>
      <span>{data.client.client_id} · {data.client.protocol}</span>
      <div class="client-detail__badges">
        <span class="badge" class:badge--success={data.client.enabled} class:badge--muted={!data.client.enabled}>
          {data.client.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <span class="badge badge--primary">
          {data.client.public_client ? 'Public' : 'Confidential'}
        </span>
        {#if data.client.service_account_enabled}
          <span class="badge badge--success">Service Account</span>
        {/if}
      </div>
    </div>
  </section>

  <!-- ── Tabs ──────────────────────────────────────────────── -->
  <nav class="client-detail__tabs">
    {#each tabs as tab (tab)}
      <button type="button" class="client-detail__tab" class:client-detail__tab--active={activeTab === tab}
        onclick={() => (activeTab = tab)} use:ripple>{tab}</button>
    {/each}
  </nav>

  <!-- ── Settings ──────────────────────────────────────────── -->
  {#if activeTab === 'Settings'}
    <SectionCard eyebrow="Configuration" title="Client settings" compact={true}>
      <form method="POST" action="?/update-client" class="form-grid" use:enhance={() => { saving = true; return async ({ update }) => { await update(); }; }}>
        <label><span>Name</span><input type="text" name="name" value={data.client.name} /></label>
        <label><span>Client ID</span><input type="text" name="client_id_val" value={data.client.client_id} /></label>
        <label class="form-grid__checkbox">
          <input type="checkbox" name="enabled" checked={data.client.enabled} />
          <span>Enabled</span>
        </label>
        <label class="form-grid__checkbox">
          <input type="checkbox" name="direct_access_grants_enabled" checked={data.client.direct_access_grants_enabled} />
          <span>Direct access grants</span>
        </label>
        <button type="submit" class="form-grid__submit" use:ripple disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </SectionCard>

    <section class="client-detail__info-grid">
      <div class="info-card"><Calendar size={16} /><div><span>Created</span><strong>{formatDate(data.client.created_at)}</strong></div></div>
      <div class="info-card"><Calendar size={16} /><div><span>Updated</span><strong>{formatDate(data.client.updated_at)}</strong></div></div>
      <div class="info-card"><Globe size={16} /><div><span>Redirects</span><strong>{data.redirects.length}</strong></div></div>
      <div class="info-card"><Shield size={16} /><div><span>Roles</span><strong>{data.roles.length}</strong></div></div>
    </section>

    {#if data.client.client_secret}
      <SectionCard eyebrow="Credentials" title="Client secret" compact={true}>
        <div class="secret-box">
          <code>{data.client.client_secret}</code>
        </div>
      </SectionCard>
    {/if}
  {/if}

  <!-- ── Redirect URIs ─────────────────────────────────────── -->
  {#if activeTab === 'Redirect URIs'}
    <SectionCard eyebrow="OAuth" title="Redirect URIs" description="Allowed redirect URIs after authentication.">
      {#snippet actions()}
        <button type="button" class="cta-btn" use:ripple onclick={() => (showAddRedirect = true)}>
          <Plus size={16} /> Add URI
        </button>
      {/snippet}

      <div class="item-list">
        {#if data.redirects.length > 0}
          {#each data.redirects as uri (uri.id)}
            <div class="item-row">
              <div class="item-row__icon"><ExternalLink size={18} /></div>
              <div class="item-row__info">
                <strong>{uri.value}</strong>
                <small>{uri.enabled ? 'Enabled' : 'Disabled'}</small>
              </div>
              <button type="button" class="item-row__delete" use:ripple
                onclick={() => { deleteUriId = uri.id; deleteUriAction = '?/delete-redirect'; showDeleteUri = true; }}>
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No redirect URIs configured.</strong></div>
        {/if}
      </div>
    </SectionCard>
  {/if}

  <!-- ── Post-Logout URIs ──────────────────────────────────── -->
  {#if activeTab === 'Post-Logout URIs'}
    <SectionCard eyebrow="OAuth" title="Post-logout redirect URIs" description="Allowed URIs to redirect to after logout.">
      {#snippet actions()}
        <button type="button" class="cta-btn" use:ripple onclick={() => (showAddPostLogout = true)}>
          <Plus size={16} /> Add URI
        </button>
      {/snippet}

      <div class="item-list">
        {#if data.postLogoutRedirects.length > 0}
          {#each data.postLogoutRedirects as uri (uri.id)}
            <div class="item-row">
              <div class="item-row__icon item-row__icon--warn"><LogOut size={18} /></div>
              <div class="item-row__info">
                <strong>{uri.value}</strong>
                <small>{uri.enabled ? 'Enabled' : 'Disabled'}</small>
              </div>
              <button type="button" class="item-row__delete" use:ripple
                onclick={() => { deleteUriId = uri.id; deleteUriAction = '?/delete-post-logout-redirect'; showDeleteUri = true; }}>
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No post-logout redirect URIs configured.</strong></div>
        {/if}
      </div>
    </SectionCard>
  {/if}

  <!-- ── Roles ─────────────────────────────────────────────── -->
  {#if activeTab === 'Roles'}
    <SectionCard eyebrow="Authorization" title="Client roles" description="Roles scoped to this client.">
      {#snippet actions()}
        <button type="button" class="cta-btn" use:ripple onclick={() => (showCreateRole = true)}>
          <Plus size={16} /> Create role
        </button>
      {/snippet}

      <div class="item-list">
        {#if data.roles.length > 0}
          {#each data.roles as role (role.id)}
            <div class="item-row">
              <div class="item-row__icon item-row__icon--success"><ShieldCheck size={18} /></div>
              <div class="item-row__info">
                <strong>{role.name}</strong>
                <small>{role.description ?? 'No description'} · {role.permissions.length} permissions</small>
              </div>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No client roles defined.</strong></div>
        {/if}
      </div>
    </SectionCard>
  {/if}
</div>

<!-- ── Add redirect URI ───────────────────────────────────── -->
<Dialog bind:open={showAddRedirect} title="Add redirect URI">
  <form method="POST" action="?/add-redirect" class="form-grid" use:enhance={() => { addingRedirect = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Redirect URI</span><input type="text" name="value" placeholder="https://app.example.com/callback" required /></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={addingRedirect}>
      {addingRedirect ? 'Adding...' : 'Add redirect URI'}
    </button>
  </form>
</Dialog>

<!-- ── Add post-logout redirect URI ───────────────────────── -->
<Dialog bind:open={showAddPostLogout} title="Add post-logout redirect URI">
  <form method="POST" action="?/add-post-logout-redirect" class="form-grid" use:enhance={() => { addingPostLogout = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Post-logout redirect URI</span><input type="text" name="value" placeholder="https://app.example.com/logout" required /></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={addingPostLogout}>
      {addingPostLogout ? 'Adding...' : 'Add post-logout redirect URI'}
    </button>
  </form>
</Dialog>

<!-- ── Create client role ─────────────────────────────────── -->
<Dialog bind:open={showCreateRole} title="Create client role">
  <form method="POST" action="?/create-role" class="form-grid" use:enhance={() => { creatingRole = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Role name</span><input type="text" name="name" placeholder="e.g. viewer" required /></label>
    <label><span>Description</span><input type="text" name="description" placeholder="Optional" /></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creatingRole}>
      {creatingRole ? 'Creating...' : 'Create role'}
    </button>
  </form>
</Dialog>

<!-- ── Delete URI confirm ─────────────────────────────────── -->
<ConfirmDelete
  bind:open={showDeleteUri}
  message="Delete this redirect URI? Applications using it will no longer be able to authenticate."
  confirming={deletingUri}
  onconfirm={() => {
    deletingUri = true;
    const f = document.createElement('form');
    f.method = 'POST'; f.action = deleteUriAction; f.style.display = 'none';
    const input = document.createElement('input');
    input.name = 'uri_id'; input.value = deleteUriId;
    f.appendChild(input);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<style>
  .client-detail { display: grid; gap: 24px; }

  .client-detail__back {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--text-muted); text-decoration: none; font-size: 0.9rem;
    font-weight: 600; padding: 8px 12px; border-radius: 12px; justify-self: start;
  }
  .client-detail__back:hover { color: var(--text); }

  .client-detail__hero {
    display: flex; align-items: center; gap: 20px; padding: 24px;
  }
  .client-detail__avatar {
    display: grid; place-items: center; width: 64px; height: 64px;
    border-radius: 20px; background: var(--primary-soft); color: var(--primary); flex-shrink: 0;
  }
  h2 { margin: 0 0 4px; font: 700 1.8rem var(--font-display); letter-spacing: -0.04em; }
  span, small { color: var(--text-muted); margin: 0; }

  .client-detail__badges { display: flex; gap: 8px; margin-top: 8px; }
  .badge { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
  .badge--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .badge--muted { background: color-mix(in srgb, var(--text-muted) 14%, transparent); color: var(--text-muted); }
  .badge--primary { background: var(--primary-soft); color: var(--primary); }

  .client-detail__tabs {
    display: flex; gap: 4px; padding: 4px; border-radius: 16px;
    background: var(--surface); border: 1px solid var(--border);
  }
  .client-detail__tab {
    flex: 1; padding: 12px 16px; border: 0; border-radius: 12px;
    background: transparent; color: var(--text-muted);
    font-weight: 600; cursor: pointer; transition: all 160ms ease;
  }
  .client-detail__tab--active { background: var(--primary); color: white; }

  .client-detail__info-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;
  }
  .info-card {
    display: flex; align-items: center; gap: 12px; padding: 16px;
    border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border); color: var(--text-muted);
  }
  .info-card div { display: grid; gap: 2px; }
  .info-card strong { color: var(--text); font-size: 0.92rem; }

  .secret-box {
    padding: 14px 16px; border-radius: 14px; background: var(--bg-inset);
    border: 1px solid var(--border); overflow-x: auto;
  }
  .secret-box code { font-size: 0.88rem; color: var(--text); word-break: break-all; }

  .item-list { display: grid; gap: 8px; }
  .item-row {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px;
    border-radius: 16px; background: var(--bg-inset); border: 1px solid var(--border);
  }
  .item-row__icon {
    display: grid; place-items: center; width: 40px; height: 40px;
    border-radius: 14px; background: var(--primary-soft); color: var(--primary); flex-shrink: 0;
  }
  .item-row__icon--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .item-row__icon--warn { background: color-mix(in srgb, #f59e0b 14%, transparent); color: #f59e0b; }
  .item-row__info { flex: 1; display: grid; gap: 2px; }
  .item-row__info strong { color: var(--text); }
  .item-row__delete {
    display: grid; place-items: center; width: 32px; height: 32px;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer;
  }
  .item-row__delete:hover { color: var(--danger); border-color: var(--danger); }

  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
    border-radius: 14px; border: 0; background: var(--primary); color: white;
    font-weight: 700; cursor: pointer;
  }

  .empty-state {
    padding: 18px; border-radius: 18px; background: var(--bg-inset);
    border: 1px dashed var(--border);
  }
  .empty-state strong { color: var(--text); }

  :global(.form-grid select) {
    width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border);
    background: var(--surface-strong); color: var(--text); outline: 0; font: inherit;
  }

  @media (max-width: 900px) {
    .client-detail__info-grid { grid-template-columns: repeat(2, 1fr); }
    .client-detail__hero { flex-direction: column; text-align: center; }
    .client-detail__badges { justify-content: center; }
  }
</style>
