// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuid } from 'uuid'
import { functionId } from '../../exm/functionId.js'

const FUNCTION_URI = `https://${functionId}.exm.run`

const headers = {
  'Content-Type': 'application/json'
}

type Data = {
  status: string,
  nonce: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let address
  if (req.body) {
    let body = JSON.parse(req.body)
    address = body.address.toLowerCase()
  }
  const nonce = uuid()
  const input = {
    type: 'setNonce',
    nonce,
    address
  }
  try {
    await fetch(FUNCTION_URI, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...input
      })
    })

    res.status(200).json({
      status: 'success',
      nonce
    })
  } catch (err) {
    console.log('err: ', err)
    res.status(500)
  }
}
