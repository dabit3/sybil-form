// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Exm } from '@execution-machine/sdk'
import { v4 as uuid } from 'uuid'
import { functionId } from '../../exm/functionId.js'

const EXM_API_KEY = process.env.EXM_API_KEY 
const exmInstance = EXM_API_KEY ? new Exm({ token: EXM_API_KEY }) : undefined

type Data = {
  status: string,
  nonce: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (exmInstance) {
    let address
    if (req.body) {
      let body = JSON.parse(req.body)
      address = body.address.toLowerCase()
    }
    const nonce = uuid()
    const inputs = [{
      type: 'setNonce',
      nonce,
      address
    }]
    try {
      await exmInstance.functions.write(functionId, inputs)
      res.status(200).json({
        status: 'success',
        nonce
      })
    } catch (err) {
      console.log('err: ', err)
      res.status(500)
    }
  }
}
