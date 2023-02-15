import { Exm } from '@execution-machine/sdk'
import { functionId } from './functionId.js'

const EXM_API_KEY = process.env.EXM_API_KEY 
const exmInstance = EXM_API_KEY ? new Exm({ token: EXM_API_KEY }) : undefined

const data = await exmInstance.functions.read(functionId)
console.log("data: ", JSON.stringify(data))