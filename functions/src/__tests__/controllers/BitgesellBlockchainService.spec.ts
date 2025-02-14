import axios from 'axios'
import { bgl } from '../..'

const { createStagingServer, headers } = require('./setup')
import { Server } from 'http'
import * as dotenv from 'dotenv'

const TIMEOUT_MS = 10_000

jest.setTimeout(TIMEOUT_MS)

describe('Bitgesell Tests', () => {
  let app: Server
  const port = 3001
  const bglAddress = 'bgl1qh3tsz3a7l3m49xaq4xcdx8aefthchuqagmspcn'
  let privateKey: string
  let seedphrase: string

  beforeAll(() => {
    dotenv.config()
    privateKey = process.env.BGL_PRIVATE_KEY as string
    seedphrase = process.env.BGL_SEEDPHRASE as string
    app = createStagingServer(bgl, port) as Server
  })

  afterAll(() => app.close())

  const routes = {
    wallet: {
      create: `http://127.0.0.1:${port}/wallet/create`,
      update: `http://127.0.0.1:${port}/wallet/update`,
      import: `http://127.0.0.1:${port}/wallet/new/update`,
      balance: `http://127.0.0.1:${port}/wallet/balance/get`,
      history: `http://127.0.0.1:${port}/tx`,
      send: `http://127.0.0.1:${port}/wallet/update`,
    },
  }

  // 1. Wallet
  it('creates a Bitgesell Wallet', async () => {
    const { data: wallet } = await axios.post(routes.wallet.create, { headers })
    expect(wallet).toHaveProperty('accounts')
    expect(wallet.accounts).toBeDefined()
  })

  // 2. Transaction -history
  it('fetches transactions for an address', async () => {
    const endpoint = `${routes.wallet.history}/${bglAddress}`
    const { data: accountTxHistory } = await axios.get(endpoint)
    expect(accountTxHistory).toHaveProperty('tx')
    expect(accountTxHistory.success).toBe(true)
    expect(accountTxHistory.tx).toBeDefined()
  })

  // 3. Transaction - empty history
  it('should return an empty array for an account with no tx activity', async () => {
    const _bglAddress = 'bgl1qdz5cqn8hqkg2a8p7pwsgftvh9ug5t07s0pp60w'
    const endpoint = `${routes.wallet.history}/${_bglAddress}`
    const { data: accountTxHistory } = await axios.get(endpoint)
    expect(accountTxHistory.tx).toHaveLength(0)
  })

  // 4. Wallet balance: no activity
  it('fetches account balance object for a BGL address with transaction activity', async () => {
    const body = { privateKey: privateKey }
    const { data: balanceObject } = await axios.post(routes.wallet.balance, {
      headers,
      body: JSON.stringify(body),
    })
    expect(balanceObject.balance).not.toBe(null)
  })

  // 5. Wallet balance activity
  it('fetches account balance object for a BGL address with transaction activity', async () => {
    const body = { privateKey: privateKey }
    const { data: balanceObject } = await axios.post(routes.wallet.balance, {
      headers,
      body: JSON.stringify(body),
    })
    expect(balanceObject.balance).not.toBe(null)
  })

  it('should submit a transaction with appropriate fields', async () => {
    const txObject = {
      to: 'bgl1qdz5cqn8hqkg2a8p7pwsgftvh9ug5t07s0pp60w',
      from: bglAddress,
      amount: 1, // 1 bgl
      privateKey: privateKey,
      fee: 0.0001,
    }

    const { data } = await axios.post(routes.wallet.send, { headers: headers, body: txObject })
    expect(data.txHash).toBeDefined()
  })

  // Wallet - update: privateKey
  it('should import existing wallet from privateKey/seedphrase', async () => {
    const { data } = await axios.post(routes.wallet.update, {
      headers,
      body: {
        seedOrPkey: seedphrase,
      },
    })
    expect(data.accounts).toBeDefined()
  })

  // Wallet - update: privateKey
  it('should import existing wallet from privateKey/seedphrase', async () => {
    const { data } = await axios.post(routes.wallet.update, {
      headers,
      body: {
        seedOrPkey: privateKey,
      },
    })
    expect(data).toBeDefined()
  })
})
