import { Deque } from 'collections'

type GetContactResponse = {
  contact: ContactRes
}

export type ContactRes = {
  primaryContainerId: number,
  emails: Deque<string>,
  phoneNumbers: Deque<string>,
  secondaryContactIds: number[]
}

export default GetContactResponse