type GetContactResponse = {
  contact: ContactRes
}

export type ContactRes = {
  primaryContainerId: number,
  emails: string[],
  phoneNumbers: string[],
  secondaryContactIds: number[]
}

export default GetContactResponse