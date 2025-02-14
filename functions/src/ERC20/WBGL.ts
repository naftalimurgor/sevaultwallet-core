// WBGL, Ethereum+Binance
// Transfer + balanceOf see how gas is estimated and

import { ethers } from 'ethers'

type Signer = ethers.Wallet
const WBGL_ABI = [
  'constructor()',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function burn(uint256 amount)',
  'function burnFrom(address account, uint256 amount)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
  'function grantRole(bytes32 role, address account)',
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function mint(address to, uint256 amount)',
  'function pause()',
  'event Paused(address account)',
  'function renounceRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
  'event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  'function unpause()',
  'event Unpaused(address account)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
  'function getRoleMember(bytes32 role, uint256 index) view returns (address)',
  'function getRoleMemberCount(bytes32 role) view returns (uint256)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function MINTER_ROLE() view returns (bytes32)',
  'function name() view returns (string)',
  'function paused() view returns (bool)',
  'function PAUSER_ROLE() view returns (bytes32)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
]

export class WBGL {
  private wbglInstance: ethers.Contract
  private constructor(contractAddress: string, signer: Signer) {
    this.wbglInstance = new ethers.Contract(contractAddress, WBGL_ABI, signer)
  }

  public static getWBGLInstance(contractAddress: string, signer: Signer) {
    const wbgl = new WBGL(contractAddress, signer)
    return wbgl.wbglInstance
  }
}
