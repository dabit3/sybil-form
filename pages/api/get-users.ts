// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { functionId } from '../../exm/functionId.js'
import { formatDistance, parseISO } from 'date-fns'

const FUNCTION_URI = `https://${functionId}.exm.run`

let admins = [
  "0xB2Ebc9b3a788aFB1E942eD65B59E9E49A1eE500D"
]

admins = admins.map(admin => admin.toLocaleLowerCase())

type Data = {
  status: string,
  error?: string,
  users?: any[]
}

function wait() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let body = JSON.parse(req.body)
  const address = body.address.toLowerCase()
  const signature = body.signature

  async function verify(signature, retries) {
    if (retries < 1) {
      res.status(200).json({
        status: 'error',
        error: 'Nonce mismatch.'
      })
    }
    const response = await fetch(FUNCTION_URI)
    const json = await response.json()
    const { nonce, time } = json['users'][address]
    const decodedAddress = ethers.utils.verifyMessage(nonce, signature)

    if (decodedAddress.toLowerCase() === address) {
      console.log('success...')
      const distance = formatDistance(new Date(), parseISO(time))
      if (distance == 'less than a minute') {
        return true
      } else {
        console.log('distance retry...')
        await wait()
        return await verify(signature, retries - 1)
      }
    } else {
      console.log('signature retry...')
      await wait()
      return await verify(signature, retries - 1)
    }
  }

  const verified = await verify(signature, 10)
  if(verified) {
    if (!admins.includes(address.toLowerCase())) {
      console.log('not an admin...')
      res.status(200).json({
        status: 'error',
        error: 'Not an admin.'
      })
    } else {
      const response = await fetch(FUNCTION_URI)
      const json = await response.json()
      const users = Object.values(json.users)

      res.status(200).json({
        status: 'success',
        users
      })
    }
  } else {
    res.status(200).json({
      status: 'error',
      error: 'nonce mismatch'
    })
  }
}
