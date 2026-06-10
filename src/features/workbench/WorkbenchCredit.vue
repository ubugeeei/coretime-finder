<template>
  <footer class="credit" aria-label="Project credit">
    <a class="credit-person" href="https://github.com/ubugeeei" target="_blank" rel="noreferrer">
      <img
        class="credit-avatar"
        src="https://github.com/ubugeeei.png?size=80"
        alt="ubugeeei avatar"
        width="32"
        height="32"
      />
      <span class="credit-copy">
        <small class="credit-label">Credit</small>
        <strong class="credit-name">ubugeeei</strong>
      </span>
    </a>
  </footer>
</template>

<style scoped>
.credit {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  margin-top: 32px;
  padding-top: 18px;
}

.credit-person {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-ink);
  text-decoration: none;
}

.credit-avatar {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-strong);
  border-radius: 0;
  background: var(--color-surface);
  object-fit: cover;
}

.credit-copy {
  display: grid;
  gap: 1px;
}

.credit-label {
  color: var(--color-muted);
  font-size: var(--font-size-2xs);
  font-weight: 700;
  text-transform: uppercase;
}

.credit-name {
  font-size: var(--font-size-body-strong);
}
</style>
