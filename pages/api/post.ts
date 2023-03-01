// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { functionId } from '../../exm/functionId.js'
import { formatDistance, parseISO } from 'date-fns'

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const COMMUNITY_ID = process.env.NEXT_PUBLIC_GC_COMMUNITY_ID
const FUNCTION_URI = `https://${functionId}.exm.run`
const THRESHOLD:number = Number(process.env.NEXT_PUBLIC_THRESHOLD)

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
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  async function verify(address, retries, signature) {
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
        const decodedAddress = ethers.utils.verifyMessage(user.nonce, signature)
        if (address.toLowerCase() === decodedAddress.toLowerCase()) {
          return user
        } else {
          await wait()
          return await verify(address, retries - 1, signature)
        }
      } else {
        await wait()
        return await verify(address, retries - 1, signature)
      }
    } catch (err) {
      console.log("error: ", err)
      await wait()
      return await verify(address, retries - 1, signature)
    }
  }

  async function checkTime(time, retries) {
    if (retries < 1) {
      res.status(200).json({
        status: 'error',
        error: 'nonce mismatch'
      })
    }
    const distance = formatDistance(new Date(), parseISO(time))
    if (distance !== 'less than a minute') {
      await wait()
      return await checkTime(time, retries - 1)
    }
  }

  try {
    let address, signature, formData
    let body = JSON.parse(req.body)
    address = body.address.toLowerCase()
    signature = body.signature
    formData = body.formData
    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${address}`
    const { nonce, time } = await verify(address, 10, signature)
    await checkTime(time, 5)

    const decodedAddress = ethers.utils.verifyMessage(nonce, signature)
    if(address.toLowerCase() === decodedAddress.toLowerCase()) {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      if (parseInt(passportData.score) >= THRESHOLD) {
        const input = {
          type: 'setFormData',
          address,
          formData,
          score: passportData.score
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
        res.status(200).json({ status: 'success' })
      } else {
        console.log('score not met')
        res.status(200).json({ status: 'failure', error: 'score did not meet threshold' })
      }
    } else {
      console.log('nonce mismatch')
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
