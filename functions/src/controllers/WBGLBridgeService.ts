import { ethers } from 'ethers'

import { Request, Response } from 'express'

import WBGLBridgeSDK, { ChaindIds } from 'wbgl-bridge-sdk'

export interface IWBGLBridgeService {
  rpc: string
  chainId: ChaindIds
  network: 'Ethereum' | 'BNBSmartChain'
  provider: ethers.providers.JsonRpcProvider
  chainName: 'eth' | 'bnb' | 'arb' | 'op'
}

const configBNBSmartChain = {
  rpc: 'https://rpc.ankr.com/bsc',
  chainId: ChaindIds.BNBSmartChain,
  network: 'BNBSmartChain',
  provider: new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/bsc'),
  chainName: 'bnb',
}

/**
 * swapBGLtoWBGL handler
 */
export async function swapBGLtoWBGLBSCHandler(req: Request, res: Response) {
  // bridge options all
  const { bglPrivateKey, privateKey, to, amount } = req.body

  const config = {
    evmPrivateKey: privateKey,
    provider: configBNBSmartChain.provider,
    chainName: configBNBSmartChain.chainName,
    chainId: configBNBSmartChain.chainId,
    bridgeEndpoint: 'https://bglswap.com/app/',
    bglPrivateKey: bglPrivateKey,
  }

  const bglTxFee = 0.0001 // minimum txFee of proposed 10,000 satoshis(0.0001BGL)

  const bGLWBGLExchangePair = {
    recepientWBGLAddress: to,
    bglAmount: amount,
    bglFee: bglTxFee,
  }

  const wbglBridgeSDK = new WBGLBridgeSDK(config)

  try {
    const swapResult = await wbglBridgeSDK.bgl.swapBGLforWBGL(bGLWBGLExchangePair)
    return res.json({ msg: 'success', success: true, swapResult })
  } catch (error) {
    return res.json({ success: false, msg: `Failed ${error}` })
  }
}

export async function swapWBGLtoBGLBSCHandler(req: Request, res: Response) {
  // bridge options all
  const { bglPrivateKey, privateKey, from, to, amount } = req.body

  const config = {
    evmPrivateKey: privateKey,
    provider: configBNBSmartChain.provider,
    chainName: configBNBSmartChain.chainName,
    chainId: configBNBSmartChain.chainId,
    bridgeEndpoint: 'https://bglswap.com/app/',
    bglPrivateKey: bglPrivateKey,
  }

  const wbglPair = {
    bglAddress: from,
    to: to,
    wbglAmount: amount,
  }

  const wbglBridgeSDK = new WBGLBridgeSDK(config)

  try {
    const swapResult = await wbglBridgeSDK.wbgl.swapWBGLforBGL(wbglPair)
    return res.json({ msg: 'success', success: true, swapResult })
  } catch (error) {
    return res.json({ success: false, msg: `Failed ${error}` })
  }
}

export interface IWBGLBridgeService {
  rpc: string
  chainId: ChaindIds
  network: 'Ethereum' | 'BNBSmartChain'
  provider: ethers.providers.JsonRpcProvider
  chainName: 'eth' | 'bnb' | 'arb' | 'op'
}

const ethereumWBGLBridgeConfig: IWBGLBridgeService = {
  rpc: 'https://mainnet.infura.io/v3/04c3f6b3201b41ef8a15e7e08a7c730e',
  chainId: ChaindIds.Ethereum,
  network: 'Ethereum',
  provider: new ethers.providers.JsonRpcProvider(
    'https://mainnet.infura.io/v3/04c3f6b3201b41ef8a15e7e08a7c730e',
  ),
  chainName: 'eth',
}

/**
 * swapBGLtoWBGL handler
 */
export async function swapBGLtoWBGLETHandler(req: Request, res: Response) {
  // bridge options all
  const { bglPrivateKey, privateKey, to, amount } = req.body

  const config = {
    evmPrivateKey: privateKey,
    provider: ethereumWBGLBridgeConfig.provider,
    chainName: ethereumWBGLBridgeConfig.chainName,
    chainId: ethereumWBGLBridgeConfig.chainId,
    bridgeEndpoint: 'https://bglswap.com/app/',
    bglPrivateKey: bglPrivateKey,
  }

  const bglTxFee = 0.0001 // minimum txFee of proposed 10,000 satoshis(0.0001BGL)

  const bGLWBGLExchangePair = {
    recepientWBGLAddress: to,
    bglAmount: amount,
    bglFee: bglTxFee,
  }

  const wbglBridgeSDK = new WBGLBridgeSDK(config)

  try {
    const swapResult = await wbglBridgeSDK.bgl.swapBGLforWBGL(bGLWBGLExchangePair)
    return res.json({ msg: 'success', success: true, swapResult })
  } catch (error) {
    return res.json({ success: false, msg: `Failed ${error}` })
  }
}

export async function swapWBGLtoBGLETHHandler(req: Request, res: Response) {
  // bridge options all
  const { bglPrivateKey, privateKey, from, to, amount } = req.body

  const config = {
    evmPrivateKey: privateKey,
    provider: ethereumWBGLBridgeConfig.provider,
    chainName: ethereumWBGLBridgeConfig.chainName,
    chainId: ethereumWBGLBridgeConfig.chainId,
    bridgeEndpoint: 'https://bglswap.com/app/',
    bglPrivateKey: bglPrivateKey,
  }

  const wbglPair = {
    bglAddress: from,
    to: to,
    wbglAmount: amount,
  }

  const wbglBridgeSDK = new WBGLBridgeSDK(config)

  try {
    const swapResult = await wbglBridgeSDK.wbgl.swapWBGLforBGL(wbglPair)
    return res.json({ msg: 'success', success: true, swapResult })
  } catch (error) {
    return res.json({ success: false, msg: `Failed ${error}` })
  }
}
