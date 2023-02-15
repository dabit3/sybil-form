// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Exm } from '@execution-machine/sdk'
import { ethers } from 'ethers'
import { functionId } from '../../exm/functionId.js'

const EXM_API_KEY = process.env.EXM_API_KEY 
const exmInstance = EXM_API_KEY ? new Exm({ token: EXM_API_KEY }) : undefined

type Data = {
  status: string,
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (exmInstance) {
    try {
      let address, signature
      if (req.body) {
        let body = JSON.parse(req.body)
        address = body.address
        signature = body.signature
      }
      const exmdata = await exmInstance.functions.read(functionId)
      const nonce = exmdata['users'][address]
      const decodedAddress = ethers.utils.verifyMessage(nonce, signature)

      if(address.toLowerCase() === decodedAddress.toLowerCase()) {
        res.status(200).json({ status: 'success' })
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
}
