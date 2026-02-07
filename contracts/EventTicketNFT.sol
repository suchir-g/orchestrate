// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title EventTicketNFT
 * @dev Smart contract for managing event tickets as NFTs on the blockchain
 * Features:
 * - Mint tickets for events
 * - Transfer tickets between users
 * - Validate ticket authenticity
 * - Track ticket usage/redemption
 * - Event organizer controls
 */
contract EventTicketNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Ticket {
        uint256 eventId;
        string eventName;
        string eventDate;
        string ticketType;
        uint256 price;
        bool isUsed;
        address originalOwner;
        uint256 createdAt;
    }

    struct Event {
        uint256 eventId;
        string name;
        string date;
        string location;
        address organizer;
        uint256 totalTickets;
        uint256 soldTickets;
        bool isActive;
        uint256 createdAt;
    }

    // Mappings
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => Event) public events;
    mapping(address => bool) public authorizedValidators;
    mapping(uint256 => mapping(address => uint256)) public eventTicketBalance;

    // Events
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address recipient);
    event TicketUsed(uint256 indexed tokenId, address validator);
    event ValidatorAuthorized(address validator);
    event ValidatorRevoked(address validator);

    constructor() ERC721("EventTicket", "ETKT") {}

    modifier onlyEventOrganizer(uint256 eventId) {
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        _;
    }

    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Not authorized validator");
        _;
    }

    /**
     * @dev Create a new event
     */
    function createEvent(
        string memory name,
        string memory date,
        string memory location,
        uint256 totalTickets
    ) external returns (uint256) {
        uint256 eventId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        events[eventId] = Event({
            eventId: eventId,
            name: name,
            date: date,
            location: location,
            organizer: msg.sender,
            totalTickets: totalTickets,
            soldTickets: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        emit EventCreated(eventId, name, msg.sender);
        return eventId;
    }

    /**
     * @dev Mint a new ticket for an event
     */
    function mintTicket(
        address recipient,
        uint256 eventId,
        string memory ticketType,
        uint256 price,
        string memory tokenURI
    ) external onlyEventOrganizer(eventId) returns (uint256) {
        require(events[eventId].isActive, "Event is not active");
        require(
            events[eventId].soldTickets < events[eventId].totalTickets,
            "All tickets sold"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tickets[tokenId] = Ticket({
            eventId: eventId,
            eventName: events[eventId].name,
            eventDate: events[eventId].date,
            ticketType: ticketType,
            price: price,
            isUsed: false,
            originalOwner: recipient,
            createdAt: block.timestamp
        });

        events[eventId].soldTickets++;
        eventTicketBalance[eventId][recipient]++;

        emit TicketMinted(tokenId, eventId, recipient);
        return tokenId;
    }

    /**
     * @dev Batch mint multiple tickets
     */
    function batchMintTickets(
        address[] memory recipients,
        uint256 eventId,
        string memory ticketType,
        uint256 price,
        string memory baseTokenURI
    ) external onlyEventOrganizer(eventId) returns (uint256[] memory) {
        require(events[eventId].isActive, "Event is not active");
        require(
            events[eventId].soldTickets + recipients.length <= events[eventId].totalTickets,
            "Not enough tickets available"
        );

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))));

            tickets[tokenId] = Ticket({
                eventId: eventId,
                eventName: events[eventId].name,
                eventDate: events[eventId].date,
                ticketType: ticketType,
                price: price,
                isUsed: false,
                originalOwner: recipients[i],
                createdAt: block.timestamp
            });

            eventTicketBalance[eventId][recipients[i]]++;
            tokenIds[i] = tokenId;

            emit TicketMinted(tokenId, eventId, recipients[i]);
        }

        events[eventId].soldTickets += recipients.length;
        return tokenIds;
    }

    /**
     * @dev Use/redeem a ticket (only by authorized validators)
     */
    function useTicket(uint256 tokenId) external onlyValidator {
        require(_exists(tokenId), "Ticket does not exist");
        require(!tickets[tokenId].isUsed, "Ticket already used");

        tickets[tokenId].isUsed = true;
        emit TicketUsed(tokenId, msg.sender);
    }

    /**
     * @dev Validate ticket authenticity and usage status
     */
    function validateTicket(uint256 tokenId) external view returns (
        bool exists,
        bool isUsed,
        address owner,
        string memory eventName,
        string memory eventDate
    ) {
        if (!_exists(tokenId)) {
            return (false, false, address(0), "", "");
        }

        Ticket memory ticket = tickets[tokenId];
        return (
            true,
            ticket.isUsed,
            ownerOf(tokenId),
            ticket.eventName,
            ticket.eventDate
        );
    }

    /**
     * @dev Get ticket details
     */
    function getTicketDetails(uint256 tokenId) external view returns (Ticket memory) {
        require(_exists(tokenId), "Ticket does not exist");
        return tickets[tokenId];
    }

    /**
     * @dev Get event details
     */
    function getEventDetails(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get user's tickets for a specific event
     */
    function getUserEventTickets(address user, uint256 eventId) external view returns (uint256[] memory) {
        uint256 balance = eventTicketBalance[eventId][user];
        uint256[] memory userTickets = new uint256[](balance);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && tickets[i].eventId == eventId && ownerOf(i) == user) {
                userTickets[currentIndex] = i;
                currentIndex++;
            }
        }

        return userTickets;
    }

    /**
     * @dev Authorize a validator
     */
    function authorizeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = true;
        emit ValidatorAuthorized(validator);
    }

    /**
     * @dev Revoke validator authorization
     */
    function revokeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = false;
        emit ValidatorRevoked(validator);
    }

    /**
     * @dev Deactivate an event
     */
    function deactivateEvent(uint256 eventId) external onlyEventOrganizer(eventId) {
        events[eventId].isActive = false;
    }

    /**
     * @dev Override transfer functions to update balances
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != address(0) && to != address(0)) {
            uint256 eventId = tickets[tokenId].eventId;
            eventTicketBalance[eventId][from]--;
            eventTicketBalance[eventId][to]++;
        }
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}