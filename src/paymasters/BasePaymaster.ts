import { PartialUserOperation } from '../types';

export class BasePaymaster {
  public endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  // eslint-disable-next-line
  public async sponsorUserOperation(userOp: PartialUserOperation, entryPoint: `0x${string}`): Promise<any> {
    throw new Error('This is a base class and should not be called directly.');
  }
}
