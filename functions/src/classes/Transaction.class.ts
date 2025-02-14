// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsbgl from '@naftalimurgor/jsbgl'

export class Transaction {
  private static txInstance: Transaction
  private constructor() {
    this._initJsbglModule()
  }

  public static makeTxObject() {
    if (!this.txInstance) {
      this.txInstance = new Transaction()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new globalThis.Transaction()
    }
  }

  /**
   *
   * Initializes the jsbgl module, by injecting the module to the global scope
   */
  private _initJsbglModule() {
    return Promise.resolve(jsbgl.asyncInit())
  }
}
