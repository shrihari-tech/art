// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleArtMarketplace {
    // Structure to hold art details
    struct Art {
        uint256 id;
        string name;
        string uri;
        uint256 price;
        address payable creator;
        bool forSale;
    }

    // Arrays to store all art pieces and invalidated (not for sale) art pieces
    Art[] public artCollection;
    Art[] public invalidatedArt;

    // Address of the marketplace owner
    address public owner;

    // Modifier to restrict access to only the marketplace owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Event to log art creation
    event ArtCreated(uint256 id, string name, string uri, uint256 price, address creator);
    // Event to log art listing for sale
    event ArtListedForSale(uint256 id, uint256 price);
    // Event to log art sale
    event ArtSold(uint256 id, address buyer, uint256 price);
    // Event to log art invalidation
    event ArtInvalidated(uint256 id);

    // Function to set the marketplace owner
    function setOwner(address _owner) public {
        require(owner == address(0), "Owner is already set");
        owner = _owner;
    }

    // Function to create an art piece
    function createArt(string memory _name, string memory _uri, uint256 _price) public returns (uint256) {
        uint256 artId = artCollection.length + 1;
        Art memory newArt = Art(
            artId,
            _name,
            _uri,
            _price,
            payable(msg.sender),
            true
        );
        artCollection.push(newArt);
        emit ArtCreated(artId, _name, _uri, _price, msg.sender);
        return artId;
    }

    // Function to list an art piece for sale
    function listArtForSale(uint256 _id, uint256 _price) public {
        require(_id > 0 && _id <= artCollection.length, "Art does not exist");
        Art storage art = artCollection[_id - 1];
        require(art.creator == msg.sender, "Only the creator can list this art for sale");
        require(_price > 0, "Price must be greater than zero");
        
        art.price = _price;
        art.forSale = true;
        emit ArtListedForSale(_id, _price);
    }

    // Function to buy an art piece
    function buyArt(uint256 _id) public payable {
        require(_id > 0 && _id <= artCollection.length, "Art does not exist");
        Art storage art = artCollection[_id - 1];
        require(art.forSale, "This art is not for sale");
        require(msg.value >= art.price, "Insufficient funds");

        address payable seller = art.creator;
        seller.transfer(msg.value);
        art.creator = payable(msg.sender);
        art.forSale = false;

        emit ArtSold(_id, msg.sender, msg.value);
    }

    // Function to invalidate an art piece
    function invalidateArt(uint256 _id) public onlyOwner {
        require(_id > 0 && _id <= artCollection.length, "Art does not exist");
        Art storage art = artCollection[_id - 1];
        art.forSale = false;
        invalidatedArt.push(art);
        emit ArtInvalidated(_id);
    }

    // Function to return all valid art pieces
    function getValidArt() public view returns (Art[] memory) {
        return artCollection;
    }

    // Function to return all invalidated art pieces
    function getInvalidatedArt() public view returns (Art[] memory) {
        return invalidatedArt;
    }

    // Getter function to return the marketplace owner address
    function getOwner() public view returns (address) {
        return owner;
    }
}
