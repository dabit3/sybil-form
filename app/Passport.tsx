'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { styles } from './styles'

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const COMMUNITY_ID = process.env.NEXT_PUBLIC_GC_COMMUNITY_ID

declare global {
  interface Window {
    ethereum?: any
  }
}

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

// submitting passport
const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'
// getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'
// score needed to see hidden message
const thresholdNumber = 32

export default function Passport() {
  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)
  const [score, setScore] = useState<string>('')
  const [noScoreMessage, setNoScoreMessage] = useState<string>('')
  const [formData, setFormData] = useState({})
  const [processing, setProcessing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts && accounts[0]) {
          setConnected(true)
          setAddress(accounts[0])
          checkPassport(accounts[0])
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
      checkPassport(accounts[0])
    } catch (err) {
      console.log('error connecting...')
    }
  }

  async function checkPassport(currentAddress = address) {
    setScore('')
    setNoScoreMessage('')
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${currentAddress}`
    try {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      console.log('passportData: ', passportData)
      if (passportData.score) {
        const roundedScore = Math.round(passportData.score * 100) / 100
        setScore(roundedScore.toString())
      } else {
        console.log('No score available, please add stamps to your passport and then resubmit.')
        setNoScoreMessage('No score available, please submit your passport after you have added some stamps.')
      }
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function getSigningMessage() {
    try {
      const response = await fetch(SIGNING_MESSAGE_URI, {
        headers
      })
      const json = await response.json()
      return json
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function submitPassport() {
    setNoScoreMessage('')
    try {
      const { message, nonce } = await getSigningMessage()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const signature = await signer.signMessage(message)
      
      const response = await fetch(SUBMIT_PASSPORT_URI, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address,
          community: COMMUNITY_ID,
          signature,
          nonce
        })
      })

      await response.json()
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function submit() {
    setShowSuccessMessage(false)
    setProcessing(true)
    const response = await fetch('/api/set-nonce', {
      method: 'POST',
      body: JSON.stringify({
        address
      })
    })
    const json = await response.json()
    console.log('json:', json)
    await post(json.nonce)
  }

  async function post(nonce) {
    // the /post endpoint will verify the user's identity, and only post if they were indeed the wallet owner
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const signature = await signer.signMessage(nonce)
    await new Promise(r => setTimeout(r, 3000))
    const response = await fetch(`/api/post`, {
      method: 'POST',
      body: JSON.stringify({
        signature,
        address,
        formData
      })
    })

    const json = await response.json()
    setProcessing(false)
    console.log('json:: ', json)
    if (!json.error) {
      setShowSuccessMessage(true)
    }
  }

  return (
    <div style={styles.main}>
      <h1 style={styles.heading}>SYBIL FORMS</h1>
      <p style={styles.intro}>Gitcoin Passport is an identity protocol that proves your trustworthiness without needing to collect personally identifiable information. Configure your passport <a style={styles.linkStyle} target="_blank" href="https://passport.gitcoin.co/#/dashboard">here</a></p>
      <div style={styles.buttonContainer}>
      {
        !connected && (
          <button style={styles.largeButtonStyle} onClick={connect}>Connect Wallet</button>
        )
      }
      {
        score && (
          <div>
            <h3>Your passport score is {score}, congratulations you are eligible!</h3>
            <div style={styles.hiddenMessageContainer}>
              {
                Number(score) < thresholdNumber && (
                  <>
                  <h3>Sorry, your score is not high enough to join the allow-list.</h3>
                  <div style={styles.stepsContainer}>
                    <p style={styles.stepsHeader}>INCREASE YOUR SCORE:</p>
                    <p>Contribute to Gitcoin Grants</p>
                    <p>Link a Twitter Profile</p>
                    <p>Link a Github Account</p>
                    <p>Verify ENS Ownership</p>
                    <p>Verify Proof of Humanity</p>
                  </div>
                  <div style={styles.buttonContainer}>
                    <button style={styles.buttonStyle} onClick={submitPassport}>Submit Passport</button>
                    <button style={styles.buttonStyle} onClick={() => checkPassport()}>Re-check passport score</button>
                  </div>
                </>
                )
              }
            </div>
          </div>
        )
      }
      {
        Number(score) >= thresholdNumber && (
          <>
            <div style={styles.formContainer}>
              <input
                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                placeholder='Twitter handle'
                style={styles.input}
              />
              <input
                onChange={e => setFormData({ ...formData, github: e.target.value })}
                placeholder='Github handle'
                style={styles.input}
              />
              <input
                onChange={e => setFormData({ ...formData, github: e.target.value })}
                placeholder='Interests'
                style={styles.input}
              />
            </div>
            {
              showSuccessMessage && (
                <p
                style={{
                  margin: '10px 0px 20px',
                  fontSize: '36px',
                  color: 'rgba(0, 0, 0, .5)'
                }}
                >Congratulations, you're now on the waitlist! ⚡️💅🔥</p>
              )
            }
            {
              processing && (
                <p>Processing your submission....</p>
              ) 
            }
            {
              !processing && !showSuccessMessage && (
                <button style={styles.largeButtonStyle} onClick={submit}>Submit Form</button>
              )
            }
          </>
        )
      }
      {
        noScoreMessage && (<p style={styles.noScoreMessage}>{noScoreMessage}</p>)
      }
      </div>
    </div>
  )
}



// async function getScorer() {
//   //  api scorer
//   const COMMUNITY_SCORER_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}`
//   try {
//     const response = await fetch(COMMUNITY_SCORER_URI, {
//       headers
//     })
//     const data = await response.json()
//     console.log('data: ', data)
//   } catch (err) {
//     console.log('error: ', err)
//   }
// }