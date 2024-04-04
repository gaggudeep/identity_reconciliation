import GetContactRequest from '../entity/request/get_contact_req.js'
import { getContact } from '../service/contact_svc.js'
import GetContactResponse from '../entity/response/get_contact_res.js'
import { Request, Response } from 'express'

export const contact = async (req: Request, res: Response) => {
  const reqId = crypto.randomUUID()

  console.log(`[CONTROLLER][${reqId}] identify request ${JSON.stringify(req.body)}`)

  const getContactsReq: GetContactRequest = req.body

  getContactsReq.id = reqId

  if (getContactsReq?.phoneNumber == null && getContactsReq?.email == null) {
    console.error(`[CONTROLLER][${reqId}] bad request`)
    res.status(404).json({
      error: 'both phone number and email cannot be null'
    })
    return
  }

  try {
    const getContactRes: GetContactResponse = await getContact(getContactsReq)

    res.json(getContactRes)
  } catch (err) {
    res.status(500).json({
      error: `unexpected error: ${err}`
    })
  }
}