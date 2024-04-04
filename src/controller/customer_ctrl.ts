import app from '../app.js'
import GetContactRequest from "../entity/request/get_contact_req.js";
import {HttpStatusCode} from "axios";
import {getContact} from "../service/customer_svc.js";
import GetContactResponse from "../entity/response/get_contact_res.js";

app.post('/identify', async (req, res) => {
  console.log(`[CONTROLLER] identify request ${req.body}`)

  const getContactsReq: GetContactRequest = req.body

  if (getContactsReq?.phoneNumber == null && getContactsReq?.email == null) {
    res.status(HttpStatusCode.BadRequest).json({
      error: "both phone number and email cannot be null"
    })
    return
  }

  try {
    const getContactRes: GetContactResponse = await getContact(req)

    res.json(getContactRes)
  } catch (err) {
    res.status(HttpStatusCode.InternalServerError).json({
      error: `unexpected error: ${err}`
    })
  }
})