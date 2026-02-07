// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title EventTicketNFT
 * @dev ERC1155 token for event tickets with check-in functionality
 */
contract EventTicketNFT is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;

    struct TicketTier {
        uint256 tierId;
        string eventId; // Firebase event ID
        string name; // "VIP", "General Admission", etc.
        uint256 price; // in wei
        uint256 maxSupply;
        uint256 sold;
        bool isActive;
        address organizer;
    }

    // Mappings
    mapping(uint256 => TicketTier) public ticketTiers;
    mapping(string => mapping(address => bool)) public hasCheckedIn; // eventId => user => checked in
    mapping(uint256 => mapping(address => uint256)) public purchaseTimestamp; // tierId => user => timestamp
    mapping(address => bool) public authorizedVerifiers; // Who can check people in

    uint256 public tierCounter;
    string public baseMetadataURI;

    // Events
    event TicketTierCreated(uint256 indexed tierId, string eventId, string name, uint256 price, uint256 maxSupply);
    event TicketMinted(uint256 indexed tierId, string eventId, address indexed buyer, uint256 timestamp);
    event TicketCheckedIn(string indexed eventId, address indexed attendee, uint256 timestamp);
    event VerifierAuthorized(address indexed verifier, bool authorized);

    constructor(string memory _baseURI) ERC1155(_baseURI) {
        baseMetadataURI = _baseURI;
    }

    /**
     * @dev Create a new ticket tier
     */
    function createTicketTier(
        string memory _eventId,
        string memory _name,
        uint256 _price,
        uint256 _maxSupply,
        address _organizer
    ) external onlyOwner returns (uint256) {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_organizer != address(0), "Invalid organizer address");

        tierCounter++;
        ticketTiers[tierCounter] = TicketTier({
            tierId: tierCounter,
            eventId: _eventId,
            name: _name,
            price: _price,
            maxSupply: _maxSupply,
            sold: 0,
            isActive: true,
            organizer: _organizer
        });

        emit TicketTierCreated(tierCounter, _eventId, _name, _price, _maxSupply);
        return tierCounter;
    }

    /**
     * @dev Mint a ticket (purchase)
     */
    function mintTicket(uint256 _tierId) external payable nonReentrant {
        TicketTier storage tier = ticketTiers[_tierId];

        require(tier.isActive, "Ticket tier not active");
        require(tier.sold < tier.maxSupply, "Sold out");
        require(msg.value >= tier.price, "Insufficient payment");
        require(balanceOf(msg.sender, _tierId) == 0, "Already owns ticket");

        _mint(msg.sender, _tierId, 1, "");

        tier.sold++;
        purchaseTimestamp[_tierId][msg.sender] = block.timestamp;

        (bool success, ) = tier.organizer.call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit TicketMinted(_tierId, tier.eventId, msg.sender, block.timestamp);
    }

    /**
     * @dev Check-in at venue
     */
    function checkIn(
        string memory _eventId,
        address _attendee,
        uint256 _tierId
    ) external {
        TicketTier memory tier = ticketTiers[_tierId];

        require(
            msg.sender == tier.organizer ||
            msg.sender == owner() ||
            authorizedVerifiers[msg.sender],
            "Not authorized to check in"
        );
        require(balanceOf(_attendee, _tierId) > 0, "No ticket owned");
        require(!hasCheckedIn[_eventId][_attendee], "Already checked in");
        require(
            keccak256(abi.encodePacked(tier.eventId)) == keccak256(abi.encodePacked(_eventId)),
            "Ticket not for this event"
        );

        hasCheckedIn[_eventId][_attendee] = true;

        emit TicketCheckedIn(_eventId, _attendee, block.timestamp);
    }

    /**
     * @dev Verify ticket ownership and validity
     */
    function verifyTicket(
        string memory _eventId,
        address _attendee,
        uint256 _tierId
    ) external view returns (bool isValid, string memory reason) {
        TicketTier memory tier = ticketTiers[_tierId];

        if (balanceOf(_attendee, _tierId) == 0) {
            return (false, "No ticket owned");
        }

        if (keccak256(abi.encodePacked(tier.eventId)) != keccak256(abi.encodePacked(_eventId))) {
            return (false, "Ticket not for this event");
        }

        if (hasCheckedIn[_eventId][_attendee]) {
            return (false, "Already checked in");
        }

        return (true, "Valid ticket");
    }

    function setVerifier(address _verifier, bool _authorized) external onlyOwner {
        authorizedVerifiers[_verifier] = _authorized;
        emit VerifierAuthorized(_verifier, _authorized);
    }

    function setTicketTierActive(uint256 _tierId, bool _isActive) external onlyOwner {
        ticketTiers[_tierId].isActive = _isActive;
    }

    function updateTicketPrice(uint256 _tierId, uint256 _newPrice) external {
        TicketTier storage tier = ticketTiers[_tierId];
        require(msg.sender == tier.organizer || msg.sender == owner(), "Not authorized");
        tier.price = _newPrice;
    }

    function getTicketTier(uint256 _tierId) external view returns (TicketTier memory) {
        return ticketTiers[_tierId];
    }

    function uri(uint256 _tierId) public view override returns (string memory) {
        return string(abi.encodePacked(baseMetadataURI, _tierId.toString(), ".json"));
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseMetadataURI = _newBaseURI;
        emit URI(_newBaseURI, 0);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0)) return;

        for (uint256 i = 0; i < ids.length; i++) {
            TicketTier memory tier = ticketTiers[ids[i]];
            require(
                !hasCheckedIn[tier.eventId][from],
                "Cannot transfer ticket after check-in"
            );
        }
    }
}
