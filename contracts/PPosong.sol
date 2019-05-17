pragma solidity >=0.4.0 <0.6.0;

contract PPosong {
    
   bytes32[] reviews;
    
    function addReview(bytes32 newReview) public{
        reviews.push(newReview);
    }
    
    function getAllReview() public view returns(bytes32[] memory){
        return reviews;
    }
    
}