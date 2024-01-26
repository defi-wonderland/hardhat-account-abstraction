// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IOwnableContract {
  function transferOwnership(address newOwner) external;
}

contract BatchDeployAndTransferOwnership {
  constructor(bytes memory initCode) payable {
    address newContract;
    uint256 guardedSalt = 0;

    assembly {
        newContract := create2(callvalue(), add(initCode, 0x20), mload(initCode), guardedSalt)
    }

    IOwnableContract(newContract).transferOwnership(msg.sender);

    bytes memory data = abi.encode(newContract);

    // force constructor to return data via assembly
    assembly {
      let dataStart := add(data, 32)
      let dataEnd := sub(msize(), dataStart)
      return(dataStart, dataEnd)
    }
  }
}