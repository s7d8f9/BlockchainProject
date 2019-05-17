pragma solidity >=0.4.0 <0.6.0;

import "truffle/DeployedAddresses.sol";
import "truffle/Assert.sol";
import "../contracts/PPosong.sol";

contract TestVoting {
 
 uint public initialBalance = 2 ether;
 
 function testAddReview() public {
     PPosong pposong = PPosong(DeployedAddresses.PPosong());
     
     bytes32[] memory str = pposong.getAllReview();
     uint256 sz = str.length;
     
     pposong.addReview("abc");
     
     str = pposong.getAllReview();
     uint256 sz2 = str.length;
    Assert.equal(sz+1,sz2, "not complete addReview");
  }

}