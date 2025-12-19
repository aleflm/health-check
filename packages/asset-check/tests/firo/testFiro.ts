import { FiroRpcAssetHealthCheckParam } from '../../lib/firo/rpc';

export class TestFiroRpcAssetHealthCheck extends FiroRpcAssetHealthCheckParam {
  /**
   * @returns protected token amount
   */
  getTokenAmount = () => {
    return this.tokenAmount;
  };

  /**
   * @returns the axios client
   */
  getClient = () => this.client;
}
