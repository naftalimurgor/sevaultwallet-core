import axios from 'axios'
import { Request, Response } from 'express'
import fetch from 'node-fetch'
import { BGLWallet, IBglWalletObject } from '../classes/Bglwallet.class'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsbgl = require('@naftalimurgor/jsbgl')

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import sb = require('satoshi-bitcoin')

/// CONSTANTS
const BGL_RPC_NODE = 'https://rpc.bglwallet.io'
const DEFAULT_BGL_FEE = sb.toSatoshi(0.0001) // 10,000 satoshi
/// END CONSTANTS

/// Types
interface IBGlTxSuccessResult {
  result: string
  error: null
  id: 'string'
}

interface IBGLTransaction {
  from: string
  to: string
  amount: number
  privateKey: string
  fee: number
}

export interface BGLPriceInfo {
  status: Status
  data: Data
}

interface Data {
  '5667': _5667
}

interface _5667 {
  id: number
  name: string
  symbol: string
  slug: string
  num_market_pairs: number
  date_added: string
  tags: any[]
  max_supply: number
  circulating_supply: number
  total_supply: number
  is_active: number
  cmc_rank: number
  is_fiat: number
  last_updated: string
  quote: Quote
}

interface Quote {
  '1': _1 // volume
  '2781': _1 // volume
}

interface _1 {
  price: number
  volume_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  market_cap: number
  last_updated: string
}

interface Status {
  timestamp: string
  error_code: number
  error_message?: any
  elapsed: number
}

interface TxInfo {
  data: Data
  time: number
}

interface Data {
  page: number
  limit: number
  pages: number
  list: List[]
}

interface List {
  regtest: boolean
  segwit: boolean
  rbf: boolean
  txId: string
  version: number
  size: number
  vSize: number
  bSize: number
  lockTime: number
  confirmations: number
  blockTime: number
  blockIndex: number
  coinbase: boolean
  fee: number
  data?: any
  amount: number
  weight: number
  blockHeight: number
  timestamp: number
  inputsAmount: number
  inputAddressCount: number
  outAddressCount: number
  inputsCount: number
  outsCount: number
  outputsAmount: number
  addressReceived: number
  addressOuts: number
  addressSent: number
  addressInputs: number
}
/// END TYPES

export interface IUnconfirmedBGLTransaction {
  amount: number
  bSize: number
  blockTime: number | null
  coinbase: boolean
  data: string | null
  fee: number
  inputAddressCount: number
  inputsAmount: number
  inputsCount: number
  lockTime: number
  mempoolRank: number
  outAddressCount: number
  outputsAmount: number
  outsCount: number
  rbf: boolean
  regtest: boolean
  segwit: boolean
  size: number
  timestamp: number
  txId: string
  vSize: number
  version: number
  weight: number
}

const bitgesellExplorerApi = 'https://api.bitaps.com/bgl/v1/blockchain'

type UnconfirmedBGLTransactions = Array<IUnconfirmedBGLTransaction>

/// BEGIN ROUTE HANDLERS
// 1.
export const BGLaccountBalanceHandler = async (req: Request, res: Response) => {
  const { privateKey } = req.body

  try {
    await jsbgl.asyncInit(globalThis)
    const hdWallet = new BGLWallet({ bglPrivateKeyOrSeed: privateKey })
    const wallet = (await hdWallet.createWallet()) as IBglWalletObject

    const [priceInfo, balanceInfo] = await Promise.all([
      _getBGLPriceChange(),
      _getBglAddressBalance(wallet.address),
    ])
    const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balanceInfo.balance)
    res.json({ balance: { usd: balanceUSD, balance: sb.toBitcoin(balanceInfo.balance) } })
  } catch (error) {
    res.json({ balance: null, error: `${error}` })
  }
}

export interface Tx {
  id: number
  tx_id: string
  timestamp: number
  amount: number
  confirmations: number
  block_height: number
  rbf: boolean
  coinbase: boolean
  fee: number
  // BSC + ETH
  from?: string
  to?: string
}

export const _getUnConfirmed = async (address: string) => {
  const url = `${bitgesellExplorerApi}/address/unconfirmed/transactions/${address}`
  try {
    const results = await axios.get(url)

    const txes = results.data.data.list as UnconfirmedBGLTransactions
    if (txes.length == 0) return txes

    const transactions = txes.map((tx, index) => {
      return {
        id: index,
        amount: sb.toBitcoin(tx.amount),
        tx_id: Math.floor(Math.random()) * 10 + address,
        timestamp: tx.timestamp,
        block_height: 'pending',
        coinbase: tx.coinbase,
        fee: tx.fee,
        from: address,
        confirmations: 'pending',
        rbf: tx.rbf,
      }
    })
    return transactions
  } catch (error) {
    return []
  }
}

const createBitgesellAccountsHandler = async (req: Request, res: Response) => {
  // @todo: encrypt mnemonic with password
  // hdwallet first then all indexes second, balances third
  try {
    const mnemonic = await _createHdWallet(0)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const hdWallet = new globalThis.Wallet({ from: mnemonic })

    const accounts = []

    for (let i = 0; i <= 9; i++) {
      const account = hdWallet.getAddress(i)
      const { address } = account

      const [priceInfo, balanceData] = await Promise.all([
        _getBGLPriceChange(),
        _getBglAddressBalance([address]),
      ])
      const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balanceData.balance)

      accounts.push({
        ...account,
        index: i,
        balance: { balance: balanceData.balance, usd: balanceUSD },
      })
    }

    return res.send({ accounts: accounts, mnemonic: mnemonic })
  } catch (error) {
    return res.status(400).json({ msg: `${error}`, sucess: false })
  }
}

const dashboardHandler = async (req: Request, res: Response) => {
  const { addresses, address } = req.body
  try {
    const [balance, bglCoinInfo, addressUtxoInfo, addressInfo, addressUtxo] = await Promise.all([
      _getAddressesBalance(addresses), // @todo: add single address
      _getCoinInfo(),
      _getAddressUnconfirmedInfo(address),
      _getAddressInfo(address),
      _getAddressUtxo(addresses),
    ])

    const [priceInfo] = await Promise.all([_getBGLPriceChange()])

    const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balance.data[address].confirmed)
    return res.json({
      balanceSatoshi: balance.data[address].confirmed,

      balanceBGL: sb.toBitcoin(balance.data[address].confirmed),
      balanceUSD: balanceUSD,
      bglInfo: bglCoinInfo,
      bglPriceUSD: priceInfo.bglPriceUSD,
      utxo: addressUtxo,
      accountTx: {},
      addressInfo,
      addressUtxo,
      addressUtxoInfo,
      volumeInfo: priceInfo.volumeInfo,
      percentage_7d: priceInfo.percentage_7d,
    })
  } catch (error) {
    return res.json({ error: `${error}` })
  }
}

// TODO: adapt to allow: BSC, Ethereum addresses to have unified endpoint for transactions
const txHistoryHandler = async (req: Request, res: Response) => {
  const address = req.params.address
  // const network = req.params.network // bgl, bsc, ethereum - come to this after fixing ethereum

  try {
    // const unconfirmedTx = await _getUnConfirmed(address)

    const txData = []
    const result = await fetch(
      `https://api.bitaps.com/bgl/v1/blockchain/address/transactions/${address}`,
    )

    const txInfor = (await result.json()) as TxInfo
    let count = 0

    for (const key in txInfor.data.list) {
      const value = txInfor.data.list[key]
      count++

      txData.push({
        id: count,
        // to?
        // from?
        tx_id: value.txId,
        timestamp: value.timestamp,
        amount: sb.toBitcoin(value.amount),
        // amountUSD: await _convertToUsd(value.amount),
        confirmations: value.confirmations ? value.confirmations : 'pending',
        block_height: value.blockHeight ? value.blockHeight : 'pending',
        rbf: value.rbf,
        coinbase: value.coinbase,
        fee: sb.toBitcoin(value.fee),
      })
    }
    // txData.push(unconfirmedTx)
    return res.json({ success: true, tx: txData })
  } catch (error) {
    return res.json({ error: `${error}`, success: false })
  }
}

const bglTxBuilderHandler = async (req: Request, res: Response) => {
  const { to, from, amount, privateKey, fee } = req.body

  if (!to && !from && !amount && !privateKey && !fee)
    return res.json({ msg: 'Failed: Invalid Request', success: false })

  const txFee = req.body.fee || DEFAULT_BGL_FEE

  try {
    await jsbgl.asyncInit(globalThis)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!globalThis.isAddressValid(to))
      return res.status(400).json({ success: false, error: 'Invalid recpient address' })
    const { txObject, balance } = await _buildTransactionObject({
      from,
      to,
      privateKey: privateKey,
      fee: txFee,
      amount,
    })

    const txResult = (await _broadcastbglTransaction(txObject, res)) as IBGlTxSuccessResult
    const [priceInfo] = await Promise.all([_getBGLPriceChange()])
    const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balance)
    const balanceBGL = sb.toBitcoin(balance)
    return res.json({
      txHash: txResult.result,
      rpc_result: txResult,
      success: txResult.error === null ? true : false,
      balance: balanceBGL,
      balanceUSD: balanceUSD,
    })
  } catch (error) {
    return res.json({ error: `${error}`, success: false })
  }
}

/// ImportWalletHandler
const importWalletHandler = async (req: Request, res: Response) => {
  const { mnemonic } = req.body

  if (!mnemonic) return res.json({ sucess: 'false', error: 'missing seedphrase' })

  const wallet = await _importFromMnemonic(mnemonic, res)
  return res.json({ new_address: wallet, success: true })
}

/// @todo: allow
async function importFromPkeyOrSeedPhraseHandler(req: Request, res: Response) {
  try {
    await jsbgl.asyncInit(globalThis)
    const seedOrPkey: string = req.body.seedOrPkey
    if (!seedOrPkey) return res.status(400).json({ msg: 'Failed: Invalid Request' })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore

    if (globalThis.isMnemonicCheckSumValid(seedOrPkey)) {
      const hdWallet = new BGLWallet({ bglPrivateKeyOrSeed: seedOrPkey })

      const accounts = []
      const index = 0

      const account = (await hdWallet.createWallet()) as IBglWalletObject
      const { address } = account

      const [priceInfo, balanceInfo] = await Promise.all([
        _getBGLPriceChange(),
        _getBglAddressBalance(address),
      ])
      const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balanceInfo.balance)
      accounts.push({
        address,
        index: index,
        privateKey: account.privateKey,
        mnemonic: seedOrPkey,
        balance: { balance: sb.toBitcoin(balanceInfo.balance), usd: balanceUSD },
      })

      return res.json({ accounts: accounts, success: true })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } else if (globalThis.isWifValid(seedOrPkey)) {
      const hdWallet = new BGLWallet({ bglPrivateKeyOrSeed: seedOrPkey })
      const wallet = (await hdWallet.createWallet()) as IBglWalletObject
      const accounts = []

      const [priceInfo, balanceInfo] = await Promise.all([
        _getBGLPriceChange(),
        _getBglAddressBalance(wallet.address),
      ])
      const balanceUSD = priceInfo.bglPriceUSD * sb.toBitcoin(balanceInfo.balance)
      accounts.push({
        address: wallet.address,
        index: 0,
        privateKey: seedOrPkey,
        balance: { balance: sb.toBitcoin(balanceInfo.balance), usd: balanceUSD },
        mnemonic: null,
      })

      return res.json({ accounts: accounts, success: true })
    } else {
      return res.json({ error: 'Invalid seed words/privateKeys', success: false })
    }
  } catch (error) {
    return res.json({ error: `${error}` }).status(500)
  }
} /// End ImportWalletHandler

/// END ROUTE HANLDERS

/// Builds a signed transaction in HEX encoded format
async function _buildTransactionObject({ from, to, fee, privateKey, amount }: IBGLTransaction) {
  await jsbgl.asyncInit(globalThis)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const txObject = new globalThis.Transaction()

  const utxosData = await _fetchAddressUTxos(from)
  if (!utxosData) throw new Error(`Failed to fetch utxo output for ${from}`)

  const { data: utxos } = utxosData
  const data = await _getBglAddressBalance(from)

  const { balance } = data
  // already converted to Sats

  const newBalance = balance - amount - fee

  if (utxos.length) {
    for (const key in utxos) {
      const utxo = utxos[key]
      txObject.addInput({
        txId: utxo.txId,
        vOut: utxo.vOut,
        address: from,
      })
    }

    txObject.addOutput({
      value: amount,
      address: to,
    })

    if (newBalance > 0) {
      txObject.addOutput({
        value: newBalance,
        address: from,
      })
    }

    let utxoCount = 0
    for (const key in utxos) {
      const utxo = utxos[key]
      txObject.signInput(utxoCount, {
        privateKey: privateKey,
        value: utxo.amount,
      })

      utxoCount++
    }

    const newTx = txObject.serialize()
    return { txObject: newTx, balance: newBalance }
  }
  return { error: 'error: No unspent utxos found' }
}

async function _getBglAddressBalance(bglAddress: string | Array<string>) {
  const bglAPIV1Endpoint = 'https://api.bitaps.com/bgl/v1/blockchain'
  try {
    const response = await fetch(`${bglAPIV1Endpoint}/address/state/${bglAddress}`)
    const result = await response.json()

    return result.data
  } catch (error) {
    console.error(error)
  }
}

async function _fetchAddressUTxos(bglAddress: string) {
  const bglAPIV1Endpoint = 'https://api.bitaps.com/bgl/v1/blockchain'
  const bglAddressUTXOEndpoint = `${bglAPIV1Endpoint}/address/utxo/${bglAddress}`

  try {
    const res = await fetch(bglAddressUTXOEndpoint)
    const utxo = await res.json()
    return utxo
  } catch (error) {
    console.error(error)
    return
  }
}

async function _broadcastbglTransaction(txObject: Record<string, string>, res: Response) {
  const url = new URL(BGL_RPC_NODE)

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: `{"jsonrpc":"1.0","id":"curltext","method":"sendrawtransaction","params":["${txObject}"]}`,
  }

  try {
    const txResponse = await fetch(url.origin, {
      body: payload.body,
      headers: payload.headers,
      method: 'POST',
    })
    const result = await txResponse.json()
    return result as IBGlTxSuccessResult
  } catch (error) {
    return res.json({ msg: 'Failed', error: `${error}` })
  }
}

async function _importFromMnemonic(mnemonic: string, res: Response) {
  try {
    await jsbgl.asyncInit(globalThis)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const entropy = globalThis.mnemonicToEntropy(mnemonic)
    const newAddress = _generateAddress(entropy)
    return newAddress
  } catch (error) {
    return res.json({ success: false, error: `${error}` })
  }
}

/// END ImportWalletHandler
/// END API Handlers

/// WALLET logic- BITGESELL - Begin Local functions
const _createHdWallet = async (index: number) => {
  await jsbgl.asyncInit(globalThis)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const entropy = globalThis.generateEntropy()
  const account = await _generateAddress(entropy)

  return account
} /// End WALLET logic- BITGESELL

const importAccountHandler = async (req: Request, res: Response) => {
  await jsbgl.asyncInit(globalThis)

  const { seedphrase, index } = req.body

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const wallet = new globalThis.Wallet({ from: seedphrase })
    const address = wallet.getAddress(index)
    return res.json({
      mnemonic: seedphrase,
      address: address.address,
      privateKey: address.privateKey,
      index: index,
      success: true,
    })
  } catch (error) {
    return res.json({ error: `${error}`, success: false })
  }
}

/// Bitgesell explorer calls

async function _generateAddress(entropy: number) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mnemonic = globalThis.entropyToMnemonic(entropy)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const wallet = new globalThis.Wallet({ from: mnemonic })
  // const address = wallet.getAddress(indexAddress);
  return mnemonic
} //// END of wallet logic

const _getBGLPriceChange = async () => {
  // const url = ``;

  // const res = await fetch(url)
  // const info = await res.json() as BGLPriceInfo

  return {
    bglPriceUSD: 0.05632,
    volumeInfo: 350,
    percentage_7d: 1.7,
  }
}
/// Bitaps API Block explorer functions
const explorerApi = 'https://api.bitaps.com/bgl/v1/blockchain'

async function _fetch(url: string) {
  try {
    const res = await fetch(url)
    const result = await res.json()
    return result
  } catch (error) {
    return null
  }
}

async function _getAddressInfo(address: Array<string>) {
  const url = `${explorerApi}/address/transactions/${address}`
  const result = await _fetch(url)
  return result
}

// fetch this client side(and merged with confirmed) to show pending transaction inside the explorer on each list load/refresh = state = confirmed + unconfirmed
async function _getAddressUnconfirmedInfo(address: Array<string>) {
  const url = `${explorerApi}/address/unconfirmed/transactions/${address}`
  const res = await _fetch(url)
  return res
}

async function _getAddressesBalance(addresses: Array<string>) {
  const url = `${explorerApi}/addresses/state/by/address?list=${addresses.join(',')}`
  const result = await _fetch(url)
  return result
}

async function _getAddressUtxo(addresses: Array<string>) {
  const url = `${explorerApi}/addresses/state/by/address?list=${addresses.join(',')}`
  const utxo = await _fetch(url)
  return utxo
}

async function _getCoinInfo() {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitgesell&vs_currencies=usd&include_24hr_change=true'
  const coinInfo = _fetch(url)
  return coinInfo
}

export {
  bglTxBuilderHandler,
  createBitgesellAccountsHandler,
  dashboardHandler,
  importAccountHandler,
  importFromPkeyOrSeedPhraseHandler,
  importWalletHandler,
  txHistoryHandler,
}
