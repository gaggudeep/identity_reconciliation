import GetContactResponse, { ContactRes } from '../entity/response/get_contact_res.js'
import GetContactsRequest from '../entity/request/get_contact_req.js'
import ContactRepo, { Contact, LinkPrecedence } from '../repository/contact.js'
import { FindOptions, Model, Op } from 'sequelize'
import Deque from 'collections/deque.js'

export const getContact = async (req: GetContactsRequest): Promise<GetContactResponse> => {
  console.log(`[SERVICE][${req.id}] get contact request: ${JSON.stringify(req)}`)

  const opts: FindOptions = constructFindOptions(req)
  let contacts: Model<Contact>[] = []

  try {
    contacts = await ContactRepo.findAll(opts)
  } catch (err) {
    console.error(`[SERVICE][${req.id}] error finding matching contacts: ${err}`)
    throw err
  }

  console.log(`[SERVICE][${req.id}] get contacts success, number of related contacts found: ${contacts.length}`)

  return constructGetContactRes(contacts)
}

const constructGetContactRes = (contacts: Model<Contact, Contact>[]): GetContactResponse => {
  const contactRes: ContactRes = {
    primaryContainerId: -1,
    emails: new Deque(),
    phoneNumbers: new Deque(),
    secondaryContactIds: [],
  }
  const res: GetContactResponse = {
    contact: contactRes,
  }

  contacts?.forEach(contactModel => {
    let contact: Contact = contactModel?.get()
    let email = contact?.phoneNumber
    let phoneNum = contact?.phoneNumber

    if (contact?.linkPrecedence === LinkPrecedence.Primary) {
      contactRes.primaryContainerId = contact.id
      if (email != null) {
        contactRes.emails.unshift(email)
      }
      if (phoneNum != null) {
        contactRes.phoneNumbers.unshift(phoneNum)
      }
      return
    }
    if (email != null) {
      contactRes.emails.push(email)
    }
    if (phoneNum != null) {
      contactRes.phoneNumbers.push(phoneNum)
    }
    contactRes.secondaryContactIds.push(contact?.id)
  })

  return res
}

function constructFindOptions(req: GetContactsRequest): FindOptions {
  const orOperator = {}

  if (req.email != null) {
    orOperator['email'] = req.email
  }
  if (req.phoneNumber != null) {
    orOperator['phone_number'] = req.phoneNumber
  }

  return {
    where: {
      [Op.or]: orOperator
    },
  }
}

