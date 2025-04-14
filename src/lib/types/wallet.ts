export interface Wallet {
  id: string;
  name: string;
  type: 'HD' | 'Standard';
  network: 'ERC20' | 'TRC20';
  address: string;
  balance: string;
  mnemonic?: string;
  derivationPath?: string;
  createdAt: Date;
}

export interface WalletGroup {
  id: string;
  name: string;
  wallets: string[]; // Array of wallet IDs
}

export interface NetworkStatus {
  network: 'ERC20' | 'TRC20';
  isConnected: boolean;
  currentGasPrice?: string;
  blockHeight?: number;
}