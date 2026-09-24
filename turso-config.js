/* Turso configuration — intentionally stored in the client file as requested. */
window.AHMADI_TURSO_CONFIG = Object.freeze({
  databaseURL: 'libsql://mold-homworkhhh76-rgb.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgxMTYzNTksImlkIjoiMDFhMDUxNDYtNDcwMS03YjYyLTlhMmUtZTFiYWFjMTQ1NmM3Iiwia2lkIjoicVgzS01DZ0pwQnp3eGo1Tzl2SHhaWUJGem9sTWFsa24tTU5JOTRlMTl6YyIsInJpZCI6IjI1YjBmY2NiLWMyYmMtNDQ3Ny1iMjk2LThmM2Y2NTg3M2NjYiJ9.J1kOd0iqHDOc9r23UAZtkth0jZ0XOFC0vmFpUzJd_ksdHByCoNFvDnxgtlY-S5_V9ZwXyliJQigpB3Rz3_PJDQ',
  tables: {
    companies: 'ahmadi_companies',
    state: 'ahmadi_state',
    admins: 'ahmadi_admins',
    employees: 'ahmadi_employees',
    subscriptionUsers: 'ahmadi_subscription_users'
  },
  sync: {
    visiblePollMs: 4000,
    hiddenPollMs: 45000,
    writeDebounceMs: 450,
    requestTimeoutMs: 18000
  }
});
