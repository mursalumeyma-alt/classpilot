// Test double for `firebase/app`. Only used by the test harness.
export function initializeApp(config) {
  if (!config || !config.projectId) throw new Error('Bad firebase config')
  return { name: '[DEFAULT]', options: config }
}
