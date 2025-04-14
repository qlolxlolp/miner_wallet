import { ethers } from 'ethers';
import TronWeb from '@tronweb3/tronweb';

// ERC20 USDT Contract Address on Ethereum Mainnet
const USDT_ERC20_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// TRC20 USDT Contract Address on TRON Mainnet
const USDT_TRC20_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Pre-configured API Keys
const INFURA_PROJECT_ID = '84842078b09946638c03157f83405213';  // Valid Infura Project ID
const TRONGRID_API_KEY = '4651321b-66ee-4056-a376-b49f7f7d7cc1';  // Valid TronGrid API Key

// ABI for ERC20 USDT
const ERC20_ABI = [
  'function transfer(address to, uint value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint value)'
];

export class BlockchainProvider {
  private ethersProvider: ethers.Provider;
  private tronWeb: typeof TronWeb;

  constructor() {
    // Initialize Ethereum provider with pre-configured Infura Project ID
    this.ethersProvider = new ethers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
    );

    // Initialize TRON provider with pre-configured TronGrid API Key
    this.tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io',
      headers: { "TRON-PRO-API-KEY": TRONGRID_API_KEY }
    });
  }

  async getERC20Balance(address: string): Promise<string> {
    const contract = new ethers.Contract(
      USDT_ERC20_ADDRESS,
      ERC20_ABI,
      this.ethersProvider
    );
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  async getTRC20Balance(address: string): Promise<string> {
    const contract = await this.tronWeb.contract().at(USDT_TRC20_ADDRESS);
    const balance = await contract.balanceOf(address).call();
    return this.tronWeb.fromSun(balance);
  }

  async sendERC20Transaction(
    fromWallet: ethers.Wallet,
    toAddress: string,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    const contract = new ethers.Contract(
      USDT_ERC20_ADDRESS,
      ERC20_ABI,
      fromWallet
    );
    
    const decimals = await contract.decimals();
    const value = ethers.parseUnits(amount, decimals);
    
    return await contract.transfer(toAddress, value);
  }

  async sendTRC20Transaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: string
  ): Promise<any> {
    const tronWebInstance = this.tronWeb;
    tronWebInstance.setPrivateKey(fromPrivateKey);

    const contract = await tronWebInstance.contract().at(USDT_TRC20_ADDRESS);
    const decimals = await contract.decimals().call();
    const value = tronWebInstance.toSun(amount);

    return await contract.transfer(toAddress, value).send();
  }

  async getTransactionStatus(txHash: string, network: 'ERC20' | 'TRC20'): Promise<string> {
    if (network === 'ERC20') {
      const tx = await this.ethersProvider.getTransaction(txHash);
      if (!tx) return 'pending';
      const receipt = await tx.wait();
      return receipt ? 'confirmed' : 'failed';
    } else {
      const tx = await this.tronWeb.trx.getTransaction(txHash);
      return tx?.ret?.[0]?.contractRet === 'SUCCESS' ? 'confirmed' : 'failed';
    }
  }

  async getNetworkFees(network: 'ERC20' | 'TRC20'): Promise<string> {
    if (network === 'ERC20') {
      const feeData = await this.ethersProvider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
    } else {
      const resourceParams = await this.tronWeb.trx.getChainParameters();
      const bandwidthPrice = resourceParams.find((param: any) => 
        param.key === 'getEnergyFee'
      );
      return bandwidthPrice?.value || '0';
    }
  }
}