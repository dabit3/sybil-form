export async function handle(state, action) {
  const { input } = action
  if (input.type === 'setNonce') {
    if (!state.users[input.address]) {
      state.users[input.address] = {}
    }
    state.users[input.address]['nonce'] = input.nonce
  }
  if (input.type === 'setFormData') {
    state.users[input.address]['formData'] = input.formData
  }
  return { state }
}