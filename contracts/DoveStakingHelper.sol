// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import './interfaces/IERC20.sol';
import './interfaces/IDoveStaking.sol';

contract DoveStakingHelper {
    address public immutable staking;
    address public immutable CLAM;

    constructor(address _staking, address _CLAM) {
        require(_staking != address(0));
        staking = _staking;
        require(_CLAM != address(0));
        CLAM = _CLAM;
    }

    function stake(uint256 _amount, address _recipient) external {
        IERC20(CLAM).transferFrom(msg.sender, address(this), _amount);
        IERC20(CLAM).approve(staking, _amount);
        IDoveStaking(staking).stake(_amount, _recipient);
        IDoveStaking(staking).claim(_recipient);
    }
}
