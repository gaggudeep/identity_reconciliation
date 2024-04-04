import GetContactResponse, { ContactRes } from '../entity/response/get_contact_res.js'
import GetContactsRequest from '../entity/request/get_contact_req.js'
import ContactRepo, { Contact, LinkPrecedence } from '../repository/contact.js'
import { FindOptions, Model, Op } from 'sequelize'

type SeparatedContacts = {
  primaryContacts: Contact[],
  contacts: Contact[],
}

export const getContact = async (req: GetContactsRequest): Promise<GetContactResponse> => {
  console.log(`[SERVICE][${req.id}] get contact request`)

  const opts: FindOptions = constructFindOptions(req)
  let contacts: Model<Contact>[] = []

  try {
    contacts = await ContactRepo.findAll(opts)
  } catch (err) {
    console.error(`[SERVICE][${req.id}] error finding matching contacts: ${err}`)
    throw err
  }

  if (contacts.length != 0) {
    try {
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

const addNewContact = async (req: GetContactsRequest, linkPref: LinkPrecedence = LinkPrecedence.Primary, linkedId: number = null): Promise<Contact> => {
  const contact: Contact = {
    linkPrecedence: linkPref,
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
    return (await ContactRepo.create(contact)).get()
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
  const sepContacts = contacts.reduce(
    (sepContacts: SeparatedContacts, contactModel: Model<Contact>) => {
      const contact: Contact = contactModel.get()

      if (contact.linkPrecedence === LinkPrecedence.Primary) {
        sepContacts.primaryContacts.push(contact)
      }
      sepContacts.contacts.push(contact)

      return sepContacts
    },
    {
      primaryContacts: [],
      contacts: [],
    }
  )

  try {
    await makeContactsSecondary(sepContacts.primaryContacts)
  } catch (err) {
    throw err
  }

  const primaryContact = sepContacts.primaryContacts[0]
  let anyEmailMatch = false
  let anyPhoneNumMatch = false

  contactRes.emails.push(primaryContact.email)
  contactRes.phoneNumbers.push(primaryContact.phoneNumber)
  contactRes.primaryContainerId = primaryContact.id

  sepContacts.contacts.forEach((contact: Contact) => {
    if (contact.email === req.email && req.email != null) {
      anyEmailMatch = true
    }
    if (contact.phoneNumber === req.phoneNumber && req.phoneNumber != null) {
      anyPhoneNumMatch = true
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
  if (!anyEmailMatch || !anyPhoneNumMatch) {
    const addedContact: Contact = await addNewContact(req, LinkPrecedence.Secondary, primaryContact.id)

    if (addedContact.email != null) {
      contactRes.emails.push(addedContact.email)
    }
    if (addedContact.phoneNumber != null) {
      contactRes.phoneNumbers.push(addedContact.phoneNumber)
    }
  }

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
    order: ['created_at']
  }
}

const makeContactsSecondary = async (dateSortedContacts: Contact[]): Promise<void> => {
  if (dateSortedContacts.length <= 1) {
    return
  }

  const ids = dateSortedContacts.map((contact: Contact, i: number) => {
    if (i !== 0) {
      return contact.id;
    }
  })

  try {
    await ContactRepo.update(
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

