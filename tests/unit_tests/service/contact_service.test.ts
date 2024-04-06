import ContactRepo, { Contact, LinkPrecedence } from '../../../src/repository/contact_repo'
import GetContactRequest from '../../../src/entity/request/get_contact_req'
import { getContact } from '../../../src/service/contact_svc'
import { Op } from 'sequelize'

describe('contact service', () => {

    jest.mock('../../../src/repository/contact_repo')

    beforeEach(() => jest.clearAllMocks())

    it('should create contact if no matching contact found', async () => {
        const req: GetContactRequest = {
            id: '1',
            email: 'mcfly@hillvalley.edu',
            phoneNumber: '123456',
        }
        const model = { get: (_) => { } }
        model.get = (_): Contact => {
            return {
                id: 1,
                linkPrecedence: LinkPrecedence.Primary,
                email: 'mcfly@hillvalley.edu',
                phoneNumber: '123456',
            }
        }

        const findAllMock: jest.Mock = jest.fn()
            .mockResolvedValue([])
        const createMock: jest.Mock = jest.fn()
            .mockResolvedValueOnce(model)
        ContactRepo.findAll = findAllMock
        ContactRepo.create = createMock

        await expect(getContact(req)).resolves.toStrictEqual({
            contact: {
                primaryContainerId: 1,
                emails: ['mcfly@hillvalley.edu'],
                phoneNumbers: ['123456'],
                secondaryContactIds: []
            },
        })
        expect(findAllMock).toHaveBeenCalledTimes(1)
        expect(findAllMock).toHaveBeenCalledWith({
            where: {
                [Op.or]: [
                    {
                        email: 'mcfly@hillvalley.edu',
                    },
                    {
                        phone_number: '123456',
                    }
                ]
            },
        })
        expect(createMock).toHaveBeenCalledTimes(1)
        expect(createMock).toHaveBeenCalledWith({
            linkPrecedence: LinkPrecedence.Primary,
            email: 'mcfly@hillvalley.edu',
            phoneNumber: '123456',
        })
    })

    it('should return all related contact information and convert all primary contact to secondary except the oldest for valid request', async () => {
        const today: Date = new Date()
        const req: GetContactRequest = {
            id: '1',
            email: 'george@hillvalley.edu',
            phoneNumber: '717171',
        }
        const model1 = { get: (_) => { } }
        model1.get = (_): Contact => {
            return {
                id: 1,
                linkPrecedence: LinkPrecedence.Primary,
                email: 'george@hillvalley.edu',
                phoneNumber: '919191',
                createdAt: new Date(today.getTime() - 60000)
            }
        }
        const model2 = { get: (_) => { } }
        model2.get = (_): Contact => {
            return {
                id: 2,
                linkPrecedence: LinkPrecedence.Primary,
                email: 'biffsucks@hillvalley.edu',
                phoneNumber: '717171',
                createdAt: today
            }
        }

        const findAllMock: jest.Mock = jest.fn()
            .mockResolvedValueOnce([model1, model2])
            .mockResolvedValueOnce([])
        const updateMock: jest.Mock = jest.fn()
            .mockReturnValue(Promise.resolve())
        ContactRepo.findAll = findAllMock
        ContactRepo.update = updateMock

        await expect(getContact(req)).resolves.toStrictEqual({
            contact: {
                primaryContainerId: 1,
                emails: ['george@hillvalley.edu', 'biffsucks@hillvalley.edu'],
                phoneNumbers: ['919191', '717171'],
                secondaryContactIds: [2]
            },
        })
        expect(findAllMock).toHaveBeenCalledTimes(2)
        expect(findAllMock).toHaveBeenNthCalledWith(1, {
            where: {
                [Op.or]: [
                    {
                        email: 'george@hillvalley.edu',
                    },
                    {
                        phone_number: '717171',
                    }
                ]
            },
        })
        expect(findAllMock).toHaveBeenNthCalledWith(2, {
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { id: [] },
                            { linkedId: [1, 2] }
                        ],
                    },
                    {
                        [Op.or]: [
                            { id: { [Op.notIn]: [1, 2] } },
                            { linkedId: { [Op.notIn]: [] } },
                        ],
                    },
                ],
            }
        })
        expect(updateMock).toHaveBeenCalledTimes(1)
        expect(updateMock).toHaveBeenCalledWith(
            {
                linkPrecedence: LinkPrecedence.Secondary,
                linkedId: 1
            },
            {
                where: {
                    id: [2],
                }
            }
        )
    })
})