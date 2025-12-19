import axios, { Axios } from '@rosen-clients/rate-limited-axios';

import { LastSavedBlock } from '../config';
import { ScannerSyncHealthCheckParam } from '../scannerSyncHealthCheckParam';

export class FiroRpcScannerHealthCheck extends ScannerSyncHealthCheckParam {
  private client: Axios;
  private rpcUsername?: string;
  private rpcPassword?: string;
  private heightDifference?: number;
  private networkHeightError?: string;

  constructor(
    getLastSavedBlock: () => Promise<LastSavedBlock>,
    warnDifference: number,
    criticalDifference: number,
    rpcUrl: string,
    rpcUsername?: string,
    rpcPassword?: string,
    blockTime = 150, // Firo block time is approximately 2.5 minutes (150 seconds)
    scannerUpdateInterval = 0,
  ) {
    super(
      'firo',
      getLastSavedBlock,
      warnDifference,
      criticalDifference,
      blockTime,
      scannerUpdateInterval,
    );

    const authConfig =
      rpcUsername || rpcPassword
        ? {
            auth: {
              username: rpcUsername || '',
              password: rpcPassword || '',
            },
          }
        : {};

    this.client = axios.create({
      baseURL: rpcUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      ...authConfig,
    });
    this.rpcUsername = rpcUsername;
    this.rpcPassword = rpcPassword;
  }

  /**
   * Execute an RPC call to the Firo node
   * @param method RPC method name
   * @param params RPC method parameters
   * @returns RPC response
   */
  private async callRpc<T>(method: string, params: unknown[] = []): Promise<T> {
    const response = await this.client.post<{
      jsonrpc: string;
      id: string;
      result: T;
      error?: { code: number; message: string };
    }>('/', {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method,
      params,
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  /**
   * Get current block count from Firo node
   * @returns current block height
   */
  private async getCurrentBlockHeight(): Promise<number> {
    return await this.callRpc<number>('getblockcount');
  }

  /**
   * Enhanced health details that compare with network height
   * @returns parameter health description
   */
  getDetails = (): string | undefined => {
    const baseDetails = this.rawDetails();

    if (this.networkHeightError) {
      const errorSuffix = ` Unable to check network height: ${this.networkHeightError}.`;
      return baseDetails
        ? baseDetails + errorSuffix
        : `Network connectivity issue.${errorSuffix}`;
    }

    if (this.heightDifference !== undefined) {
      const networkHeight = this.lastBlockHeight + this.heightDifference;

      if (baseDetails && this.heightDifference > this.criticalDifference) {
        return `${baseDetails} Scanner is ${this.heightDifference} blocks behind the network (height ${networkHeight}).`;
      } else if (baseDetails && this.heightDifference > this.warnDifference) {
        return `${baseDetails} Scanner is ${this.heightDifference} blocks behind the network (height ${networkHeight}).`;
      } else if (this.heightDifference > this.criticalDifference) {
        return `Scanner is critically behind the network by ${this.heightDifference} blocks (network height: ${networkHeight}, scanner height: ${this.lastBlockHeight}).`;
      } else if (this.heightDifference > this.warnDifference) {
        return `Scanner is behind the network by ${this.heightDifference} blocks (network height: ${networkHeight}, scanner height: ${this.lastBlockHeight}).`;
      }
    }

    return baseDetails;
  };

  /**
   * Update status with enhanced network height comparison
   */
  updateStatus = async () => {
    await this.rawUpdate();

    // Reset previous state
    this.heightDifference = undefined;
    this.networkHeightError = undefined;

    // Enhance with network comparison for health status calculation
    try {
      const networkHeight = await this.getCurrentBlockHeight();
      this.heightDifference = networkHeight - this.lastBlockHeight;
    } catch (error) {
      // Store error for getDetails to use
      this.networkHeightError =
        error instanceof Error ? error.message : 'Unknown error';
    }
  };
}
