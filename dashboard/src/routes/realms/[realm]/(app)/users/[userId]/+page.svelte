<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    User,
    Shield,
    Key,
    Lock,
    ArrowLeft,
    Pencil,
    Trash2,
    Plus,
    CheckCircle,
    XCircle,
    Mail,
    Calendar
  } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const tabs = ['Profile', 'Credentials', 'Roles', 'Permissions'] as const;
  let activeTab = $state<typeof tabs[number]>('Profile');

  /* ── Dialogs ────────────────────────────────────────────── */
  let showResetPw = $state(false);
  let resettingPw = $state(false);
  let showAssignRole = $state(false);
  let assigningRole = $state(false);
  let showDeleteCred = $state(false);
  let deletingCred = $state(false);
  let deleteCredId = $state('');
  let showUnassignRole = $state(false);
  let unassigningRole = $state(false);
  let unassignRoleId = $state('');
  let saving = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') {
        showToast(f.message, 'success');
        showResetPw = false;
        showAssignRole = false;
        showDeleteCred = false;
        showUnassignRole = false;
      } else if (typeof f.error === 'string') {
        showToast(f.error, 'error');
      }
      resettingPw = false;
      assigningRole = false;
      deletingCred = false;
      unassigningRole = false;
      saving = false;
    }
  });

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  }

  const assignedRoleIds = $derived(new Set(data.roles.map((r) => r.id)));
  const availableRoles = $derived(data.allRoles.filter((r) => !assignedRoleIds.has(r.id)));
  const realm = $derived(page.params.realm);
</script>

<div class="user-detail">
  <a href="/realms/{realm}/users" class="user-detail__back" use:ripple>
    <ArrowLeft size={16} />
    Back to users
  </a>

  <!-- ── Hero ──────────────────────────────────────────────── -->
  <section class="user-detail__hero glass-panel">
    <div class="user-detail__avatar">
      <User size={32} />
    </div>
    <div>
      <h2>{data.user.firstname} {data.user.lastname}</h2>
      <span>@{data.user.username} · {data.user.email}</span>
      <div class="user-detail__badges">
        <span class="badge" class:badge--success={data.user.enabled} class:badge--muted={!data.user.enabled}>
          {data.user.enabled ? 'Enabled' : 'Disabled'}
        </span>
        <span class="badge" class:badge--success={data.user.email_verified} class:badge--muted={!data.user.email_verified}>
          {data.user.email_verified ? 'Verified' : 'Unverified'}
        </span>
        {#if data.user.is_service_account}
          <span class="badge badge--primary">Service Account</span>
        {/if}
      </div>
    </div>
  </section>

  <!-- ── Tabs ──────────────────────────────────────────────── -->
  <nav class="user-detail__tabs">
    {#each tabs as tab (tab)}
      <button
        type="button"
        class="user-detail__tab"
        class:user-detail__tab--active={activeTab === tab}
        onclick={() => (activeTab = tab)}
        use:ripple
      >{tab}</button>
    {/each}
  </nav>

  <!-- ── Profile ───────────────────────────────────────────── -->
  {#if activeTab === 'Profile'}
    <SectionCard eyebrow="Profile" title="Edit user profile" compact={true}>
      <form method="POST" action="?/update-user" class="form-grid" use:enhance={() => { saving = true; return async ({ update }) => { await update(); }; }}>
        <label><span>Username</span><input type="text" name="username" value={data.user.username} /></label>
        <label><span>Email</span><input type="email" name="email" value={data.user.email} /></label>
        <label><span>First name</span><input type="text" name="firstname" value={data.user.firstname} /></label>
        <label><span>Last name</span><input type="text" name="lastname" value={data.user.lastname} /></label>
        <label class="form-grid__checkbox">
          <input type="checkbox" name="enabled" checked={data.user.enabled} />
          <span>Enabled</span>
        </label>
        <label class="form-grid__checkbox">
          <input type="checkbox" name="email_verified" checked={data.user.email_verified} />
          <span>Email verified</span>
        </label>
        <button type="submit" class="form-grid__submit" use:ripple disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </SectionCard>

    <section class="user-detail__info-grid">
      <div class="info-card">
        <Calendar size={16} />
        <div><span>Created</span><strong>{formatDate(data.user.created_at)}</strong></div>
      </div>
      <div class="info-card">
        <Calendar size={16} />
        <div><span>Updated</span><strong>{formatDate(data.user.updated_at)}</strong></div>
      </div>
      <div class="info-card">
        <Shield size={16} />
        <div><span>Roles</span><strong>{data.roles.length}</strong></div>
      </div>
      <div class="info-card">
        <Key size={16} />
        <div><span>Credentials</span><strong>{data.credentials.length}</strong></div>
      </div>
    </section>

    {#if data.user.required_actions.length > 0}
      <SectionCard eyebrow="Actions" title="Required actions" compact={true}>
        <div class="chip-list">
          {#each data.user.required_actions as action (action)}
            <span class="chip chip--warning">{action}</span>
          {/each}
        </div>
      </SectionCard>
    {/if}
  {/if}

  <!-- ── Credentials ───────────────────────────────────────── -->
  {#if activeTab === 'Credentials'}
    <SectionCard eyebrow="Security" title="Credentials" description="Manage authentication credentials for this user.">
      {#snippet actions()}
        <button type="button" class="cta-btn" use:ripple onclick={() => (showResetPw = true)}>
          <Lock size={16} /> Reset password
        </button>
      {/snippet}

      <div class="item-list">
        {#if data.credentials.length > 0}
          {#each data.credentials as cred (cred.id)}
            <div class="item-row">
              <div class="item-row__icon"><Key size={18} /></div>
              <div class="item-row__info">
                <strong>{cred.credential_type}</strong>
                <small>Created {formatDate(cred.created_at)}</small>
              </div>
              <button type="button" class="item-row__delete" use:ripple
                onclick={() => { deleteCredId = cred.id; showDeleteCred = true; }}>
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No credentials.</strong></div>
        {/if}
      </div>
    </SectionCard>
  {/if}

  <!-- ── Roles ─────────────────────────────────────────────── -->
  {#if activeTab === 'Roles'}
    <SectionCard eyebrow="Authorization" title="Assigned roles" description="Manage which roles this user holds.">
      {#snippet actions()}
        <button type="button" class="cta-btn" use:ripple onclick={() => (showAssignRole = true)}>
          <Plus size={16} /> Assign role
        </button>
      {/snippet}

      <div class="item-list">
        {#if data.roles.length > 0}
          {#each data.roles as role (role.id)}
            <div class="item-row">
              <div class="item-row__icon item-row__icon--success"><Shield size={18} /></div>
              <div class="item-row__info">
                <strong>{role.name}</strong>
                <small>{role.description ?? 'No description'} · {role.permissions.length} permissions</small>
              </div>
              <button type="button" class="item-row__delete" use:ripple
                onclick={() => { unassignRoleId = role.id; showUnassignRole = true; }}>
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No roles assigned.</strong></div>
        {/if}
      </div>
    </SectionCard>
  {/if}

  <!-- ── Permissions ───────────────────────────────────────── -->
  {#if activeTab === 'Permissions'}
    <SectionCard eyebrow="Access" title="Effective permissions" compact={true}>
      {#if data.permissions.length > 0}
        <div class="chip-list">
          {#each data.permissions as perm (perm.name)}
            <span class="chip chip--success">{perm.name}</span>
          {/each}
        </div>
      {:else}
        <div class="empty-state"><strong>No permissions.</strong><small>Assign roles to grant permissions.</small></div>
      {/if}
    </SectionCard>
  {/if}
</div>

<!-- ── Reset password dialog ──────────────────────────────── -->
<Dialog bind:open={showResetPw} title="Reset password">
  <form method="POST" action="?/reset-password" class="form-grid" use:enhance={() => { resettingPw = true; return async ({ update }) => { await update(); }; }}>
    <label><span>New password</span><input type="password" name="password" placeholder="Enter new password" required minlength="4" /></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={resettingPw}>
      {resettingPw ? 'Resetting...' : 'Reset password'}
    </button>
  </form>
</Dialog>

<!-- ── Assign role dialog ─────────────────────────────────── -->
<Dialog bind:open={showAssignRole} title="Assign role">
  {#if availableRoles.length > 0}
    <form method="POST" action="?/assign-role" class="form-grid" use:enhance={() => { assigningRole = true; return async ({ update }) => { await update(); }; }}>
      <label>
        <span>Select role</span>
        <select name="role_id" required>
          {#each availableRoles as role (role.id)}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={assigningRole}>
        {assigningRole ? 'Assigning...' : 'Assign role'}
      </button>
    </form>
  {:else}
    <div class="empty-state"><strong>All roles are already assigned.</strong></div>
  {/if}
</Dialog>

<!-- ── Delete credential confirm ──────────────────────────── -->
<ConfirmDelete
  bind:open={showDeleteCred}
  message="Delete this credential? The user may not be able to log in."
  confirming={deletingCred}
  onconfirm={() => {
    deletingCred = true;
    const f = document.createElement('form');
    f.method = 'POST'; f.action = '?/delete-credential'; f.style.display = 'none';
    const input = document.createElement('input');
    input.name = 'credential_id'; input.value = deleteCredId;
    f.appendChild(input);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<!-- ── Unassign role confirm ──────────────────────────────── -->
<ConfirmDelete
  bind:open={showUnassignRole}
  title="Unassign role"
  message="Remove this role from the user?"
  confirming={unassigningRole}
  onconfirm={() => {
    unassigningRole = true;
    const f = document.createElement('form');
    f.method = 'POST'; f.action = '?/unassign-role'; f.style.display = 'none';
    const input = document.createElement('input');
    input.name = 'role_id'; input.value = unassignRoleId;
    f.appendChild(input);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<style>
  .user-detail { display: grid; gap: 24px; }

  .user-detail__back {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--text-muted); text-decoration: none; font-size: 0.9rem;
    font-weight: 600; padding: 8px 12px; border-radius: 12px;
    transition: color 120ms ease; justify-self: start;
  }
  .user-detail__back:hover { color: var(--text); }

  .user-detail__hero {
    display: flex; align-items: center; gap: 20px; padding: 24px;
  }
  .user-detail__avatar {
    display: grid; place-items: center; width: 64px; height: 64px;
    border-radius: 20px; background: var(--primary-soft); color: var(--primary);
    flex-shrink: 0;
  }
  h2 { margin: 0 0 4px; font: 700 1.8rem var(--font-display); letter-spacing: -0.04em; }
  span, small { color: var(--text-muted); margin: 0; }

  .user-detail__badges { display: flex; gap: 8px; margin-top: 8px; }

  .badge {
    padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700;
  }
  .badge--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .badge--muted { background: color-mix(in srgb, var(--text-muted) 14%, transparent); color: var(--text-muted); }
  .badge--primary { background: var(--primary-soft); color: var(--primary); }

  .user-detail__tabs {
    display: flex; gap: 4px; padding: 4px; border-radius: 16px;
    background: var(--surface); border: 1px solid var(--border);
  }
  .user-detail__tab {
    flex: 1; padding: 12px 16px; border: 0; border-radius: 12px;
    background: transparent; color: var(--text-muted);
    font-weight: 600; cursor: pointer; transition: all 160ms ease;
  }
  .user-detail__tab--active {
    background: var(--primary); color: white;
  }

  .user-detail__info-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px;
  }
  .info-card {
    display: flex; align-items: center; gap: 12px; padding: 16px;
    border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border);
    color: var(--text-muted);
  }
  .info-card div { display: grid; gap: 2px; }
  .info-card strong { color: var(--text); font-size: 0.92rem; }

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

  .chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 8px 14px; border-radius: 999px; font-size: 0.82rem; font-weight: 700;
  }
  .chip--success { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
  .chip--warning { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }

  .empty-state {
    padding: 18px; border-radius: 18px; background: var(--bg-inset);
    border: 1px dashed var(--border); display: grid; gap: 4px;
  }
  .empty-state strong { color: var(--text); }

  :global(.form-grid select) {
    width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border);
    background: var(--surface-strong); color: var(--text); outline: 0; font: inherit;
  }

  @media (max-width: 900px) {
    .user-detail__info-grid { grid-template-columns: repeat(2, 1fr); }
    .user-detail__hero { flex-direction: column; text-align: center; }
    .user-detail__badges { justify-content: center; }
  }
</style>
