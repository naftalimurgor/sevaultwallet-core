import { Transaction } from '../classes/Transaction.class'

declare global {
  interface GlobalThis {
    Transaction: typeof Transaction
    mnemonicToEntropy: (mnemonic: string) => string
    isMnemonicCheckSumValid: (mnemonic: string) => boolean
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { }
