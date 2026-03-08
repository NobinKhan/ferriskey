<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { Settings, Shield, Mail, Key, Compass, Lock } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import SectionCard from '$components/SectionCard.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let saving = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') showToast(f.message, 'success');
      else if (typeof f.error === 'string') showToast(f.error, 'error');
      saving = false;
    }
  });

  const s = $derived(data.realm.settings ?? {
    user_registration_enabled: false,
    forgot_password_enabled: false,
    remember_me_enabled: false,
    magic_link_enabled: false,
    magic_link_ttl: 300,
    compass_enabled: false,
  });
</script>

<div class="settings-page">
  <section class="settings-page__hero glass-panel">
    <div>
      <p>Configuration</p>
      <h2>Realm settings</h2>
      <span>Configure login behaviour, security features, and realm-level options for <strong>{data.realm.name}</strong>.</span>
    </div>
  </section>

  <form
    method="POST"
    action="?/update-settings"
    class="settings-page__grid"
    use:enhance={() => { saving = true; return async ({ update }) => { await update(); }; }}
  >
    <SectionCard eyebrow="Login" title="Login page features" compact={true}>
      <div class="settings-toggle-list">
        <label>
          <div>
            <Shield size={18} />
            <strong>User registration</strong>
          </div>
          <input type="checkbox" name="user_registration_enabled" checked={s.user_registration_enabled} />
        </label>
        <label>
          <div>
            <Key size={18} />
            <strong>Forgot password</strong>
          </div>
          <input type="checkbox" name="forgot_password_enabled" checked={s.forgot_password_enabled} />
        </label>
        <label>
          <div>
            <Lock size={18} />
            <strong>Remember me</strong>
          </div>
          <input type="checkbox" name="remember_me_enabled" checked={s.remember_me_enabled} />
        </label>
      </div>
    </SectionCard>

    <SectionCard eyebrow="Magic link" title="Passwordless login" compact={true}>
      <div class="settings-toggle-list">
        <label>
          <div>
            <Mail size={18} />
            <strong>Magic link enabled</strong>
          </div>
          <input type="checkbox" name="magic_link_enabled" checked={s.magic_link_enabled} />
        </label>
        <label class="settings-field">
          <span>TTL (seconds)</span>
          <input type="number" name="magic_link_ttl" value={s.magic_link_ttl} min="1" />
        </label>
      </div>
    </SectionCard>

    <SectionCard eyebrow="Features" title="Optional modules" compact={true}>
      <div class="settings-toggle-list">
        <label>
          <div>
            <Compass size={18} />
            <strong>Compass (auth flows)</strong>
          </div>
          <input type="checkbox" name="compass_enabled" checked={s.compass_enabled} />
        </label>
      </div>
    </SectionCard>

    <SectionCard eyebrow="Security" title="Signing algorithm" compact={true}>
      <div class="settings-toggle-list">
        <label class="settings-field">
          <span>Default signing algorithm</span>
          <select name="default_signing_algorithm">
            <option value="RS256" selected={data.realm.default_signing_algorithm === 'RS256'}>RS256</option>
            <option value="RS384" selected={data.realm.default_signing_algorithm === 'RS384'}>RS384</option>
            <option value="RS512" selected={data.realm.default_signing_algorithm === 'RS512'}>RS512</option>
            <option value="ES256" selected={data.realm.default_signing_algorithm === 'ES256'}>ES256</option>
          </select>
        </label>
      </div>
    </SectionCard>

    <button type="submit" class="settings-page__save" use:ripple disabled={saving}>
      <Settings size={16} />
      {saving ? 'Saving...' : 'Save settings'}
    </button>
  </form>
</div>

<style>
  .settings-page { display: grid; gap: 24px; }

  .settings-page__hero { padding: 24px; }

  p, span, small { margin: 0; color: var(--text-muted); }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .settings-page__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .settings-toggle-list { display: grid; gap: 8px; }

  .settings-toggle-list label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 120ms ease;
  }

  .settings-toggle-list label:hover { border-color: var(--border-strong); }

  .settings-toggle-list label div {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-soft);
  }

  .settings-toggle-list label div strong { color: var(--text); font-size: 0.92rem; }

  .settings-toggle-list input[type='checkbox'] {
    width: 20px;
    height: 20px;
    accent-color: var(--primary);
    cursor: pointer;
  }

  .settings-field {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }

  .settings-field span {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-soft);
  }

  .settings-field input[type='number'],
  .settings-field select {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface-strong);
    color: var(--text);
    font: inherit;
    outline: 0;
  }

  .settings-page__save {
    grid-column: 1 / -1;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    border-radius: 16px;
    border: 0;
    background: var(--primary);
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  .settings-page__save:disabled { opacity: 0.6; cursor: wait; }

  @media (max-width: 900px) {
    .settings-page__grid { grid-template-columns: 1fr; }
  }
</style>
