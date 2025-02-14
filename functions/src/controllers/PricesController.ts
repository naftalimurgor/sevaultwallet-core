import { Response, Request } from 'express'

export const allAssetsPricesHandler = async (req: Request, res: Response) => {
  res.json('ok') // mixbag of dao pricing and everything for the prices here
}
