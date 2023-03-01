'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { styles } from '../styles'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export default function Admin(props) {
  let [users, setUsers] = useState<any>([])
  const [fetching, setFetching] = useState(false)

  const { address, isConnected } = useAccount()

  async function fetchUsers() {
    try {
      setFetching(true)
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
      setFetching(false)
      if (userData.users) {
        setUsers(userData.users)
      }
    } catch (err) {
      console.log('error fetching uses: ', err)
      setFetching(false)
    }
  }
  
  users = users.filter(u => u.formData)

  return (
    <div style={styles.main}>
      <h1>Admin</h1>
      {
        fetching && <p>Loading users...</p>
      }
      {
        isConnected && !fetching && (<button style={styles.buttonStyle} onClick={fetchUsers}>Fetch Users</button>)
      }
      {
        !isConnected && (<ConnectButton />)
      }
      {
        users.map((user, index) => (
          <div key={index} style={{borderBottom: '1px solid #ddd', padding: '20px'}}>
            <p>{user.address}</p>
            <p>{user.formData.twitter}</p>
            <p>{user.formData.github}</p>
            <p>{user.formData.score}</p>
          </div>
        ))
      }
    </div>
  )
}