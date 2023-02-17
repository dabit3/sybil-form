// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ethers } from 'ethers'
import { functionId } from '../../exm/functionId.js'

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const COMMUNITY_ID = process.env.NEXT_PUBLIC_GC_COMMUNITY_ID
const FUNCTION_URI = `https://${functionId}.exm.run`

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

type Data = {
  status: string,
  error?: string
}

function wait() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

export default async function handler(
  req: any,
  res: any
) {

  async function verify(address, retries) {
    if (retries < 1) {
      res.status(200).json({
        status: 'error',
        error: 'nonce mismatch'
      })
    }
    try {
      let exmdata = await fetch(FUNCTION_URI)
      exmdata = await exmdata.json()
      let user = exmdata['users'][address]
      if (user) {
        const nonce = exmdata['users'][address]['nonce']
        return nonce
      } else {
        await wait()
        return await verify(address, retries - 1)
      }
    } catch (err) {
      console.log("error: ", err)
      await wait()
      return await verify(address, retries - 1)
    }
  }

  try {
    let address, signature, formData
    let body = JSON.parse(req.body)
      address = body.address.toLowerCase()
      signature = body.signature
      formData = body.formData
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${address}`
    const nonce = await verify(address, 10)

    const decodedAddress = ethers.utils.verifyMessage(nonce, signature)
    if(address.toLowerCase() === decodedAddress.toLowerCase()) {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      if (parseInt(passportData.score) >= 32) {
        const input = {
          type: 'setFormData',
          address,
          formData
        }
        let response = await fetch(FUNCTION_URI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...input
          })
        })
        response = await response.json()
        console.log('response: ', response)
        res.status(200).json({ status: 'success' })
      } else {
        res.status(200).json({ status: 'failure', error: 'score did not meet threshold' })
      }
    } else {
      res.status(200).json({
        status: 'error',
        error: 'nonce mismatch'
      })
    }     
  } catch (err) {
    console.log('error from verify: ', err)
    res.status(500)
  }
}
