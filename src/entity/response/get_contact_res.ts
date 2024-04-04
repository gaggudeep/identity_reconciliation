type GetContactResponse = {
  contact: Contact
}

type Contact = {
  primaryContainerId: number,
  emails: string[],
  phoneNumbers: string[],
  secondaryContactIds: number[]
}

export default GetContactResponse