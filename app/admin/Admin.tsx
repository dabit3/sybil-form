'use client'

import { useState } from 'react'
import { styles } from '../styles'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSigner } from 'wagmi'

export default function Admin(props) {
  let [users, setUsers] = useState<any>([])
  const [fetching, setFetching] = useState(false)
  const { data: signer } = useSigner()
  const { address, isConnected } = useAccount()

  async function fetchUsers() {
    if (!signer) return
    try {
      setFetching(true)
      let response = await fetch('/api/set-nonce', {
        method: 'POST',
        body: JSON.stringify({
          address
        })
      })
      let json = await response.json()
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
      <div style={tableContainerStyle}>
        <table style={{
          tableLayout: 'fixed',
          width: '940px',
          borderSpacing: '0px'
        }}>
          <tr style={headingContainerStyle}>
            <th style={thStyle}>Address</th>
            <th style={thStyle}>Twitter</th>
            <th style={thStyle}>GitHub</th>
            <th style={thStyle}>Interests</th>
            <th style={thStyle}>Score</th>
          </tr>
          </table>
          <table style={{
          tableLayout: 'fixed',
          width: '940px',
          borderSpacing: '0px'
        }}>
          {
          users.map((user, index) => (
            <tr key={index} style={userContainerStyle}>
              <td style={tdStyle}>
                <a
                target="_blank" rel="no-opener" style={linkStyle} 
                href={`https://etherscan.io/address/${user.address}`}>{user.address.substring(0, 10)}....</a>
                </td>
              <td style={tdStyle}>
                <a
                target="_blank" rel="no-opener" style={linkStyle} 
                href={`https://twitter.com/${user.formData.github}`}>{user.formData.twitter}</a></td>
              <td style={tdStyle}>
                <a
                target="_blank" rel="no-opener" style={linkStyle} 
                href={`https://github.com/${user.formData.github}`}>{user.formData.github}</a></td>
              <td style={tdStyle}><p>{user.formData.interests}</p></td>
              <td style={tdStyle}><p>{Math.round(user.score)}</p></td>
            </tr>
          ))
        }
        </table>

        {/* {
          users.map((user, index) => (
            <div key={index} style={userContainerStyle}>
              <a style={linkStyle} href={`https://etherscan.io/address/${user.addres}`}>{user.address.substring(0, 7)}....</a>
              <p>{user.formData.twitter}</p>
              <p>{user.formData.github}</p>
              <p>{user.formData.interests}</p>
              <p>{Math.round(user.score)}</p>
            </div>
          ))
        } */}
      </div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left' as 'left',
  width: '188px',
  padding: '10px',
  
}

const tdStyle = {
  textAlign: 'left' as 'left',
  width: '188px',
  padding: '10px',
}

const tableContainerStyle = {
  marginTop: '20px'
}

const headerContentStyle = {
  fontWeight: 'bold'
}

const linkStyle = {
  color: '#006cff'
}

const headingContainerStyle = {
  width: '100%',
  padding: '20px',
}

const userContainerStyle = {
  borderBottom: '1px solid rgba(0, 0, 0, .15)',
  backgroundColor: 'rgba(0, 0, 0, .075)'
}