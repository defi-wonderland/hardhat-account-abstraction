import { PartialUserOperation } from '../types';

export class BasePaymaster {
  public endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async sponsorUserOperation(userOp: PartialUserOperation, arbitraryExtraObject: any | undefined): Promise<any> {
    throw new Error('This is a base class and should not be called directly.');
  }
}
