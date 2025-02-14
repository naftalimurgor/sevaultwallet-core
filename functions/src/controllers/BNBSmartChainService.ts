import { Request, Response } from 'express'

import axios from 'axios'
import { ethers } from 'ethers'
import Web3 from 'web3'

export interface IEVMBlockchainService {
  rpcUrl: string
  feePercentage: number
  unit: 'BNB' | 'ETH'
  chainName: 'Ethereum' | 'BNB Smart Chain'
  chainId: string | number
  feeAddress: string
  usdtContractAddress: string
  usdtFeeAddress: string
}

export interface IAccount {
  address: string
  privateKey: string
  index: number
  balance: {
    balance: number
    usd: number
  }
  assets: {
    usdt: number
    wbgl: {
      balance: number
      usd: number
    }
    // add any additional assets as needed
  }
}

export interface IEVMTransactionReceipt {
  blockHash: string
  blockNumber: number
  contractAddress: string | null
  cumulativeGasUsed: number
  effectiveGasPrice: string
  from: string
  gasUsed: number
  logs: Array<any>
  logsBloom: string
  status: boolean
  to: string
  transactionHash: string
  transactionIndex: number
  type: string
}

const DEBUG = false

const config = {
  rpcUrl: DEBUG ? 'https://bsc-testnet.blockpi.network/v1/rpc/public' : 'https://rpc.ankr.com/bsc',
  unit: 'BNB',
  chainName: 'BNB Smart Chain',
  chainId: DEBUG ? 97 : 56, // '0x38', // 56 decimal
  feeAddress: DEBUG
    ? '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684'
    : '0x05703ebb0cb843cd392e22866a759b04ddcd0787',
  usdtContractAddress: DEBUG
    ? '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
    : '0x55d398326f99059fF775485246999027B3197955',
  wbglAddress: DEBUG ? '' : '0x2ba64efb7a4ec8983e22a49c81fa216ac33f383a',
}

const web3 = new Web3(config.rpcUrl) // replace with an highly available low latency rpc
const USDT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint8', name: 'decimals', type: 'uint8' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'EIP712_REVISION',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'subtractedValue', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'addedValue', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'value', type: 'uint256' }],
    name: 'mint',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const usdtContract = new web3.eth.Contract(USDT_ABI, config.usdtContractAddress)

export const BNBAccountBalanceHandler = async (req: Request, res: Response) => {
  const { privateKey } = req.body
  try {
    const wallet = new ethers.Wallet(privateKey, provider)
    const balance = await wallet.getBalance()
    const usdPrice = await _getPriceUSD()

    const accountBalanceEther = ethers.utils.formatEther(balance)
    const accountBalanceUSD = usdPrice * Number(accountBalanceEther)
    res.json({ balance: { balance: Number(accountBalanceEther), usd: accountBalanceUSD } })
  } catch (error) {
    res.json({ balance: null, error: `${error}` })
  }
}

export const BUSDTBalanceHandler = async (req: Request, res: Response) => {
  const { address } = req.body

  try {
    const balance = await usdtContract.methods.balanceOf(address).call()
    const usd = DEBUG ? balance / 10 ** 18 : balance / 10 ** 6
    res.json({ balance: { usd: usd } })
  } catch (error) {
    res.status(400).json({ balance: null, error: `${error}` })
  }
}

export const createHdWalletHandler = async (req: Request, res: Response) => {
  const mnemonic = ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16))
  const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
  const firstAccount = hdNode.derivePath("m/44'/60'/0'/0/0")

  const wallet = new ethers.Wallet(firstAccount.privateKey)

  const account: IAccount = {
    address: wallet.address,
    privateKey: firstAccount.privateKey,
    index: 0,
    balance: {
      balance: 0,
      usd: 0,
    },
    assets: {
      usdt: 0,
      wbgl: {
        balance: 0,
        usd: 0,
      },
      // convert WBGL to dollar for mobile app formatting and aesthetics
    },
  }

  try {
    const accounts = []
    accounts.push(account)
    res.json({ accounts: accounts, success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: `${error}` })
  }
}

//Feat: import new wallet from privateKey - Eth/BNB
// balance in USD, use dao rates
// reactive homepage on send/recieve etc- refresh balances mechanism

export const createTestWalletFromPrivKeyHandler = async (req: Request, res: Response) => {
  try {
    const accounts = []

    // get this from import wallet functionality - merge the array and set index - last steps
    const privateKey = '79018676be44d82cc586f44e38448bb475dee51e399a28f0e8cab1caa81083ed'
    const evmProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    const wallet = new ethers.Wallet(privateKey, evmProvider)
    const address = await wallet.getAddress()
    const balance = await wallet.getBalance()
    const usdPrice = await _getPriceUSD()

    const accountBalanceEther = ethers.utils.formatEther(balance)
    const accountBalanceUSD = usdPrice * Number(accountBalanceEther)

    const account = {
      address: address,
      privateKey: privateKey,
      index: 0,
      balance: {
        balance: Number(accountBalanceEther),
        usd: accountBalanceUSD,
      },

      assets: {
        wbgl: 0, // use sepolia to test
        usdt: 0, // use sepolia usdt to test
        wbglUSD: 0, // piggy back on Bitgesell and convert the token price to usd wbglbalance * bglPriceUSD
      },
    }
    accounts.push(account)
    res.json({ accounts: accounts, success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: `${error}` })
  }
}

export const sendBNBHandler = async (req: Request, res: Response) => {
  const { privateKey, to, amount } = req.body

  if (!privateKey || !to || !amount)
    res.status(400).send('Missing required fields: privateKey, to, amount')
  if (!web3.utils.isAddress(to)) res.status(400).send('Invalid recipient address')

  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const address = account.address

  await _sendTransactionWithFee(address, privateKey, to, String(amount), res)
}

export const sendV1CommissionBNBHandler = async (req: Request, res: Response) => {
  const { privateKey, to, amount } = req.body

  if (!privateKey || !to || !amount)
    res.status(400).send('Missing required fields: privateKey, to, amount')
  if (!web3.utils.isAddress(to)) res.status(400).send('Invalid recipient address')

  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const address = account.address

  await _sendTransactionWithFee(address, privateKey, to, String(amount), res)
}

export const sendBUSDT = async (req: Request, res: Response) => {
  const { amount, to, privateKey } = req.body

  if (!amount || !to || !privateKey)
    res
      .status(400)
      .send({ success: false, error: 'Amount, recipient, and privateKey are required' })
  if (!web3.utils.isAddress(to))
    res.status(400).send({ success: false, error: 'Invalid recipient address' })

  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)

    const data = usdtContract.methods
      .transfer(to, web3.utils.toWei(String(amount), DEBUG ? 'ether' : 'mwei'))
      .encodeABI()

    const txCount = await web3.eth.getTransactionCount(account.address, 'pending')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { baseFeePerGas } = await web3.eth.getBlock('pending')
    const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei') // Example priority fee

    const gasLimit = await web3.eth.estimateGas({
      from: account.address,
      to: config.usdtContractAddress,
      data,
    })

    // Calculate effective gas price and estimated fee in Wei
    const maxFeePerGas = web3.utils.toBN(baseFeePerGas).add(web3.utils.toBN(maxPriorityFeePerGas))
    const estimatedFeeInWei = maxFeePerGas.mul(web3.utils.toBN(gasLimit))
    const estimatedFeeInEth = web3.utils.fromWei(estimatedFeeInWei, 'ether')

    const tx = {
      from: account.address,
      to: config.usdtContractAddress,
      data,
      nonce: txCount,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: gasLimit, // Include the estimated gas limit
      type: 2,
      // chainId: 1,
    }

    const signedTx = await account.signTransaction(tx)
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction as string)

    res.status(200).send({
      message: 'Transaction successful',
      txHash: receipt.transactionHash,
      fee: estimatedFeeInEth, // Include the estimated fee in the response
      success: true,
    })
  } catch (error) {
    res.status(500).send({ message: 'Transaction failed', error: `${error}`, success: false })
  }
}

export const sendV1CommissionBUSDT = async (req: Request, res: Response) => {
  const { amount, to, privateKey } = req.body
  const feeAddress = '0x05703ebb0cb843cd392e22866a759b04ddcd0787'

  if (!amount || !to || !privateKey) {
    res.json({ success: false, error: 'Amount, recipient, and privateKey are required' })
  }
  if (!web3.utils.isAddress(to)) {
    res.json({ success: false, error: 'Invalid recipient address' })
  }

  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore

    const contract = new web3.eth.Contract(USDT_ABI, config.usdtContractAddress)

    // Calculate 2% commission
    const totalAmountInWei = web3.utils.toWei(String(amount), 'mwei') // USDT uses 6 decimals (mwei)
    const commissionInWei = web3.utils
      .toBN(totalAmountInWei)
      .mul(web3.utils.toBN(2))
      .div(web3.utils.toBN(100)) // 2% of the amount
    const amountAfterFeeInWei = web3.utils.toBN(totalAmountInWei).sub(commissionInWei) // Amount to send to recipient

    if (amountAfterFeeInWei.lte(web3.utils.toBN(0))) {
      res.json({ success: false, error: 'Amount too low to deduct fee' })
    }

    // Create transfer data for recipient
    const dataRecipient = contract.methods.transfer(to, amountAfterFeeInWei).encodeABI()

    // Create transfer data for fee
    const dataFee = contract.methods.transfer(feeAddress, commissionInWei).encodeABI()

    // Get transaction count
    const txCount = await web3.eth.getTransactionCount(account.address, 'pending')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { baseFeePerGas } = await web3.eth.getBlock('pending')
    const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei') // Example priority fee
    const maxFeePerGas = web3.utils.toBN(baseFeePerGas).add(web3.utils.toBN(maxPriorityFeePerGas))

    // Estimate gas for recipient transfer
    const gasLimitRecipient = await web3.eth.estimateGas({
      from: account.address,
      to: config.usdtContractAddress,
      data: dataRecipient,
    })

    // Estimate gas for fee transfer
    const gasLimitFee = await web3.eth.estimateGas({
      from: account.address,
      to: config.usdtContractAddress,
      data: dataFee,
    })

    // Create transactions
    const txRecipient = {
      from: account.address,
      to: config.usdtContractAddress,
      data: dataRecipient,
      nonce: txCount,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: gasLimitRecipient,
      type: 2,
    }

    const txFee = {
      from: account.address,
      to: config.usdtContractAddress,
      data: dataFee,
      nonce: txCount + 1,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: gasLimitFee,
      type: 2,
    }

    // Sign and send transactions
    const signedTxRecipient = await account.signTransaction(txRecipient)
    const receiptRecipient = await web3.eth.sendSignedTransaction(
      signedTxRecipient.rawTransaction as string,
    )

    const signedTxFee = await account.signTransaction(txFee)
    const receiptFee = await web3.eth.sendSignedTransaction(signedTxFee.rawTransaction as string)

    res.json({
      message: 'Transaction successful',
      recipientTransactionHash: receiptRecipient.transactionHash,
      feeTransactionHash: receiptFee.transactionHash,
      commission: web3.utils.fromWei(commissionInWei, 'mwei'),
      success: true,
    })
  } catch (error) {
    res.json({ message: 'Transaction failed', error: `${error}`, success: false })
  }
}

/// BEGIN PRIVATE METHODS
async function _getPriceUSD() {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
  const result = await axios.get(url)
  return result.data.binancecoin.usd
}

export async function sendTransaction(
  senderAddress: string,
  privateKey: string,
  recipientAddress: string,
  amountInEther: string,
  res: Response,
) {
  const amountInWei = web3.utils.toWei(amountInEther, 'ether')
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)

  const nonce = await web3.eth.getTransactionCount(senderAddress)
  const gasPrice = await web3.eth.getGasPrice() // This returns the current gas price in Wei
  const latestBlock = await web3.eth.getBlock('latest')

  const gasLimit = await web3.eth.estimateGas({
    to: recipientAddress,
    value: amountInWei,
  })

  const tx = {
    from: senderAddress,
    to: recipientAddress,
    value: amountInWei,
    gas: gasLimit,
    nonce: nonce,
    type: 2, // EIP-1559
    maxFeePerGas: web3.utils.toHex(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      web3.utils.toBN(latestBlock.baseFeePerGas).add(web3.utils.toBN(gasPrice)),
    ),
    maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toBN(gasPrice)),
  }

  const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey)

  try {
    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction as string)
    const balanceInWei = await web3.eth.getBalance(account.address)
    const balanceInEther = web3.utils.fromWei(balanceInWei, 'ether')

    res.json({
      amount: amountInEther,
      blockHash: result.blockHash,
      blockNumber: result.blockNumber,
      success: result.status,
      to: recipientAddress,
      from: account.address,
      balance: balanceInEther,
      transactionHash: result.transactionHash,
    })
  } catch (error) {
    res.json({ succees: false, error: `${error}` })
    console.error('Transaction failed:', error)
  }
}

async function _sendTransactionWithFee(
  senderAddress: string,
  privateKey: string,
  recipientAddress: string,
  amountInEther: string,
  res: Response,
) {
  const feeAddress = '0x05703ebb0cb843cd392e22866a759b04ddcd0787' // Replace with the actual fee address

  const amountInWei = web3.utils.toWei(amountInEther, 'ether')
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)

  // Calculate the commission (1.8%)
  const commissionInWei = web3.utils
    .toBN(amountInWei)
    .mul(web3.utils.toBN(18))
    .div(web3.utils.toBN(1000)) // 1.8% of the amount
  const amountAfterFeeInWei = web3.utils.toBN(amountInWei).sub(commissionInWei) // Amount to send to the recipient

  if (amountAfterFeeInWei.lte(web3.utils.toBN(0))) {
    res.json({ succeed: false, error: 'Amount too low to deduct fee' })
  }

  const nonce = await web3.eth.getTransactionCount(senderAddress)
  const gasPrice = await web3.eth.getGasPrice()
  const latestBlock = await web3.eth.getBlock('latest')

  // Estimate gas for recipient transfer
  const gasLimitRecipient = await web3.eth.estimateGas({
    to: recipientAddress,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    value: amountAfterFeeInWei,
  })

  // Estimate gas for fee transfer
  const gasLimitFee = await web3.eth.estimateGas({
    to: feeAddress,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    value: commissionInWei,
  })

  // Create and sign transactions
  const txRecipient = {
    from: senderAddress,
    to: recipientAddress,
    value: amountAfterFeeInWei.toString(),
    gas: gasLimitRecipient,
    nonce: nonce,
    type: 2, // EIP-1559
    maxFeePerGas: web3.utils.toHex(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore

      web3.utils.toBN(latestBlock.baseFeePerGas).add(web3.utils.toBN(gasPrice)),
    ),
    maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toBN(gasPrice)),
  }

  const txFee = {
    from: senderAddress,
    to: feeAddress,
    value: commissionInWei.toString(),
    gas: gasLimitFee,
    nonce: nonce + 1,
    type: 2, // EIP-1559
    maxFeePerGas: web3.utils.toHex(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      web3.utils.toBN(latestBlock.baseFeePerGas).add(web3.utils.toBN(gasPrice)),
    ),
    maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toBN(gasPrice)),
  }

  try {
    // Sign transactions
    const signedTxRecipient = await web3.eth.accounts.signTransaction(txRecipient, privateKey)
    const signedTxFee = await web3.eth.accounts.signTransaction(txFee, privateKey)

    // Send recipient transaction
    const resultRecipient = await web3.eth.sendSignedTransaction(
      signedTxRecipient.rawTransaction as string,
    )

    // Send fee transaction
    const resultFee = await web3.eth.sendSignedTransaction(signedTxFee.rawTransaction as string)

    res.json({
      amount: amountInEther,
      recipientTransactionHash: resultRecipient.transactionHash,
      feeTransactionHash: resultFee.transactionHash,
      commission: web3.utils.fromWei(commissionInWei, 'ether'),
      recipient: recipientAddress,
      feeAddress: feeAddress,
      from: account.address,
      success: true,
    })
  } catch (error) {
    res.json({ success: false, error: `${error}` })
  }
}
