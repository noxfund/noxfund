// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * ███╗   ██╗ ██████╗ ██╗  ██╗    ███████╗██╗   ██╗███╗   ██╗██████╗
 * ████╗  ██║██╔═══██╗╚██╗██╔╝    ██╔════╝██║   ██║████╗  ██║██╔══██╗
 * ██╔██╗ ██║██║   ██║ ╚███╔╝     █████╗  ██║   ██║██╔██╗ ██║██║  ██║
 * ██║╚██╗██║██║   ██║ ██╔██╗     ██╔══╝  ██║   ██║██║╚██╗██║██║  ██║
 * ██║ ╚████║╚██████╔╝██╔╝ ██╗    ██║     ╚██████╔╝██║ ╚████║██████╔╝
 * ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝
 *
 * @title  NoxFund - Immutable Passive Income Protocol
 * @author NOX Fund Team
 * @notice Completely trustless, ownerless ROI contract using USDT on BNB Smart Chain
 * @dev    All economic parameters are immutable compile-time constants
 *
 * Deployed at: 0x433830E36585bdACC840E1caB419C4211bBf13f5
 * Verified Source: https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code#F7#L1
 *
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                         ECONOMIC MODEL                                ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║ • 1.5% Daily ROI         → Claimable anytime on FULL deposit amount  ║
 * ║ • 45-Day Capital Lock    → Principal unlocks after maturity          ║
 * ║ • 547.5% Maximum ROI     → 365 days max, enforced per deposit        ║
 * ║ • 5% Deposit Fee         → Paid by pool, NOT deducted from user ROI  ║
 * ║ • 20% Referral System    → Distributed across 7 upline levels        ║
 * ║                                                                       ║
 * ║   Referral Breakdown:    L1: 8%  | L2: 4%   | L3: 3%   | L4: 2%     ║
 * ║                          L5: 1.5%| L6: 1%   | L7: 0.5%               ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                      TRUSTLESS GUARANTEES                             ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║ ✓ No Owner               No admin functions or privileged roles      ║
 * ║ ✓ No Proxy               Direct implementation, no delegatecall      ║
 * ║ ✓ No Upgrades            Cannot be altered after deployment          ║
 * ║ ✓ No Pause               Contract runs perpetually                   ║
 * ║ ✓ Immutable Constants    All parameters permanently fixed            ║
 * ║ ✓ Pull Payments          Users control all withdrawals               ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
contract NoxFund {
    using SafeERC20 for IERC20;

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                            CONSTANTS                                  ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /// @dev USDT token contract on BNB Smart Chain (Mainnet) - 18 decimals
    IERC20 private constant USDT = IERC20(0x55d398326f99059fF775485246999027B3197955);

    /// @dev Basis points denominator: 10,000 = 100.00%
    uint256 private constant BPS = 10_000;
    
    /// @dev Daily ROI in basis points: 150 = 1.5% per day
    uint256 private constant DAILY_ROI = 150;
    
    /// @dev Principal lock period: 45 days
    uint256 private constant LOCK_PERIOD = 45 days;
    
    /// @dev Deposit fee in basis points: 500 = 5%
    uint256 private constant FEE_BPS = 500;
    
    /// @dev Maximum ROI accumulation: 365 days × 1.5% = 547.5% total cap per deposit
    uint256 private constant MAX_ROI_DAYS = 365;
    
    /// @dev Minimum deposit amount: 1 USDT with 18 decimals
    uint256 private constant MIN_DEPOSIT = 1 ether; // 1e18
    
    /// @dev Maximum deposits per wallet: 200
    uint256 private constant MAX_DEPOSITS_PER_USER = 200;

    /// @dev Fee recipient wallet address (immutable)
    address private constant FEE_RECIPIENT = 0xC9Bdfe5597e9030114860059045f3893DE84a1F6;

    /// @dev 7-Level referral commission structure (total: 20%)
    uint256 private constant REF1 = 800;  // Level 1:  8.0%
    uint256 private constant REF2 = 400;  // Level 2:  4.0%
    uint256 private constant REF3 = 300;  // Level 3:  3.0%
    uint256 private constant REF4 = 200;  // Level 4:  2.0%
    uint256 private constant REF5 = 150;  // Level 5:  1.5%
    uint256 private constant REF6 = 100;  // Level 6:  1.0%
    uint256 private constant REF7 = 50;   // Level 7:  0.5%

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                          STATE VARIABLES                              ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /// @notice Total referral earnings currently pending withdrawal
    uint256 public totalPendingReferrals;
    
    /// @dev Reentrancy guard state: 0 = unlocked, 1 = locked
    uint256 private _status;

    /**
     * @notice User deposit data structure
     */
    struct Deposit {
        uint128 principal;           // Original deposit amount in USDT (18 decimals)
        uint64  startTime;           // Unix timestamp when deposit was made
        uint64  lastClaimTime;       // Unix timestamp of most recent ROI claim
        uint32  totalROIDaysClaimed; // Total number of ROI days claimed (max 365)
        uint128 preservedROI;        // ROI preserved when principal withdrawn without liquidity
    }

    /// @notice All deposits for each user address
    mapping(address => Deposit[]) public deposits;

    /// @notice Referrer (upline) for each user address (locked on first deposit)
    mapping(address => address) public referrer;
    
    /// @notice Flag if referrer has been set (prevents changes)
    mapping(address => bool) public referrerLocked;

    /// @notice User-specific statistics and balances
    mapping(address => uint256) public refBalance;
    mapping(address => uint256) public totalDeposited;
    mapping(address => uint256) public totalWithdrawnROI;
    mapping(address => uint256) public totalWithdrawnPrincipal;
    mapping(address => uint256) public totalReferralEarned;

    /// @notice Protocol-wide statistics
    uint256 public globalDeposited;
    uint256 public globalWithdrawnROI;
    uint256 public globalWithdrawnPrincipal;
    uint256 public totalParticipants;

    /// @dev Internal flag: has this address ever deposited?
    mapping(address => bool) private _hasDeposited;

    /// @notice Vanity username system
    mapping(string => address) public usernameToAddress;
    mapping(address => string) public addressToUsername;
    uint256 public totalUsernames;

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                              EVENTS                                   ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    event Deposited(address indexed user, uint256 indexed depositIndex, uint256 amount, address indexed ref);
    event FeeSent(address indexed recipient, uint256 amount);
    event ROIWithdrawn(address indexed user, uint256 indexed depositIndex, uint256 amount, uint256 daysClaimed);
    event PrincipalWithdrawn(address indexed user, uint256 indexed depositIndex, uint256 principal, uint256 roi);
    event ReferralPaid(address indexed recipient, address indexed depositor, uint256 level, uint256 amount);
    event ReferralWithdrawn(address indexed recipient, uint256 amount);
    event UsernameClaimed(address indexed user, string username);

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                            MODIFIERS                                  ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    modifier nonReentrant() {
        require(_status == 0, "NoxFund: reentrant call");
        _status = 1;
        _;
        _status = 0;
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      VANITY USERNAME SYSTEM                           ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Claim a vanity username for readable referral links
     * @param  _username  Desired username (3-20 alphanumeric characters)
     */
    function claimUsername(string calldata _username) external {
        string memory usernameLower = _toLower(_username);
        bytes memory usernameBytes = bytes(usernameLower);
        
        require(usernameBytes.length >= 3,  "NoxFund: username too short (min 3)");
        require(usernameBytes.length <= 20, "NoxFund: username too long (max 20)");
        // AUDIT FIX #14: Block usernames starting with "0x" to prevent resolver conflicts
        require(!(usernameBytes.length >= 2 && usernameBytes[0] == '0' && usernameBytes[1] == 'x'), "NoxFund: username cannot start with 0x");
        require(_isAlphanumeric(usernameBytes), "NoxFund: only alphanumeric allowed");
        require(usernameToAddress[usernameLower] == address(0), "NoxFund: username already taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "NoxFund: you already have a username");

        usernameToAddress[usernameLower] = msg.sender;
        addressToUsername[msg.sender] = usernameLower;
        totalUsernames++;

        emit UsernameClaimed(msg.sender, usernameLower);
    }

    /**
     * @notice Resolve a referral identifier to a wallet address
     * @param  _identifier  Username or address
     * @return Resolved wallet address
     */
    function resolveReferral(string calldata _identifier) external view returns (address) {
        bytes memory identBytes = bytes(_identifier);
        if (identBytes.length >= 2 && identBytes[0] == '0' && (identBytes[1] == 'x' || identBytes[1] == 'X')) {
            return address(0);
        }
        
        string memory identLower = _toLower(_identifier);
        return usernameToAddress[identLower];
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                            DEPOSIT                                    ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Deposit USDT into the protocol and start earning 1.5% daily ROI
     * @param  _amount      Amount of USDT to deposit (18 decimals)
     * @param  _refAddress  Referrer wallet address
     */
    function deposit(uint256 _amount, address _refAddress) external nonReentrant {
        _processDeposit(_amount, _refAddress);
    }

    /**
     * @notice Deposit USDT using a vanity username as referrer
     * @param  _amount       Amount of USDT to deposit
     * @param  _refUsername  Referrer's username
     */
    function depositWithUsername(uint256 _amount, string calldata _refUsername) external nonReentrant {
        string memory refLower = _toLower(_refUsername);
        address refAddress = usernameToAddress[refLower];
        // AUDIT FIX #8: Validate username exists to prevent locking with invalid referrer
        require(refAddress != address(0), "NoxFund: username not found");
        _processDeposit(_amount, refAddress);
    }

    function _processDeposit(uint256 _amount, address _ref) internal {
        require(_amount >= MIN_DEPOSIT, "NoxFund: below minimum deposit");
        require(_amount <= type(uint128).max, "NoxFund: deposit too large");
        require(msg.sender != _ref, "NoxFund: self-referral");
        require(deposits[msg.sender].length < MAX_DEPOSITS_PER_USER, "NoxFund: deposit limit reached");

        // Lock referrer on first deposit and require referrer to be active depositor
        if (!referrerLocked[msg.sender]) {
            if (_ref != address(0)) {
                require(_hasDeposited[_ref], "NoxFund: referrer must be active depositor");
                require(!_chainContains(_ref, msg.sender), "NoxFund: circular referral");
                referrer[msg.sender] = _ref;
            }
            referrerLocked[msg.sender] = true;
        }

        uint256 fee = (_amount * FEE_BPS) / BPS;

        uint64 ts = uint64(block.timestamp);
        deposits[msg.sender].push(Deposit({
            principal:           uint128(_amount),
            startTime:           ts,
            lastClaimTime:       ts,
            totalROIDaysClaimed: 0,
            preservedROI:        0
        }));
        uint256 idx = deposits[msg.sender].length - 1;

        totalDeposited[msg.sender] += _amount;
        globalDeposited            += _amount;

        if (!_hasDeposited[msg.sender]) {
            _hasDeposited[msg.sender] = true;
            totalParticipants++;
        }

        emit Deposited(msg.sender, idx, _amount, referrer[msg.sender]);

        _payReferrals(msg.sender, _amount);

        USDT.safeTransferFrom(msg.sender, address(this), _amount);
        USDT.safeTransfer(FEE_RECIPIENT, fee);
        
        emit FeeSent(FEE_RECIPIENT, fee);
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                        ROI WITHDRAWAL                                 ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Claim accumulated ROI for a specific deposit
     * @param  _index  Index of deposit in caller's deposits array
     * @dev Properly tracks days claimed and preserves fractional time
     */
    function withdrawROI(uint256 _index) external nonReentrant {
        Deposit storage dep = _dep(msg.sender, _index);
        (uint256 roi, uint256 daysToCredit) = _pendingROI(dep);
        
        require(roi > 0, "NoxFund: nothing to claim");
        
        // Use actual USDT balance
        uint256 available = _availableBalance();
        require(available >= roi, "NoxFund: pool insufficient");

        // AUDIT FIX #4: If this is preserved ROI (principal already withdrawn), clear it
        if (dep.principal == 0 && dep.preservedROI > 0) {
            dep.preservedROI = 0; // Clear the preserved amount
        } else {
            // Normal ROI claim - track days and preserve fractional time
            dep.totalROIDaysClaimed += uint32(daysToCredit);
            // AUDIT FIX #2: Preserve fractional time by advancing only credited days
            dep.lastClaimTime = uint64(uint256(dep.lastClaimTime) + (daysToCredit * 1 days));
        }
        
        totalWithdrawnROI[msg.sender] += roi;
        globalWithdrawnROI            += roi;

        emit ROIWithdrawn(msg.sender, _index, roi, daysToCredit);
        _sendUSDT(msg.sender, roi);
    }

    /**
     * @notice Claim ROI across all deposits in a single transaction
     */
    function withdrawAllROI() external nonReentrant {
        Deposit[] storage deps = deposits[msg.sender];
        require(deps.length > 0, "NoxFund: no deposits");

        uint256 total;
        uint256 available = _availableBalance();
        
        for (uint256 i; i < deps.length; ++i) {
            (uint256 roi, uint256 daysToCredit) = _pendingROI(deps[i]);
            if (roi > 0 && available >= total + roi) {
                // AUDIT FIX #3: If this is preserved ROI (principal already withdrawn), clear it
                if (deps[i].principal == 0 && deps[i].preservedROI > 0) {
                    deps[i].preservedROI = 0; // Clear the preserved amount
                } else {
                    // Normal ROI claim - track days and preserve fractional time
                    deps[i].totalROIDaysClaimed += uint32(daysToCredit);
                    // AUDIT FIX #2: Preserve fractional time by advancing only credited days
                    deps[i].lastClaimTime = uint64(uint256(deps[i].lastClaimTime) + (daysToCredit * 1 days));
                }
                total += roi;
                emit ROIWithdrawn(msg.sender, i, roi, daysToCredit);
            }
        }
        require(total > 0, "NoxFund: nothing to claim");

        totalWithdrawnROI[msg.sender] += total;
        globalWithdrawnROI            += total;
        _sendUSDT(msg.sender, total);
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      PRINCIPAL WITHDRAWAL                             ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Withdraw principal after 45-day lock period expires
     * @param  _index  Index of deposit in caller's deposits array
     * @dev Separated principal and ROI withdrawals for independent operation
     */
    function withdrawPrincipal(uint256 _index) external nonReentrant {
        Deposit storage dep = _dep(msg.sender, _index);
        
        require(block.timestamp >= uint256(dep.startTime) + LOCK_PERIOD, "NoxFund: capital still locked");
        require(dep.principal > 0, "NoxFund: already withdrawn");

        uint256 principal = uint256(dep.principal);
        
        // Only require principal to be available, not principal + ROI
        uint256 available = _availableBalance();
        require(available >= principal, "NoxFund: pool insufficient for principal");

        // Claim any pending ROI separately if available
        (uint256 roi, uint256 daysToCredit) = _pendingROI(dep);
        uint256 payout = principal;
        uint256 roiPaid = 0; // AUDIT FIX #12: Track actual ROI paid for event
        
        if (roi > 0 && available >= principal + roi) {
            // Full withdrawal: principal + ROI
            dep.totalROIDaysClaimed += uint32(daysToCredit);
            // AUDIT FIX #2: Preserve fractional time
            dep.lastClaimTime = uint64(uint256(dep.lastClaimTime) + (daysToCredit * 1 days));
            payout += roi;
            roiPaid = roi; // AUDIT FIX #12: Record actual paid amount
            totalWithdrawnROI[msg.sender] += roi;
            globalWithdrawnROI += roi;
            emit ROIWithdrawn(msg.sender, _index, roi, daysToCredit);
        } else if (roi > 0) {
            // AUDIT FIX #4: Insufficient funds for ROI - preserve it for later withdrawal
            // Store the unpaid ROI amount in the deposit so user can claim it later via withdrawROI()
            dep.preservedROI = uint128(roi);
            dep.totalROIDaysClaimed += uint32(daysToCredit);
            dep.lastClaimTime = uint64(uint256(dep.lastClaimTime) + (daysToCredit * 1 days));
        }

        dep.principal = 0; // Mark deposit as withdrawn

        totalWithdrawnPrincipal[msg.sender] += principal;
        globalWithdrawnPrincipal += principal;

        emit PrincipalWithdrawn(msg.sender, _index, principal, roiPaid); // AUDIT FIX #12: Emit actual paid ROI
        _sendUSDT(msg.sender, payout);
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                     REFERRAL WITHDRAWAL                               ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @notice Withdraw all accumulated referral commissions
     */
    function withdrawReferral() external nonReentrant {
        uint256 amount = refBalance[msg.sender];
        require(amount > 0, "NoxFund: no referral balance");

        refBalance[msg.sender]   = 0;
        totalPendingReferrals   -= amount;
        
        emit ReferralWithdrawn(msg.sender, amount);
        _sendUSDT(msg.sender, amount);
    }

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                         VIEW FUNCTIONS                                ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    function pendingROI(address _user, uint256 _index) external view returns (uint256 roi, uint256 days_) {
        return _pendingROI(_dep(_user, _index));
    }

    function pendingROIAll(address _user) external view returns (uint256 total) {
        Deposit[] storage deps = deposits[_user];
        for (uint256 i; i < deps.length; ++i) {
            (uint256 roi,) = _pendingROI(deps[i]);
            total += roi;
        }
    }

    function depositCount(address _user) external view returns (uint256) {
        return deposits[_user].length;
    }

    function timeUntilUnlock(address _user, uint256 _index) external view returns (uint256) {
        Deposit storage dep = _dep(_user, _index);
        uint256 unlockAt = uint256(dep.startTime) + LOCK_PERIOD;
        return block.timestamp >= unlockAt ? 0 : unlockAt - block.timestamp;
    }

    function depositInfo(address _user, uint256 _index)
        external view
        returns (
            uint256 principal_,
            uint256 startTime_,
            uint256 lastClaimTime_,
            uint256 maturesAt_,
            uint256 totalROIDaysClaimed_,
            uint256 remainingROIDays_,
            uint256 daysElapsed_,
            uint256 daysUnclaimed_,
            uint256 pendingROI_,
            bool    isMatured_,
            bool    isWithdrawn_,
            bool    isROIMaxed_
        )
    {
        Deposit storage d = _dep(_user, _index);
        principal_     = d.principal;
        startTime_     = d.startTime;
        lastClaimTime_ = d.lastClaimTime;
        maturesAt_     = uint256(d.startTime) + LOCK_PERIOD;
        totalROIDaysClaimed_ = d.totalROIDaysClaimed;
        remainingROIDays_ = d.totalROIDaysClaimed >= MAX_ROI_DAYS ? 0 : MAX_ROI_DAYS - d.totalROIDaysClaimed;
        daysElapsed_   = (block.timestamp - uint256(d.startTime)) / 1 days;
        (pendingROI_, daysUnclaimed_) = _pendingROI(d);
        isMatured_     = block.timestamp >= uint256(d.startTime) + LOCK_PERIOD;
        isWithdrawn_   = d.principal == 0;
        isROIMaxed_    = d.totalROIDaysClaimed >= MAX_ROI_DAYS;
    }

    function contractInfo()
        external view
        returns (
            uint256 contractBalance_,
            uint256 availableBalance_,
            uint256 totalPendingReferrals_,
            uint256 globalDeposited_,
            uint256 globalWithdrawnROI_,
            uint256 globalWithdrawnPrincipal_,
            uint256 totalParticipants_
        )
    {
        return (
            USDT.balanceOf(address(this)),
            _availableBalance(),
            totalPendingReferrals,
            globalDeposited,
            globalWithdrawnROI,
            globalWithdrawnPrincipal,
            totalParticipants
        );
    }

    function referralChain(address _user) external view returns (address[7] memory chain) {
        address cur = _user;
        for (uint256 i; i < 7; ++i) {
            cur = referrer[cur];
            if (cur == address(0)) break;
            chain[i] = cur;
        }
    }

    /**
     * @notice Get all protocol constants
     */
    function getConstants()
        external pure
        returns (
            uint256 dailyROI_bps,
            uint256 lockPeriod_seconds,
            uint256 feeBps,
            address feeRecipient,
            uint256 maxROIDays,
            uint256 minDeposit,
            uint256 maxDepositsPerUser,
            address usdtToken,
            uint256 ref1, uint256 ref2, uint256 ref3,
            uint256 ref4, uint256 ref5, uint256 ref6, uint256 ref7
        )
    {
        return (
            DAILY_ROI,
            LOCK_PERIOD,
            FEE_BPS,
            FEE_RECIPIENT,
            MAX_ROI_DAYS,
            MIN_DEPOSIT,
            MAX_DEPOSITS_PER_USER,
            address(USDT),
            REF1, REF2, REF3, REF4, REF5, REF6, REF7
        );
    }


    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                       INTERNAL HELPERS                                ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    /**
     * @dev Only pays referrals to active depositors
     */
    function _payReferrals(address _depositor, uint256 _amount) internal {
        uint256[7] memory pcts = [REF1, REF2, REF3, REF4, REF5, REF6, REF7];
        address cur = referrer[_depositor];
        
        for (uint256 lvl; lvl < 7; ++lvl) {
            if (cur == address(0)) break;
            
            // Skip referrers who aren't active depositors
            if (!_hasDeposited[cur]) {
                cur = referrer[cur];
                continue;
            }
            
            uint256 reward = (_amount * pcts[lvl]) / BPS;
            
            refBalance[cur]          += reward;
            totalPendingReferrals    += reward;
            totalReferralEarned[cur] += reward;
            
            emit ReferralPaid(cur, _depositor, lvl + 1, reward);
            
            cur = referrer[cur];
        }
    }


    function _chainContains(address _start, address _target) internal view returns (bool) {
        address cur = _start;
        for (uint256 i; i < 7; ++i) {
            if (cur == address(0)) return false;
            if (cur == _target)    return true;
            cur = referrer[cur];
        }
        return false;
    }

    /**
     * @dev Properly calculates pending ROI with day tracking and fractional time
     * @return roi The pending ROI amount
     * @return daysToCredit The number of days to credit (capped by remaining allowed days)
     */
    function _pendingROI(Deposit storage d) internal view returns (uint256 roi, uint256 daysToCredit) {
        // AUDIT FIX #4: If principal withdrawn but ROI was preserved, return that
        if (d.principal == 0) {
            if (d.preservedROI > 0) {
                return (uint256(d.preservedROI), 0); // Return preserved amount, 0 days (already credited)
            }
            return (0, 0);
        }
        
        // Check if maximum ROI has been reached
        if (d.totalROIDaysClaimed >= MAX_ROI_DAYS) return (0, 0);
        
        uint256 remainingDays = MAX_ROI_DAYS - d.totalROIDaysClaimed;
        
        // Calculate days since last claim (fractional time preserved by timestamp)
        uint256 daysSinceLastClaim = (block.timestamp - uint256(d.lastClaimTime)) / 1 days;
        
        if (daysSinceLastClaim == 0) return (0, 0);
        
        // Cap days to credit by remaining allowed days
        daysToCredit = daysSinceLastClaim > remainingDays ? remainingDays : daysSinceLastClaim;
        
        roi = (uint256(d.principal) * DAILY_ROI * daysToCredit) / BPS;
    }

    /**
     * @dev Returns actual available balance (USDT balance minus reserved referrals)
     */
    function _availableBalance() internal view returns (uint256) {
        uint256 balance = USDT.balanceOf(address(this));
        // Referrals are already reserved, so available = total - reserved
        return balance > totalPendingReferrals ? balance - totalPendingReferrals : 0;
    }

    function _dep(address _user, uint256 _i) internal view returns (Deposit storage) {
        require(_i < deposits[_user].length, "NoxFund: invalid index");
        return deposits[_user][_i];
    }

    function _sendUSDT(address _to, uint256 _amount) internal {
        USDT.safeTransfer(_to, _amount);
    }

    function _toLower(string memory _str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        bytes memory lowerBytes = new bytes(strBytes.length);
        
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] >= 0x41 && strBytes[i] <= 0x5A) {
                lowerBytes[i] = bytes1(uint8(strBytes[i]) + 32);
            } else {
                lowerBytes[i] = strBytes[i];
            }
        }
        
        return string(lowerBytes);
    }

    function _isAlphanumeric(bytes memory _bytes) internal pure returns (bool) {
        for (uint256 i = 0; i < _bytes.length; i++) {
            bytes1 char = _bytes[i];
            bool isLower = (char >= 0x61 && char <= 0x7A);
            bool isDigit = (char >= 0x30 && char <= 0x39);
            
            if (!isLower && !isDigit) {
                return false;
            }
        }
        
        return true;
    }
}
