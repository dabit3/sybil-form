export async function handle(state, action) {
  const { input } = action
  if (input.type === 'setNonce') {
    if (!state.users[input.address]) {
      state.users[input.address] = {}
    }
    state.users[input.address]['address'] = input.address
    state.users[input.address]['nonce'] = input.nonce
    state.users[input.address]['time'] = input.time
  }
  if (input.type === 'setFormData') {
    state.users[input.address]['formData'] = input.formData
    state.users[input.address]['verified'] = true
  }
  return { state }
}