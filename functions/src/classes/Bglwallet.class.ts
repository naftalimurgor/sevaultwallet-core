/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsbgl = require('@naftalimurgor/jsbgl')

interface Iwallet {
  bglPrivateKeyOrSeed: string
}

export type IBglWalletObject = {
  address: string
  wallet: string
  privateKey: string
}

export class BGLWallet {
  private readonly privateKeyOrSeed: string

  constructor(config: Iwallet) {
    if (!config.bglPrivateKeyOrSeed) {
      throw new Error(
        'No PrivateKey or Seedphrase provided set. Please provide Seed or PrivateKey!',
      )
    }
    this.privateKeyOrSeed = config.bglPrivateKeyOrSeed
  }

  /// Begin Public Methods
  /**
   * createWallet imports a wallet from privateKey or Mnemonic
   */

  // @ts-ignore
  public async createWallet(): Promise<IBglWalletObject | typeof Error | undefined> {
    let wallet: { address: string; wallet: string; privateKey: string }

    try {
      await jsbgl.asyncInit(globalThis)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (globalThis.isMnemonicCheckSumValid(this.privateKeyOrSeed)) {
        wallet = await this._importWalletFromMnemonic()
        return wallet
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
      } else if (globalThis.isWifValid(this.privateKeyOrSeed)) {
        wallet = await this._importWalletFromPrivateKey()
        return wallet
      }
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  /**
   * createWallet imports a wallet from privateKey or Mnemonic
   */

  /// BEGIN PRIVATE METHODS
  private _importWalletFromPrivateKey = async (): Promise<IBglWalletObject> => {
    try {
      await jsbgl.asyncInit(globalThis)
      const wif = await this._privateKeyToWIF(this.privateKeyOrSeed)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const privateKeyInstance = new globalThis.PrivateKey(wif)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const wallet = new globalThis.Address(privateKeyInstance)
      return {
        address: wallet.address,
        wallet: wallet,
        privateKey: wallet.privateKey,
      } as IBglWalletObject
    } catch (error) {
      throw new Error(`Failed: ${error}`)
    }
  }

  private _privateKeyToWIF = async (privatekey: string) => {
    try {
      await jsbgl.asyncInit(globalThis)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const privateKey = new globalThis.PrivateKey(privatekey)
      return privateKey.wif
    } catch (error) {
      throw new Error(`Failed: ${error}`)
    }
  }
  /// end Public methods

  /// Begin Private Methods
  /**
   * @private
   * importWalletFromPrivateKey imports wallet from Bitgesell Mainnet privateKey
   */

  /**
   * @private
   * importWalletFromMnemonic imports from Bitgesell Mainnet seedphrase
   * @param indexAddress the address to use, defaults to address 0, the index address
   */
  private async _importWalletFromMnemonic(indexAddress = 0): Promise<IBglWalletObject> {
    try {
      await jsbgl.asyncInit(globalThis)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const wallet = new globalThis.Wallet({ from: this.privateKeyOrSeed })
      const address = wallet.getAddress(indexAddress) // index address
      return {
        address: address.address,
        mnemonic: this.privateKeyOrSeed,
        wallet,
        privateKey: address.privateKey,
      } as IBglWalletObject
    } catch (error) {
      throw new Error(`${error}`)
    }
  }
  /// End Private Methods
}
