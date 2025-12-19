import { describe, expect, it, vitest } from 'vitest';

import { Axios } from '@rosen-clients/rate-limited-axios';

import { FIRO_NATIVE_ASSET } from '../../lib/constants';
import { TestFiroRpcAssetHealthCheck } from './testFiro';

describe('FiroRpcAssetHealthCheck', () => {
  const mockPost = (client: Axios, result: unknown) => {
    vitest.spyOn(client, 'post').mockResolvedValue({ data: result });
  };

  describe('update', () => {
    /**
     * @target FiroRpcAssetHealthCheck.update Should update FIRO amount using RPC api
     * @dependencies
     * - axios
     * @scenario
     * - mock return value of Firo RPC getaddressbalance api
     * - create new instance of TestFiroRpcAssetHealthCheck
     * - update the parameter
     * @expected
     * - The native firo asset amount should update successfully using RPC api
     */
    it('Should update FIRO amount using RPC api', async () => {
      const assetHealthCheckParam = new TestFiroRpcAssetHealthCheck(
        FIRO_NATIVE_ASSET,
        'THzVvKwY5dAD6gM5z4Mz3jG9RbqhkS8h7V',
        100n,
        10n,
        'http://localhost:8888',
        'firouser',
        'firopwd',
      );

      mockPost(assetHealthCheckParam.getClient(), {
        jsonrpc: '2.0',
        id: 'test',
        result: {
          balance: '1575000000',
          received: '2000000000',
        },
      });

      await assetHealthCheckParam.update();

      //   console.log('Balance:', assetHealthCheckParam.getTokenAmount());
      expect(assetHealthCheckParam.getTokenAmount()).toBe(1575000000n);
    });

    /**
     * @target FiroRpcAssetHealthCheck.update Should handle zero balance
     * @dependencies
     * - axios
     * @scenario
     * - mock return value of Firo RPC getaddressbalance api with zero balance
     * - create new instance of TestFiroRpcAssetHealthCheck
     * - update the parameter
     * @expected
     * - The native firo asset amount should be 0
     */
    it('Should handle zero balance', async () => {
      const assetHealthCheckParam = new TestFiroRpcAssetHealthCheck(
        FIRO_NATIVE_ASSET,
        'THzVvKwY5dAD6gM5z4Mz3jG9RbqhkS8h7V',
        100n,
        10n,
        'http://localhost:8888',
        'firouser',
        'firopwd',
      );

      mockPost(assetHealthCheckParam.getClient(), {
        jsonrpc: '2.0',
        id: 'test',
        result: {
          balance: '0',
          received: '0',
        },
      });

      await assetHealthCheckParam.update();

      //   console.log('Zero balance:', assetHealthCheckParam.getTokenAmount());
      expect(assetHealthCheckParam.getTokenAmount()).toBe(0n);
    });
  });
});
