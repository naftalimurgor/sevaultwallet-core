// // address/password stored
// // generateToken
// // verifyToken

// interface IToken {
//   password: string
//   address: string
// }

// class Token {
//   private password: string
//   private address: string
//   private constructor(args: IToken) {
//     this.password = args.password
//     this.address = args.address
//   }

//   public static getTokenInstance(args: IToken) {
//     return new Token(args)
//   }

//   /**
//    * generateToken
//    */
//   public generateToken() {
//     //1.  verify password via salt comparison
//     // 2.if valid, generate jwt token: consider expiry
//   }

//   private _generatePasswordSalt() {
//     // passowrd hash + address salt
//     const pair = {
//       password: this.password,
//       address: this.address,
//       expiry: Date.now() + 1000 * 100 // should be like 20 minutes or less
//     }
//   }

// }
