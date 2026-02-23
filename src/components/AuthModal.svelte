<script>
  import { getAuth, signIn, signUp, clearError } from '../stores/auth.js';

  let { open = false, onclose } = $props();

  const auth = getAuth();
  let mode = $state('signin');
  let email = $state('');
  let password = $state('');

  function toggleMode() {
    mode = mode === 'signin' ? 'signup' : 'signin';
    clearError();
  }

  async function handleSubmit() {
    if (!email || !password) return;
    const success = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    if (success) {
      email = '';
      password = '';
      onclose();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onclose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" class:open onclick={handleOverlayClick} onkeydown={handleKeydown}>
  <div class="modal">
    <h3>{mode === 'signin' ? 'sign in' : 'sign up'}</h3>

    {#if auth.error}
      <div class="auth-error">{auth.error}</div>
    {/if}

    <label for="authEmail">email</label>
    <input type="email" id="authEmail" bind:value={email} onkeydown={handleKeydown} placeholder="you@example.com">

    <label for="authPass">password</label>
    <input type="password" id="authPass" bind:value={password} onkeydown={handleKeydown} placeholder="min 8 characters">

    <div class="modal-btns">
      <button onclick={onclose}>cancel</button>
      <button class="save" onclick={handleSubmit} disabled={auth.loading}>
        {auth.loading ? '...' : (mode === 'signin' ? 'sign in' : 'sign up')}
      </button>
    </div>

    <div class="auth-toggle">
      {#if mode === 'signin'}
        don't have an account? <button class="auth-toggle-link" onclick={toggleMode}>sign up</button>
      {:else}
        already have an account? <button class="auth-toggle-link" onclick={toggleMode}>sign in</button>
      {/if}
    </div>
  </div>
</div>
