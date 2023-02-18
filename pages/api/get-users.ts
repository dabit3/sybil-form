// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { functionId } from '../../exm/functionId.js'
import { formatDistance, parseISO } from 'date-fns'

const FUNCTION_URI = `https://${functionId}.exm.run`

type Data = {
  status: string,
  error?: string,
  users?: any[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let body = JSON.parse(req.body)
  const address = body.address.toLowerCase()
  const signature = body.signature
  const response = await fetch(FUNCTION_URI)
  const json = await response.json()
  console.log('json: ', json)
  const { nonce, time } = json['users'][address]
  const distance = formatDistance(new Date(), parseISO(time))
  if (distance !== 'less than a minute') {
    throw new Error('nonce error...')
  }
  
  const decodedAddress = ethers.utils.verifyMessage(nonce, signature)
  if(address.toLowerCase() === decodedAddress.toLowerCase()) {
    const response = await fetch(FUNCTION_URI)
    const json = await response.json()
    const users = Object.values(json.users)

    res.status(200).json({
      status: 'success',
      users
    })
  } else {
    res.status(200).json({
      status: 'error',
      error: 'nonce mismatch'
    })
  }
}
