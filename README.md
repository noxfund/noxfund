<div align="center">

# NoxFund Smart Contract

### Immutable Passive Income Protocol on BNB Smart Chain

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![BNB Chain](https://img.shields.io/badge/BNB_Chain-Mainnet-F3BA2F?style=for-the-badge&logo=binance)](https://www.bnbchain.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Verified](https://img.shields.io/badge/Contract-Verified-success?style=for-the-badge&logo=ethereum)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code)

[![Website](https://img.shields.io/badge/🌐_Website-nox.fund-blueviolet?style=for-the-badge)](https://nox.fund)
[![Telegram](https://img.shields.io/badge/💬_Telegram-Join_Community-blue?style=for-the-badge&logo=telegram)](https://t.me/noxfundchat)
[![BSCScan](https://img.shields.io/badge/📊_BSCScan-Contract-yellow?style=for-the-badge)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5)
[![Security Audit](https://img.shields.io/badge/🛡️_Audit-Passed-brightgreen?style=for-the-badge)](https://hazecrypto.net/audit/Noxfund)
[![Solidity Scan](https://img.shields.io/badge/🔍_Solidity_Scan-Verified-blue?style=for-the-badge)](https://solidityscan.com/quickscan/0x433830E36585bdACC840E1caB419C4211bBf13f5/bscscan/mainnet)

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

## 🔄 45-Day Rolling Lock Strategy

The **45-day rolling lock mechanism** creates a sustainable compounding strategy:

### How It Works

1. **Initial Deposit** - Your USDT is locked for 45 days
2. **Daily ROI** - Earn 1.5% daily on your full deposit (claimable anytime)
3. **Reinvestment** - Deposit your daily ROI as new positions every day
4. **Stagger Effect** - Each new deposit has its own 45-day timer
5. **Day 46+** - Your first principal unlocks while newer deposits continue earning

### Example Timeline

| Day | Action | Locked Principal | Daily ROI Available |
|-----|--------|-----------------|-------------------|
| 1 | Deposit 1000 USDT | 1000 USDT | 15 USDT |
| 2 | Deposit 15 USDT ROI | 1015 USDT | 15.23 USDT |
| 3 | Deposit 15.23 USDT ROI | 1030.23 USDT | 15.45 USDT |
| ... | Continue daily | Growing | Growing |
| 46 | First 1000 USDT unlocks | 30+ deposits locked | 20+ USDT |

### Benefits

- 💰 **Continuous Growth** - Compound daily for exponential returns
- 🔓 **Regular Access** - After day 45, unlock principals regularly
- 📈 **Risk Distribution** - Multiple deposits spread your risk
- ⚡ **Flexibility** - Withdraw ROI anytime or reinvest for growth

---

## 🧮 ROI Calculator

### Simple ROI Calculation

```
Daily ROI = Deposit × 1.5%
Monthly ROI = Deposit × 45%
Maximum ROI = Deposit × 547.5% (365 days)
```

### Example: 1000 USDT Deposit

| Period | ROI Earned | Total Earned |
|--------|-----------|--------------|
| 1 Day | 15 USDT | 15 USDT |
| 7 Days | 105 USDT | 105 USDT |
| 30 Days | 450 USDT | 450 USDT |
| 45 Days (Lock expires) | 675 USDT | 675 USDT |
| 90 Days | 1,350 USDT | 1,350 USDT |
| 180 Days | 2,700 USDT | 2,700 USDT |
| 365 Days (Max) | 5,475 USDT | 5,475 USDT |

**Note:** After 365 days of ROI claims, the deposit reaches maximum returns.

---

## 📊 Compound Calculator

### Daily Compounding Strategy

Instead of withdrawing ROI, reinvest it daily for exponential growth:

#### Example: 1000 USDT Compounded Daily

| Day | Deposit Amount | Daily ROI (1.5%) | Cumulative Capital |
|-----|----------------|------------------|-------------------|
| 1 | 1,000.00 | 15.00 | 1,000.00 |
| 2 | 15.00 | 15.23 | 1,015.00 |
| 3 | 15.23 | 15.45 | 1,030.23 |
| 7 | - | 17.28 | 1,106.97 |
| 14 | - | 19.24 | 1,230.38 |
| 30 | - | 23.44 | 1,502.61 |
| 45 | - | 28.09 | 1,800.00 |
| 90 | - | 50.72 | 3,249.67 |
| 180 | - | 164.50 | 10,534.71 |
| 365 | - | 1,724.16 | 107,391.76 |

### Compound Formula

```
Final Amount = Initial × (1 + Daily_Rate)^Days
Final Amount = 1000 × (1.015)^365 = 107,391 USDT
```

### Compounding Benefits

- 📈 **10,739% Growth** - From 1000 to 107,391 USDT in 1 year
- 🔄 **Daily Reinvestment** - Maximize exponential returns
- 💎 **Long-term Strategy** - Best for patient investors
- ⚖️ **Balanced Risk** - Spread across multiple deposits

### Comparison: Simple vs Compound

| Strategy | 1000 USDT After 1 Year | Total Return |
|----------|----------------------|--------------|
| **Simple Withdrawal** | 1,000 + 5,475 = 6,475 USDT | 547.5% |
| **Daily Compound** | 107,391 USDT | 10,739% |

**Difference:** Compounding yields **16.6x more** than simple withdrawal!

---

## 👥 Detailed Referral System

### 7-Level Deep Commission Structure

NoxFund rewards network builders with a **20% total commission** distributed across 7 levels:

#### Commission Breakdown

| Level | Commission | Example on 1000 USDT Deposit |
|-------|-----------|----------------------------|
| **Level 1** (Direct) | 8.0% | 80 USDT |
| **Level 2** | 4.0% | 40 USDT |
| **Level 3** | 3.0% | 30 USDT |
| **Level 4** | 2.0% | 20 USDT |
| **Level 5** | 1.5% | 15 USDT |
| **Level 6** | 1.0% | 10 USDT |
| **Level 7** | 0.5% | 5 USDT |
| **TOTAL** | **20.0%** | **200 USDT** |

### How Referral Earnings Work

1. **Instant Credit** - Commissions credited immediately on deposit
2. **Withdraw Anytime** - No lock period on referral earnings
3. **Unlimited Referrals** - No cap on team size or earnings
4. **Compound Eligible** - Use referral earnings to make new deposits

### Example Referral Network

```
You (Level 0)
│
├─ Alice (Level 1) deposits 1000 USDT → You earn 80 USDT
│  │
│  ├─ Bob (Level 2) deposits 500 USDT → You earn 20 USDT
│  │  │
│  │  └─ Carol (Level 3) deposits 200 USDT → You earn 6 USDT
│  │
│  └─ Dave (Level 2) deposits 300 USDT → You earn 12 USDT
│
└─ Eve (Level 1) deposits 2000 USDT → You earn 160 USDT

Total Earnings: 278 USDT from team deposits
```

### Referral Earnings Calculator

#### Example: Building a 100-Person Team

| Team Size | Avg Deposit | Total Volume | Your Earnings (Level 1 @ 8%) |
|-----------|-------------|--------------|----------------------------|
| 10 people | 500 USDT | 5,000 USDT | 400 USDT |
| 50 people | 500 USDT | 25,000 USDT | 2,000 USDT |
| 100 people | 500 USDT | 50,000 USDT | 4,000 USDT |
| 500 people | 500 USDT | 250,000 USDT | 20,000 USDT |

**Note:** This only counts Level 1 (direct referrals). Levels 2-7 add additional passive income!

### Vanity Username System

Claim a custom username for easier referrals:

```solidity
// Claim your username
contract.claimUsername("yourname")

// Share your link
https://nox.fund/?ref=yourname
```

**Benefits:**
- ✅ Memorable referral links
- ✅ Professional branding
- ✅ Easy to share on social media
- ✅ No long wallet addresses

### Referral Best Practices

1. **Share Your Story** - Explain how NoxFund works
2. **Show Calculations** - Use the compound calculator
3. **Provide Support** - Help your team understand the platform
4. **Lead by Example** - Make deposits to demonstrate trust
5. **Build Community** - Join [Telegram](https://t.me/noxfundchat) to connect

---

## 🔒 Ultimate Trustlessness & Decentralization

### 🔑 Developer Keys Publicly Shared - Zero Control

**NoxFund achieves the highest level of decentralization possible:**

The contract was deployed from wallet: **`0xC9Bdfe5597e9030114860059045f3893DE84a1F6`**

#### Private Keys Are PUBLIC

The deployment wallet's **private keys have been publicly shared** in the Telegram community, proving that:

- ❌ Developers **CANNOT** modify the contract
- ❌ Developers **CANNOT** pause operations
- ❌ Developers **CANNOT** upgrade the code
- ❌ Developers **CANNOT** access user funds
- ❌ Developers **CANNOT** change parameters

### Why This Matters

**Traditional DeFi:**
- Developers hold private keys
- "Trust us, we're honest"
- Multisig wallets still have control
- Upgrade proxies allow code changes

**NoxFund:**
- ✅ Private keys publicly revealed
- ✅ ZERO administrative control
- ✅ NO multisig governance
- ✅ NO upgrade capability
- ✅ Contract runs autonomously FOREVER

### The Ultimate Proof 

> **"Don't trust, verify."**
>
> With NoxFund, you don't even need to verify - **everyone has the keys.**
> The developers literally gave away all control the moment of deployment.

This is **true decentralization** - not just marketing promises.

### Contract Guarantees

| Feature | Status | Proof |
|---------|--------|-------|
| **No Owner** | ✅ | No owner variable in code |
| **No Admin Functions** | ✅ | Zero privileged functions |
| **No Pause** | ✅ | No pause mechanism exists |
| **No Upgrades** | ✅ | Not a proxy contract |
| **Immutable Code** | ✅ | Deployed bytecode cannot change |
| **Public Keys** | ✅ | Deployment wallet keys shared publicly |

**Result:** Users DON'T need to trust anyone - **the code is law.**

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
[![Solidity Scan](https://img.shields.io/badge/Solidity_Scan-Analyzed-blue?style=flat-square)](https://solidityscan.com/quickscan/0x433830E36585bdACC840E1caB419C4211bBf13f5/bscscan/mainnet)

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
| **Website** | [https://nox.fund](https://nox.fund) |
| **Telegram Community** | [https://t.me/noxfundchat](https://t.me/noxfundchat) |
| **Contract (BSCScan)** | [View on BSCScan](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5) |
| **Verified Source** | [BSCScan Code Tab](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5#code#F7#L1) |
| **GitHub** | [github.com/noxfund/noxfund](https://github.com/noxfund/noxfund) |
| **Security Audit** | [HazeCrypto Report](https://hazecrypto.net/audit/Noxfund) |
| **SolidityScan** | [Live Analysis](https://solidityscan.com/quickscan/0x433830E36585bdACC840E1caB419C4211bBf13f5/bscscan/mainnet) |
| **Project Overview** | [Download PDF](https://github.com/noxfund/noxfund/blob/main/NOX-FUND-Project-Overview.pdf) |

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
2. ✅ Use official website: [nox.fund](https://nox.fund)
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

[![Website](https://img.shields.io/badge/🌐_Official_Website-Visit-blueviolet?style=for-the-badge)](https://nox.fund)
[![Telegram](https://img.shields.io/badge/💬_Join_Telegram-Community-blue?style=for-the-badge&logo=telegram)](https://t.me/noxfundchat)
[![BSCScan](https://img.shields.io/badge/📊_View_on_BSCScan-Explore-yellow?style=for-the-badge)](https://bscscan.com/address/0x433830E36585bdACC840E1caB419C4211bBf13f5)
[![GitHub](https://img.shields.io/badge/💻_Source_Code-GitHub-black?style=for-the-badge&logo=github)](https://github.com/noxfund/noxfund)
[![Audit](https://img.shields.io/badge/🛡️_Security_Audit-View-brightgreen?style=for-the-badge)](https://hazecrypto.net/audit/Noxfund)

</div>

---

<div align="center">

### Built with by the NoxFund Team

**Completely Trustless • Fully Immutable • Perpetually Operational**

</div>
