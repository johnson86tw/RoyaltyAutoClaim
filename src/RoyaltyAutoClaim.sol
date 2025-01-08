// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UUPSProxy is ERC1967Proxy {
    constructor(address _implementation, bytes memory _data) payable ERC1967Proxy(_implementation, _data) {
        (bool success,) = _implementation.delegatecall(_data);
        require(success, "Initialization failed");
    }
}

contract RoyaltyAutoClaim is UUPSUpgradeable, OwnableUpgradeable {
    string internal constant RENUNCIATION_DISABLED = "Renouncing ownership is disabled";

    address public admin;
    address public token; // 稿費幣種
    address[] public reviewers;

    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner, address _admin, address _token, address[] memory _reviewers)
        public
        initializer
    {
        __Ownable_init(_owner);
        admin = _admin;
        token = _token;
        reviewers = _reviewers;
    }

    // ================================ Ownership ================================

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function changeAdmin(address _admin) public onlyOwner {
        admin = _admin;
    }

    function changeRoyaltyToken(address _token) public onlyOwner {
        token = _token;
    }

    function renounceOwnership() public pure override {
        revert(RENUNCIATION_DISABLED);
    }
}
