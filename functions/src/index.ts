/* eslint-disable prettier/prettier */
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// https://stackoverflow.com/questions/76434349/firebase-cloud-functions-v2-error-when-deploying
import { onRequest } from 'firebase-functions/v1/https'
import { setGlobalOptions } from 'firebase-functions/v2/options'
import * as swaggerUi from 'swagger-ui-express'
setGlobalOptions({ maxInstances: 10 })

import express = require('express')
import cors = require('cors')

import { Request, Response } from 'express'

import {
  BGLaccountBalanceHandler,
  bglTxBuilderHandler,
  createBitgesellAccountsHandler,
  dashboardHandler,
  importAccountHandler,
  importFromPkeyOrSeedPhraseHandler,
  importWalletHandler,
  txHistoryHandler,
} from './controllers/BitgesellBlockchainService'

import {
  BNBAccountBalanceHandler,
  BUSDTBalanceHandler,
  createHdWalletHandler as createBNBHDwallet,
  sendBNBHandler,
  sendBUSDT,
  sendV1CommissionBNBHandler,
  sendV1CommissionBUSDT,
} from './controllers/BNBSmartChainService'

import {
  createHdWalletHandler,
  EthereumAccountBalanceHandler,
  sendEthereumhandler,
  sendUSDT,
  USDTBalanceHandler,
} from './controllers/EthereumBlockchainService'

import {
  BEP20Explorer,
  BSCExplorer,
  ERC20Explorer,
  ETHExplorer,
  historyDataPoints7Days,
} from './controllers/EvmExplorerService'

import {
  sendWBGLBNBHandler,
  sendWBGLETHHandler,
  WBGLBEP20Explorer,
  wbglBNBBalanceHandler,
  WBGLERC20Explorer,
  wbglETHBalanceHandler,
} from './controllers/WrappedBGLService'

// swagger specs
import bglSwagger from './controllers/swagger/bitgesell.json'
import bnbSwagger from './controllers/swagger/bnb.json'
import ethSwagger from './controllers/swagger/eth.json'
import testHealth from './controllers/swagger/health.json'

const docs = express()

docs.use('/api-docs/bgl', swaggerUi.serve, swaggerUi.setup(bglSwagger))
docs.use('/api-docs/bnb', swaggerUi.serve, swaggerUi.setup(bnbSwagger))
docs.use('/api-docs/eth', swaggerUi.serve, swaggerUi.setup(ethSwagger))
docs.use('/api-docs/health', swaggerUi.serve, swaggerUi.setup(testHealth))


export const bgl = express()
export const bnb = express()
export const eth = express()

  ;[bgl, bnb, eth].forEach(app => {
    app.disable('etag')
    app.set('trust proxy', true)
    app.disable('x-powered-by')
  })

bgl.use(express.json())
bgl.use(cors())

bnb.use(express.json())
bnb.use(cors())

eth.use(express.json())
eth.use(cors())

bgl.get('/stats/health', (req: Request, res: Response) => {
  res.send('0k').status(200)
})

// BITGESELL ENDPOINTS
bgl.post('/wallet/create', createBitgesellAccountsHandler)
// need private key in request
bgl.post('/dashboard/get', dashboardHandler) // use this to render dashboard to load faster- port over
bgl.post('/wallet/update', importWalletHandler)
bgl.post('/tx/create', bglTxBuilderHandler)
bgl.post('/wallet/new/update', importFromPkeyOrSeedPhraseHandler)
bgl.get('/tx/:address', txHistoryHandler)
bgl.post('/wallet/create/index', importAccountHandler)
bgl.post('/wallet/balance/get', BGLaccountBalanceHandler)
// END BITGESELL ENDPOINTS


// 1. BNB service Routes
bnb.post('/wallet/create', createBNBHDwallet)
bnb.post('/test/create-bnb-wallet', createBNBHDwallet)

bnb.post('/tx/usdt/create', sendBUSDT)
bnb.post('/commission/send-usdt', sendV1CommissionBUSDT)
bnb.post('/tx/bnb/create', sendBNBHandler)
bnb.post('/commission/send', sendV1CommissionBNBHandler)
bnb.post('/tx/wbgl/create', sendWBGLBNBHandler)
bnb.post('/tx/bnb/history/get', BSCExplorer)
bnb.post('/tx/usdt/history/get', BEP20Explorer)
bnb.post('/tx/wbgl/history/get', WBGLBEP20Explorer)
bnb.post('/wallet/balance/get', BNBAccountBalanceHandler)
bnb.post('/wallet/usdt/balance/get', BUSDTBalanceHandler)
bnb.post('/wallet/wbgl/balance/get', wbglBNBBalanceHandler)

// 3. Ethereum service Routes
eth.post('/wallet/create', createHdWalletHandler)
eth.post('/tx/usdt/create', sendUSDT)
eth.post('/tx/eth/create', sendEthereumhandler) // @todo: port to mainnet as it works
eth.post('/tx/wbgl/create', sendWBGLETHHandler)
eth.post('/tx/history/eth/get', ETHExplorer)
eth.post('/tx/history/usdt/get', ERC20Explorer)
eth.post('/tx/history/wbgl/get', WBGLERC20Explorer)
eth.post('/wallet/balance/get', EthereumAccountBalanceHandler)
eth.post('/wallet/balance/usdt/get', USDTBalanceHandler)
eth.post('/wallet/balance/wbgl/get', wbglETHBalanceHandler)

// 2. Explorer + historical chart data
eth.get('/charts/get', historyDataPoints7Days)

exports.bitgesell = onRequest(bgl)
exports.bsc = onRequest(bnb)
exports.ethereum = onRequest(eth)
exports.docs = onRequest(docs)
