'use client'
import { useState, useEffect } from 'react'
import { styles } from './styles'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSigner } from 'wagmi'

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const COMMUNITY_ID = process.env.NEXT_PUBLIC_GC_COMMUNITY_ID
// score needed to see hidden message
const THRESHOLD:number = Number(process.env.NEXT_PUBLIC_THRESHOLD)

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

// submitting passport
const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'
// getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'

export default function Passport() {
  const [score, setScore] = useState<string>('')
  const [noScoreMessage, setNoScoreMessage] = useState<string>('')
  const [formData, setFormData] = useState({})
  const [processing, setProcessing] = useState<boolean>(false)
  const [submittingPassport, setSubmittingPassport] = useState<boolean>(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)

  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()

  useEffect(() => {
    if (isConnected) {
      checkPassport()
    }
  }, [isConnected])


  async function checkPassport(currentAddress = address) {
    setScore('')
    setNoScoreMessage('')
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${currentAddress}`
    try {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      if (passportData.score) {
        const roundedScore = Math.round(passportData.score * 100) / 100
        setScore(roundedScore.toString())
        setSubmittingPassport(false)
      } else {
        console.log('No score available, please add stamps to your passport and then resubmit.')
        setSubmittingPassport(false)
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
    if (!signer) return
    try {
      const { message, nonce } = await getSigningMessage()
      const signature = await signer.signMessage(message)
      setNoScoreMessage('')
      setSubmittingPassport(true)
      setScore('')
      setNoScoreMessage('')
      await fetch(SUBMIT_PASSPORT_URI, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address,
          community: COMMUNITY_ID,
          signature,
          nonce
        })
      })
      checkPassportStatus()
    } catch (err) {
      setNoScoreMessage('Please try resubmitting your passport and re-checking your score.')
      console.log('error: ', err)
    }
  }

  async function checkPassportStatus() {
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${address}`
    try {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      console.log('passportData: ', passportData)
      if (passportData.status === 'PROCESSING') {
        await wait()
        return checkPassportStatus()
      } else {
        checkPassport()
      }
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
    await post(json.nonce)
  }

  async function post(nonce) {
    if (!signer) return
    // the /post endpoint will verify the user's identity, and only post if they were indeed the wallet owner
    const signature = await signer.signMessage(nonce)
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
    if (!json.error) {
      setShowSuccessMessage(true)
    }
  }

  return (
    <div style={styles.main}>
      <h1 style={styles.heading}>SYBIL FORM</h1>
      <p style={styles.intro}>Gitcoin Passport is an identity protocol that proves your trustworthiness without needing to collect personally identifiable information. Configure your passport <a style={styles.linkStyle} target="_blank" href="https://passport.gitcoin.co/#/dashboard">here</a></p>
      <div style={styles.buttonContainer}>
      {
        !isConnected && (
          <ConnectButton />
        )
      }
      {
        submittingPassport && (
          <h3>Please wait, submitting passport for new scoring ...</h3>
        )
      }
      {
        score && (
          <div>
            {
              Number(score) > THRESHOLD && <h3>Your passport score is {score}, congratulations you are eligible!</h3>
            }
            <div style={styles.hiddenMessageContainer}>
              {
                Number(score) < THRESHOLD && (
                  <>
                  <h3>Sorry, your score is {Number(score)}, it is not high enough to join the allow-list.</h3>
                  <div style={styles.stepsContainer}>
                    <p style={styles.stepsHeader}>INCREASE YOUR SCORE:</p>
                    <p>✅ Contribute to Gitcoin Grants</p>
                    <p>🐦 Link a Twitter Profile</p>
                    <p>🧑‍💻 Link a Github Account</p>
                    <p>🔢 Verify ENS Ownership</p>
                    <p>🫡 Verify Proof of Humanity</p>
                    <p>🌿 Connect your Lens account</p>
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
        Number(score) >= THRESHOLD && (
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
                onChange={e => setFormData({ ...formData, interests: e.target.value })}
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
                <div style={{display: 'flex'}}>
                  <img src="/spinner.svg" className="spinner" />
                  <p>Processing your submission....</p>
                </div>
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
        noScoreMessage && (
          <div>
            <p style={styles.noScoreMessage}>{noScoreMessage}</p>
            <button style={styles.largeButtonStyle} onClick={submitPassport}>Submit Passport</button>
            <button style={styles.largeButtonStyle} onClick={() => checkPassport()}>Re-check Score</button>
          </div>
        )
      }
      </div>
    </div>
  )
}

function wait() {
  return new Promise((resolve) => setTimeout(resolve, 1000))
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