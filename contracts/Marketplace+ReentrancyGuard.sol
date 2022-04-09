// © 2021 coder-question.com | with CC 4.0 by-sa copyright agreement |
// Govind Mohan, 2022: HoloNFT adaptation.
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
/* import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; */
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

struct Listing
{
  address owner;
  bool is_active;
  uint token_id;
  uint price;
}

contract Marketplace is ReentrancyGuard  {
  using SafeMath for uint256;

  uint public listing_count = 0;
  mapping (uint => Listing) public listings;
  ERC721 erc721_contract = ERC721(0x1221F89B11e36d28595485372269d6F1fd576FBa);

  function addListing(uint token_id, uint price) public nonReentrant
  {
    listings[listing_count] = Listing(msg.sender, true, token_id, price);
    listing_count = listing_count.add(1);
    erc721_contract.transferFrom(msg.sender, address(this), token_id);
  }

  function removeListing(uint listing_id) public nonReentrant
  {
    require(listings[listing_id].owner == msg.sender, "Must be owner");
    require(listings[listing_id].is_active, "Must be active");
    listings[listing_id].is_active = false;
    erc721_contract.transferFrom(address(this), msg.sender, listings[listing_id].token_id);
  }

  function buy(uint listing_id) public nonReentrant
  {
    require(listings[listing_id].is_active, "Must be active");
    listings[listing_id].is_active = false;
    /* erc20_contract.transferFrom(msg.sender, listings[listing_id].owner, listings[listing_id].price); */
    erc721_contract.transferFrom(address(this), msg.sender, listings[listing_id].token_id);
  }

  function getActiveListings(uint index) public view returns(uint)
  {
    uint j;
    for(uint i=0; i<listing_count; i++)
    {
      if(listings[i].is_active)
      {
        if(index == j)
        {
          return i;
        }
        j+=1;
      }
    }
    return 0;
  }

  function getListingsByOwner(address owner, uint index) public view returns(uint)
  {
    uint j;
    for(uint i=0; i<listing_count; i++)
    {
      if(listings[i].is_active && listings[i].owner == owner)
      {
        if(index == j)
        {
          return i;
        }
        j+=1;
      }
    }
    return 0;
  }

  function getListingsByOwnerCount(address owner) public view returns(uint)
  {
    uint result;
    for(uint i=0; i<listing_count; i++)
    {
      if(listings[i].is_active && listings[i].owner == owner)
      {
        result+=1;
      }
    }
    return result;
  }

  function getActiveListingsCount() public view returns(uint)
  {
    uint result;
    for(uint i=0; i<listing_count; i++)
    {
      if(listings[i].is_active)
      {
        result+=1;
      }
    }
    return result;
  }
}
