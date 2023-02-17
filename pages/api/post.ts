// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Exm } from '@execution-machine/sdk'
import { verifyMessage } from 'ethers'
import { functionId } from '../../exm/functionId.js'

const EXM_API_KEY = process.env.EXM_API_KEY 
const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const COMMUNITY_ID = process.env.NEXT_PUBLIC_GC_COMMUNITY_ID
const exmInstance = EXM_API_KEY ? new Exm({ token: EXM_API_KEY }) : undefined

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

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
      let address, signature, formData
      if (req.body) {
        let body = JSON.parse(req.body)
        address = body.address.toLowerCase()
        signature = body.signature
        formData = body.formData
      }
      const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${COMMUNITY_ID}/${address}`
      const exmdata = await exmInstance.functions.read(functionId)
      const nonce = exmdata['users'][address]['nonce']
      const decodedAddress = verifyMessage(nonce, signature)
      if(address.toLowerCase() === decodedAddress.toLowerCase()) {
        const response = await fetch(GET_PASSPORT_SCORE_URI, {
          headers
        })
        const passportData = await response.json()
        if (parseInt(passportData.score) >= 32) {
          const inputs = [{
            type: 'setFormData',
            address,
            formData
          }]
          await exmInstance.functions.write(functionId, inputs)
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
}
