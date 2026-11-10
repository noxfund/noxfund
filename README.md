<div align="center">

# 🦊 NoxFund Smart Contract

### Immutable Passive Income Protocol on BNB Smart Chain

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![BNB Chain](https://img.shields.io/badge/BNB_Chain-Mainnet-F3BA2F?style=for-the-badge&logo=binance)](https://www.bnbchain.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Verified](https://img.shields.io/badge/Contract-Verified-success?style=for-the-badge&logo=ethereum)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code)

[![Website](https://img.shields.io/badge/🌐_Website-noxfund.com-blueviolet?style=for-the-badge)](https://noxfund.com)
[![Telegram](https://img.shields.io/badge/💬_Telegram-Join_Community-blue?style=for-the-badge&logo=telegram)](https://t.me/noxfundchat)
[![BSCScan](https://img.shields.io/badge/📊_BSCScan-Contract-yellow?style=for-the-badge)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5)
[![Security Audit](https://img.shields.io/badge/🛡️_Audit-Passed-brightgreen?style=for-the-badge)](https://github.com/noxfund/noxfund/blob/main/audit)
[![Solidity Scan](https://img.shields.io/badge/🔍_Solidity_Scan-Verified-blue?style=for-the-badge)](https://solidityscan.com/)

</div>

---

## 📋 Contract Information

| Property | Value |
|----------|-------|
| **Contract Address** | [`0x433830E36585bdACC840E1caB419C4211bBf13f5`](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5) |
| **Network** | BNB Smart Chain (BSC) Mainnet |
| **Token** | USDT (0x55d398326f99059fF775485246999027B3197955) |
| **Compiler** | Solidity ^0.8.24 |
| **License** | MIT |

---

## 🎯 Protocol Features

```
███╗   ██╗ ██████╗ ██╗  ██╗    ███████╗██╗   ██╗███╗   ██╗██████╗
████╗  ██║██╔═══██╗╚██╗██╔╝    ██╔════╝██║   ██║████╗  ██║██╔══██╗
██╔██╗ ██║██║   ██║ ╚███╔╝     █████╗  ██║   ██║██╔██╗ ██║██║  ██║
██║╚██╗██║██║   ██║ ██╔██╗     ██╔══╝  ██║   ██║██║╚██╗██║██║  ██║
██║ ╚████║╚██████╔╝██╔╝ ██╗    ██║     ╚██████╔╝██║ ╚████║██████╔╝
╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝
```

### 💰 Economic Model

| Feature | Details |
|---------|---------|
| **Daily ROI** | 1.5% per day on full deposit amount |
| **Capital Lock** | 45 days - principal unlocks after maturity |
| **Maximum ROI** | 547.5% (365 days maximum) |
| **Deposit Fee** | 5% - paid by pool, NOT deducted from user |
| **Referral System** | 20% commission across 7 levels |

#### Referral Breakdown
- **Level 1:** 8.0%
- **Level 2:** 4.0%
- **Level 3:** 3.0%
- **Level 4:** 2.0%
- **Level 5:** 1.5%
- **Level 6:** 1.0%
- **Level 7:** 0.5%

---

## 🔒 Security Features

### ✅ Trustless Architecture

| Feature | Status | Description |
|---------|--------|-------------|
| **No Owner** | ✅ | No admin functions or privileged roles |
| **No Proxy** | ✅ | Direct implementation, no delegatecall |
| **No Upgrades** | ✅ | Immutable - cannot be altered after deployment |
| **No Pause** | ✅ | Contract runs perpetually |
| **Immutable Constants** | ✅ | All parameters permanently fixed at deployment |
| **Pull Payments** | ✅ | Users control all withdrawals |
| **Reentrancy Guard** | ✅ | Protected against reentrancy attacks |

### 🛡️ Security Audits

#### Internal Code Review
- ✅ **Reentrancy Protection** - Comprehensive nonReentrant modifiers
- ✅ **Integer Overflow Protection** - Solidity 0.8.24 built-in checks
- ✅ **Safe ERC20 Operations** - OpenZeppelin SafeERC20 library
- ✅ **Access Control** - No privileged functions
- ✅ **Circular Referral Prevention** - Chain validation logic
- ✅ **State Consistency** - Atomic operations with proper event emissions

#### Audit Fixes Implemented
- ✅ **AUDIT FIX #2** - Preserved fractional time in ROI calculations
- ✅ **AUDIT FIX #3** - Proper preserved ROI clearing mechanism
- ✅ **AUDIT FIX #4** - Preserved ROI for insufficient liquidity scenarios
- ✅ **AUDIT FIX #8** - Username validation for referrals
- ✅ **AUDIT FIX #12** - Accurate ROI tracking in events
- ✅ **AUDIT FIX #14** - Username "0x" prefix prevention

### 🔍 Verification Links

[![BSCScan Verified](https://img.shields.io/badge/BSCScan-Verified_Source_Code-success?style=flat-square&logo=ethereum)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code#F7#L1)
[![Solidity Scan](https://img.shields.io/badge/Solidity_Scan-Analyzed-blue?style=flat-square)](https://solidityscan.com/)

**View Contract Source:**
- 🔗 [BSCScan Verified Code](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code#F7#L1)
- 🔗 [GitHub Repository](https://github.com/noxfund/noxfund)

---

## 📊 Smart Contract Functions

### 🏦 Deposit Functions

```solidity
function deposit(uint256 _amount, address _refAddress) external
function depositWithUsername(uint256 _amount, string calldata _refUsername) external
```

### 💸 Withdrawal Functions

```solidity
function withdrawROI(uint256 _index) external
function withdrawAllROI() external
function withdrawPrincipal(uint256 _index) external
function withdrawReferral() external
```

### 👤 Username System

```solidity
function claimUsername(string calldata _username) external
function resolveReferral(string calldata _identifier) external view returns (address)
```

### 📈 View Functions

```solidity
function pendingROI(address _user, uint256 _index) external view returns (uint256, uint256)
function pendingROIAll(address _user) external view returns (uint256)
function depositInfo(address _user, uint256 _index) external view returns (...)
function contractInfo() external view returns (...)
function referralChain(address _user) external view returns (address[7] memory)
function getConstants() external pure returns (...)
```

---

## 🔧 Technical Specifications

### Dependencies

```json
{
  "@openzeppelin/contracts": "^5.0.0"
}
```

**OpenZeppelin Libraries Used:**
- `IERC20` - ERC20 token interface
- `SafeERC20` - Safe token transfer operations

### Gas Optimization

- ✅ Packed storage with `uint128`, `uint64`, `uint32` types
- ✅ Constant values for compile-time optimization
- ✅ Efficient loops with unchecked increments where safe
- ✅ Minimal storage reads with storage pointers

### Contract Constants

```solidity
DAILY_ROI               = 150 basis points (1.5%)
LOCK_PERIOD             = 45 days
FEE_BPS                 = 500 basis points (5%)
MAX_ROI_DAYS            = 365 days
MIN_DEPOSIT             = 1 USDT (1e18)
MAX_DEPOSITS_PER_USER   = 200
```

---

## 🌐 Contract Interaction

### Connect via Web3

```javascript
const contractAddress = "0x433830E36585bdACC840E1caB419C4211bBf13f5";
const contractABI = [...]; // Import from abi.json

const contract = new web3.eth.Contract(contractABI, contractAddress);
```

### Make a Deposit

```javascript
// Approve USDT first
const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
const amount = web3.utils.toWei("100", "ether"); // 100 USDT

await usdtContract.methods.approve(contractAddress, amount).send({from: userAddress});

// Make deposit
await contract.methods.deposit(amount, referrerAddress).send({from: userAddress});
```

### Check Pending ROI

```javascript
const pending = await contract.methods.pendingROIAll(userAddress).call();
console.log("Pending ROI:", web3.utils.fromWei(pending, "ether"), "USDT");
```

---

## 📚 Resources

### Official Links

| Resource | URL |
|----------|-----|
| **Website** | [https://noxfund.com](https://noxfund.com) |
| **Telegram Community** | [https://t.me/noxfundchat](https://t.me/noxfundchat) |
| **Contract (BSCScan)** | [View on BSCScan](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5) |
| **Verified Source** | [BSCScan Code Tab](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code#F7#L1) |
| **GitHub** | [github.com/noxfund/noxfund](https://github.com/noxfund/noxfund) |
| **Security Audit** | [View Audit Report](https://github.com/noxfund/noxfund/blob/main/audit) |

### Network Details

| Property | Value |
|----------|-------|
| **Chain ID** | 56 |
| **RPC Endpoint** | https://bsc-dataseed.binance.org/ |
| **Currency Symbol** | BNB |
| **Block Explorer** | https://bscscan.com |

---

## 🏗️ Architecture Highlights

### Data Structures

**Deposit Structure:**
```solidity
struct Deposit {
    uint128 principal;           // Original deposit amount
    uint64  startTime;           // Deposit timestamp
    uint64  lastClaimTime;       // Last ROI claim timestamp
    uint32  totalROIDaysClaimed; // Days of ROI claimed (max 365)
    uint128 preservedROI;        // Preserved ROI when principal withdrawn without liquidity
}
```

### State Management

- **Per-User Data:** Deposits array, referral balances, statistics
- **Global Statistics:** Total deposited, withdrawn, participants count
- **Vanity System:** Username <-> address bidirectional mapping
- **Referral Network:** 7-level upline chain tracking

### Event System

- `Deposited` - New deposit created
- `ROIWithdrawn` - ROI claimed
- `PrincipalWithdrawn` - Principal returned
- `ReferralPaid` - Commission credited
- `ReferralWithdrawn` - Referral balance withdrawn
- `UsernameClaimed` - Vanity username registered
- `FeeSent` - Protocol fee transferred

---

## 🔐 Security Best Practices

### For Users

1. ✅ Always verify contract address before interaction
2. ✅ Use official website: [noxfund.com](https://noxfund.com)
3. ✅ Check transaction details before signing
4. ✅ Never share private keys or seed phrases
5. ✅ Enable hardware wallet for large amounts

### For Developers

1. ✅ Contract is immutable - no upgrades possible
2. ✅ All functions use reentrancy guards
3. ✅ SafeERC20 prevents transfer failures
4. ✅ Integer overflow impossible (Solidity 0.8.24+)
5. ✅ No owner privileges - fully decentralized

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🔗 Quick Links

<div align="center">

[![Website](https://img.shields.io/badge/🌐_Official_Website-Visit-blueviolet?style=for-the-badge)](https://noxfund.com)
[![Telegram](https://img.shields.io/badge/💬_Join_Telegram-Community-blue?style=for-the-badge&logo=telegram)](https://t.me/noxfundchat)
[![BSCScan](https://img.shields.io/badge/📊_View_on_BSCScan-Explore-yellow?style=for-the-badge)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5)
[![GitHub](https://img.shields.io/badge/💻_Source_Code-GitHub-black?style=for-the-badge&logo=github)](https://github.com/noxfund/noxfund)
[![Audit](https://img.shields.io/badge/🛡️_Security_Audit-View-brightgreen?style=for-the-badge)](https://github.com/noxfund/noxfund/blob/main/audit)

</div>

---

<div align="center">

### Built with 🦊 by the NoxFund Team

**Completely Trustless • Fully Immutable • Perpetually Operational**

</div>
