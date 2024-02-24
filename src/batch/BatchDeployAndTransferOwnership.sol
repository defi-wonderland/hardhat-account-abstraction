// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity =0.8.19;

interface IOwnableContract {
  function transferOwnership(address newOwner) external;
}

contract BatchDeployAndTransferOwnership {
  /**
   * @notice Simulates a deployment and transfer ownership as if this contract was a factory
   * @param _initCode The contract we are deploings init code
   */
  constructor(bytes memory _initCode) payable {
    address _newContract;
    uint256 _guardedSalt;

    // Deploy the contract via CREATE2
    assembly {
      _newContract := create2(callvalue(), add(_initCode, 0x20), mload(_initCode), _guardedSalt)
    }

    // Attempt to transfer ownership to see if the function exists
    try IOwnableContract(_newContract).transferOwnership(msg.sender) {}
    catch {
      _newContract = address(0);
    }

    bytes memory data = abi.encode(_newContract);

    // force constructor to return data via assembly
    // If everything was successful will return the address of the deployment
    assembly {
      let dataStart := add(data, 32)
      let dataEnd := sub(msize(), dataStart)
      return(dataStart, dataEnd)
    }
  }
}
