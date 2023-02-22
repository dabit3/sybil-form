'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function Admin(props) {
  let [users, setUsers] = useState<any>([])
  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)
  const [fetching, setFetching] = useState(false)

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

  async function connect() {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      setConnected(true)
    } catch (err) {
      console.log('error connecting...')
    }
  }

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
    <div>
      <h1>Admin</h1>
      {
        connected && !fetching && (<button onClick={fetchUsers}>Fetch Users</button>)
      }
      {
        !connected && (<button onClick={connect}>Connect</button>)
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