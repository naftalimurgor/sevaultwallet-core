/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Response, Request } from 'express'
import { _getBGLPriceUSD } from './EthereumBlockchainService'
import axios from 'axios'
import { IBSCTransaction } from './EvmExplorerService'

import Web3 from 'web3'
const web3Bsc = new Web3('https://rpc.ankr.com/bsc')
const web3Eth = new Web3('https://mainnet.infura.io/v3/04c3f6b3201b41ef8a15e7e08a7c730e')
import functions from 'firebase-functions'

const WBGL_PROXY_ADRESS_BNB = '0x2bA64EFB7A4Ec8983E22A49c81fa216AC33f383A'.toLowerCase()
const WBGL_PROXY_ADRESS_ETH = '0x2bA64EFB7A4Ec8983E22A49c81fa216AC33f383A'.toLowerCase()

const WBGL_IMPLEMENTATION_ABI = [
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
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'newAdminRole', type: 'bytes32' },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'RoleRevoked',
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
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MINTER_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PAUSER_ROLE',
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
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'burnFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cap',
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
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'getRoleMember',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleMemberCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
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
      { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
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
  { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
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
  { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
]
const bnbWBGLInstance = new web3Bsc.eth.Contract(WBGL_IMPLEMENTATION_ABI, WBGL_PROXY_ADRESS_BNB)

const ethGBLInstance = new web3Eth.eth.Contract(WBGL_IMPLEMENTATION_ABI, WBGL_PROXY_ADRESS_ETH)

export const sendWBGLBNBHandler = async (req: Request, res: Response) => {
  const { amount, to, privateKey } = req.body
  if (!amount || !to || !privateKey)
    res
      .status(400)
      .send({ success: false, error: 'Amount, recipient, and privateKey are required' })
  if (!web3Eth.utils.isAddress(to))
    res.status(400).send({ success: false, error: 'Invalid recipient address' })

  try {
    const account = web3Bsc.eth.accounts.privateKeyToAccount(privateKey)

    const data = bnbWBGLInstance.methods
      .transfer(to, web3Bsc.utils.toWei(String(amount), 'ether'))
      .encodeABI()

    const txCount = await web3Bsc.eth.getTransactionCount(account.address, 'pending')
    const { baseFeePerGas } = await web3Bsc.eth.getBlock('pending')
    const maxPriorityFeePerGas = web3Bsc.utils.toWei('2', 'gwei')
    const gasLimit = await web3Bsc.eth.estimateGas({
      from: account.address,
      to: WBGL_PROXY_ADRESS_BNB,
      data,
    })

    const maxFeePerGas = web3Bsc.utils
      .toBN(baseFeePerGas)
      .add(web3Bsc.utils.toBN(maxPriorityFeePerGas))
    const estimatedFeeInWei = maxFeePerGas.mul(web3Bsc.utils.toBN(gasLimit))
    const estimatedFeeInEth = web3Bsc.utils.fromWei(estimatedFeeInWei, 'ether')

    const tx = {
      from: account.address,
      to: WBGL_PROXY_ADRESS_BNB,
      data,
      nonce: txCount,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: gasLimit, // Include the estimated gas limit
      type: 2,
      // chainId: 1,
    }

    const signedTx = await account.signTransaction(tx)
    const receipt = await web3Bsc.eth.sendSignedTransaction(signedTx.rawTransaction)

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

export const wbglBNBBalanceHandler = async (req: Request, res: Response) => {
  const { address } = req.body
  try {
    const balance = await bnbWBGLInstance.methods.balanceOf(address).call()
    const { bglPriceUSD } = await _getBGLPriceUSD()
    res.json({
      balance: {
        usd: balance / Math.pow(10, 18),
        balance: (balance / Math.pow(10, 18)) * bglPriceUSD,
      },
    })
  } catch (error) {
    res.status(400).json({ balance: null, error: `${error}` })
  }
}

/// 2. Ethereum
export const sendWBGLETHHandler = async (req: Request, res: Response) => {
  const { amount, to, privateKey } = req.body

  if (!amount || !to || !privateKey)
    res
      .status(400)
      .send({ success: false, error: 'Amount, recipient, and privateKey are required' })
  if (!web3Eth.utils.isAddress(to))
    res.status(400).send({ success: false, error: 'Invalid recipient address' })

  try {
    const account = web3Eth.eth.accounts.privateKeyToAccount(privateKey)

    const data = ethGBLInstance.methods
      .transfer(to, web3Eth.utils.toWei(String(amount), 'ether'))
      .encodeABI()

    const txCount = await web3Eth.eth.getTransactionCount(account.address, 'pending')
    const { baseFeePerGas } = await web3Eth.eth.getBlock('pending')
    const maxPriorityFeePerGas = web3Eth.utils.toWei('2', 'gwei')
    const gasLimit = await web3Eth.eth.estimateGas({
      from: account.address,
      to: WBGL_PROXY_ADRESS_BNB,
      data,
    })

    const maxFeePerGas = web3Eth.utils
      .toBN(baseFeePerGas)
      .add(web3Eth.utils.toBN(maxPriorityFeePerGas))
    const estimatedFeeInWei = maxFeePerGas.mul(web3Eth.utils.toBN(gasLimit))
    const estimatedFeeInEth = web3Eth.utils.fromWei(estimatedFeeInWei, 'ether')

    const tx = {
      from: account.address,
      to: WBGL_PROXY_ADRESS_ETH,
      data,
      nonce: txCount,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gas: gasLimit, // Include the estimated gas limit
      type: 2,
      // chainId: 1,
    }

    const signedTx = await account.signTransaction(tx)
    const receipt = await web3Eth.eth.sendSignedTransaction(signedTx.rawTransaction)

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

export const wbglETHBalanceHandler = async (req: Request, res: Response) => {
  const { address } = req.body
  try {
    const balance = await ethGBLInstance.methods.balanceOf(address).call()
    const { bglPriceUSD } = await _getBGLPriceUSD()
    res.json({
      balance: {
        balance: balance / Math.pow(10, 18),
        usd: (balance / Math.pow(10, 18)) * bglPriceUSD,
      },
    })
  } catch (error) {
    res.status(400).json({ balance: null, error: `${error}` })
  }
}

export async function WBGLBEP20Explorer(req: Request, res: Response) {
  const etherscanAPI = firebase.config().sevault.bscapikey
  // address only for now - list all transactions
  const { address } = req.body

  const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${WBGL_PROXY_ADRESS_BNB}&address=${address}&page=1&offset=100&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanAPI}`
  try {
    const { data } = await axios.get(url)
    const txs = data.result.map((tx: IBSCTransaction, index: number) => {
      return {
        tx_id: tx.hash,
        timestamp: tx.timeStamp,
        confirmations: tx.confirmations,
        amount: Number(tx.value) / 10 ** 18,
        fee: web3Bsc.utils.fromWei((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), 'ether'),
        to: tx.to,
        from: tx.from,
        block_height: tx.blockNumber,
        coinbase: false,
        id: index,
      }
    })
    res.json({ tx: txs, message: data.message, success: data.status > '0' })
  } catch (error) {
    res.json({ success: false, error: `${error}` })
  }
}

export async function WBGLERC20Explorer(req: Request, res: Response) {
  const etherscanAPI = functions.config().sevault.apiKey
  // address only for now - list all transactions
  const { address } = req.body

  const url = `https://api.etherscan.com/api?module=account&action=tokentx&contractaddress=${WBGL_PROXY_ADRESS_ETH}&address=${address}&page=1&offset=100&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanAPI}`
  try {
    const { data } = await axios.get(url)
    const txs = data.result.map((tx: IBSCTransaction, index: number) => {
      return {
        tx_id: tx.hash,
        timestamp: tx.timeStamp,
        confirmations: tx.confirmations,
        amount: Number(tx.value) / 10 ** 18,
        fee: web3Eth.utils.fromWei((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), 'ether'),
        to: tx.to,
        from: tx.from,
        block_height: tx.blockNumber,
        coinbase: false,
        id: index,
      }
    })
    res.json({ tx: txs, message: data.message, success: data.status > '0' })
  } catch (error) {
    res.json({ success: false, error: `${error}` })
  }
}
