// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ERC20.sol";

/**
 * @title MockXSGD
 * @notice Thin wrapper around your own ERC20 code, just changes name/symbol/decimals.
 */

contract MockXSGD is ERC20 {
    constructor() {
        // owner is already set in your ERC20 base (msg.sender)
        // nothing extra needed
    }

    // Override decimals to use 6 (XSGD-style)
    function decimals() public override pure returns (uint8) {
        return 6;
    }

    // Everything else (mint, transfer, approve, etc.) comes from your ERC20.sol
}
