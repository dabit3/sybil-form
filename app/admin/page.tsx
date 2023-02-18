'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function Admin(props) {
  const [users, setUsers] = useState<any>([])
  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)

  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts && accounts[0]) {
          setConnected(true)
          setAddress(accounts[0])
        }
      } catch (err) {
        console.log('not connected...')
      }
    }
  }, [])
  async function fetchUsers() {
    let response = await fetch('/api/set-nonce', {
      method: 'POST',
      body: JSON.stringify({
        address
      })
    })
    let json = await response.json()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner()
    const signature = await signer.signMessage(json.nonce)
    let postData = await fetch(`/api/get-users`, {
      method: 'POST',
      body: JSON.stringify({
        signature,
        address,
      })
    })

    const userData = await postData.json()
    console.log('userData:', userData)
    setUsers(userData.users)
  }

  return (
    <div>
      <h1>Admi n</h1>
      <button onClick={fetchUsers}>Fetch Users</button>
      {
        users.map((user, index) => (
          <div key={index} style={{borderBottom: '1px solid #ddd', padding: '20px'}}>
            <p>{user.address}</p>
            <p>{user.formData.twitter}</p>
            <p>{user.formData.github}</p>
          </div>
        ))
      }
    </div>
  )
}