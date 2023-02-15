export async function handle(state, action) {
  const { input } = action
  if (input.type === 'setNonce') {
    state.users[input.address] = input.nonce
  }
  return { state }
}