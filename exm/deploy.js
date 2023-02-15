/* deploy.js */
import { ContractType } from '@execution-machine/sdk'
import fs from 'fs'
import { Exm } from '@execution-machine/sdk'

const state = {
  "users": {}
}

const EXM_API_KEY = process.env.EXM_API_KEY 

const exmInstance = EXM_API_KEY ? new Exm({ token: EXM_API_KEY }) : undefined
const contractSource = fs.readFileSync('handler.js')
const data = await exmInstance.functions.deploy(contractSource, state, ContractType.JS)

console.log('Function ID: ', data.id)

/* after the contract is deployed, write the function id to a local file */
fs.writeFileSync('./functionId.js', `export const functionId = "${data.id}"`)