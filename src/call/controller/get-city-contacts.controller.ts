import { Request, Response } from 'express'
import { ContactService } from '../service/contact.service'
import { ContactDTO } from '../types/contact-dto'

export const getCityContactsController = ({ contactService }: { contactService: ContactService }) =>
  async (req: Request, res: Response) => {
    const city = req.query.city as string
    const limit = Number(req.query.limit)
    const contacts:ContactDTO[] = await contactService.getCityContacts(city, limit)
    return res.status(200).json({ contacts })
  }
