// Firo RPC types
export interface FiroRpcError {
  code: number;
  message: string;
}

export interface FiroRpcResponse<T> {
  jsonrpc: string;
  id: string;
  result: T;
  error?: FiroRpcError;
}
