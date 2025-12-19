import axios, { Axios } from '@rosen-clients/rate-limited-axios';

import { AbstractAssetHealthCheckParam } from '../abstract';
import { FIRO_NATIVE_ASSET } from '../constants';
import { FiroRpcResponse } from './types';

export class FiroRpcAssetHealthCheckParam extends AbstractAssetHealthCheckParam {
  protected client: Axios;
  protected rpcUsername?: string;
  protected rpcPassword?: string;

  /**
   * Creates a Firo RPC asset health check parameter
   * @param assetName Name of the asset (e.g., 'FIRO')
   * @param address Firo address to monitor
   * @param warnThreshold Warning threshold in satoshis
   * @param criticalThreshold Critical threshold in satoshis
   * @param rpcUrl Firo node RPC URL (e.g., 'http://localhost:8888')
   * @param rpcUsername RPC username (optional)
   * @param rpcPassword RPC password (optional)
   * @param assetDecimal Number of decimal places (default 8 for FIRO)
   *
   * @note REQUIRES Firo node to be configured with addressindex=1 in firo.conf
   * This enables the getaddressbalance RPC method. Without it, you'll get:
   * "No information available for address" error.
   *
   * To enable addressindex:
   * 1. Add 'addressindex=1' to firo.conf
   * 2. Restart firo daemon with -reindex flag (only needed once)
   */
  constructor(
    assetName: string,
    address: string,
    warnThreshold: bigint,
    criticalThreshold: bigint,
    rpcUrl: string,
    rpcUsername?: string,
    rpcPassword?: string,
    assetDecimal = 8,
  ) {
    super(
      'Firo',
      FIRO_NATIVE_ASSET,
      assetName.toUpperCase(),
      address,
      warnThreshold,
      criticalThreshold,
      assetDecimal,
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
    const response = await this.client.post<FiroRpcResponse<T>>('/', {
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
   * update health status for this param
   */
  updateStatus = async () => {
    const result = await this.callRpc<{ balance: string; received: string }>(
      'getaddressbalance',
      [{ addresses: [this.address] }],
    );

    // balance is returned in satoshis as a string
    this.tokenAmount = BigInt(result.balance);
  };
}
