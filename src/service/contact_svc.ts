import GetContactResponse, { ContactRes } from '../entity/response/get_contact_res.js'
import GetContactsRequest from '../entity/request/get_contact_req.js'
import contactRepo, { Contact, LinkPrecedence } from '../repository/contact_repo.js'
import { FindOptions, Model, Op } from 'sequelize'

export const getContact = async (req: GetContactsRequest): Promise<GetContactResponse> => {
  console.log(`[SERVICE][${req.id}] get contact request`)

  const opts: FindOptions = constructEmailPhoneFindOptions(req)
  let contacts: Model<Contact>[] = []

  try {
    contacts = await contactRepo.findAll(opts)
  } catch (err) {
    console.error(`[SERVICE][${req.id}] error finding matching contacts: ${err}`)
    throw err
  }

  if (contacts.length != 0) {
    try {
      contacts = await populateLinkedContacts(contacts, req)
      return await populateNewContactAndConstructGetContactRes(req, contacts)
    } catch (err) {
      throw err
    }
  }

  console.warn(`[SERVICE][${req.id}] no contacts matching criteria found adding contact in db`)
  try {
    const contact: Contact = await addNewContact(req)
    const contactRes: ContactRes = {
      primaryContainerId: contact.id,
      emails: [],
      phoneNumbers: [],
      secondaryContactIds: []
    }

    if (contact.email != null) {
      contactRes.emails.push(contact.email)
    }
    if (contact.phoneNumber != null) {
      contactRes.phoneNumbers.push(contact.phoneNumber)
    }

    return {
      contact: contactRes,
    }
  } catch (err) {
    console.error(`[SERVICE][${req.id}] error adding new contact: ${err}`)
    throw err
  }
}

const addNewContact = async (req: GetContactsRequest, linkPrecedence: LinkPrecedence = LinkPrecedence.Primary, linkedId: number = null): Promise<Contact> => {
  const contact: Contact = {
    linkPrecedence: linkPrecedence,
  }

  if (linkedId != null) {
    contact.linkedId = linkedId
  }
  if (req.email != null) {
    contact.email = req.email
  }
  if (req.phoneNumber != null) {
    contact.phoneNumber = req.phoneNumber
  }
  try {
    return (await contactRepo.create(contact)).get()
  } catch (err) {
    throw err
  }
}

const populateNewContactAndConstructGetContactRes = async (req: GetContactsRequest, contacts: Model<Contact, Contact>[]): Promise<GetContactResponse> => {
  const contactRes: ContactRes = {
    primaryContainerId: -1,
    emails: [],
    phoneNumbers: [],
    secondaryContactIds: [],
  }
  const res: GetContactResponse = {
    contact: contactRes,
  }

  const primaryContacts: Contact[] = contacts.map(contact => contact.get())
    .filter(contact => contact.linkPrecedence == LinkPrecedence.Primary)

  try {
    await makeContactsSecondary(primaryContacts)
  } catch (err) {
    throw err
  }

  const primaryContact = primaryContacts[0]
  let emailPresent = req.email == null ? true : false
  let phonePresent = req.phoneNumber == null ? true : false

  contactRes.emails.push(primaryContact.email)
  contactRes.phoneNumbers.push(primaryContact.phoneNumber)
  contactRes.primaryContainerId = primaryContact.id

  contacts.forEach((contactMdl: Model<Contact>) => {
    const contact: Contact = contactMdl.get()

    if (contact.email === req.email) {
      emailPresent = true
    }
    if (contact.phoneNumber === req.phoneNumber) {
      phonePresent = true
    }
    if (contact.id === primaryContact.id) {
      return
    }
    if (contact.email != null) {
      contactRes.emails.push(contact.email)
    }
    if (contact.phoneNumber != null) {
      contactRes.phoneNumbers.push(contact.phoneNumber)
    }
    contactRes.secondaryContactIds.push(contact.id)
  })
  if (!emailPresent || !phonePresent) {
    const addedContact: Contact = await addNewContact(req, LinkPrecedence.Secondary, primaryContact.id)

    if (addedContact.email != null) {
      contactRes.emails.push(addedContact.email)
    }
    if (addedContact.phoneNumber != null) {
      contactRes.phoneNumbers.push(addedContact.phoneNumber)
    }
    contactRes.secondaryContactIds.push(addedContact.id)
  }

  contactRes.emails = [...new Set(contactRes.emails)]
  contactRes.phoneNumbers = [...new Set(contactRes.phoneNumbers)]

  return res
}

const constructEmailPhoneFindOptions = (req: GetContactsRequest): FindOptions => {
  const orOperator = []

  if (req.email != null) {
    orOperator.push({ email: req.email })
  }
  if (req.phoneNumber != null) {
    orOperator.push({ phone_number: req.phoneNumber })
  }

  return {
    where: {
      [Op.or]: orOperator
    },
  }
}

const makeContactsSecondary = async (dateSortedContacts: Contact[]): Promise<void> => {
  if (dateSortedContacts.length <= 1) {
    return
  }
  const ids = []

  for (let i = 1; i < dateSortedContacts.length; i++) {
    ids.push(dateSortedContacts[i].id)
  }
  try {
    await contactRepo.update(
      {
        linkPrecedence: LinkPrecedence.Secondary,
        linkedId: dateSortedContacts[0].id
      },
      {
        where: {
          id: ids,
        }
      }
    )
  } catch (err) {
    throw err
  }
}

async function populateLinkedContacts(contacts: Model<Contact, Contact>[], req: GetContactsRequest) {
  try {
    const ids = []
    const linkedIds = []
    contacts.forEach((contact: Model<Contact>) => {
      ids.push(contact.get().id)
      if (contact.get().linkedId != null) {
        linkedIds.push(contact.get().linkedId)
      }
    })
    const linkedContacts: Model<Contact>[] = await contactRepo.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { id: linkedIds },
              { linkedId: ids }
            ],
          },
          {
            [Op.or]: [
              { id: { [Op.notIn]: ids } },
              { linkedId: { [Op.notIn]: linkedIds } },
            ],
          },
        ],
      }
    })

    contacts = contacts.concat(linkedContacts)
    contacts = contacts.sort((a: Model<Contact>, b: Model<Contact>) => a.get().createdAt.getTime() - b.get().createdAt.getTime())
  } catch (err) {
    throw err
  }

  return contacts
}

