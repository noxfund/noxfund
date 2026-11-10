# Contributing to NoxFund 🦊

Thank you for your interest in contributing to NoxFund! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## 📜 Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🤝 How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear, descriptive title
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

### Suggesting Enhancements

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Provide a clear description of the enhancement
- Explain why this would be useful
- Include examples or mockups if possible

### Documentation Improvements

Documentation is crucial! You can help by:
- Fixing typos or unclear explanations
- Adding examples or use cases
- Improving README clarity
- Translating documentation

### Code Contributions

**Important:** The smart contract is **immutable** and cannot be modified. Contributions are focused on:
- Frontend improvements
- Documentation
- Testing frameworks
- Developer tools
- Community resources

## 🛠️ Development Setup

### Prerequisites

```bash
# Install Node.js (v16 or higher)
node --version

# Install dependencies
npm install
```

### Local Development

```bash
# Run local development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🔄 Pull Request Process

1. **Fork the Repository**
   ```bash
   git clone https://github.com/noxfund/noxfund.git
   cd noxfund
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clear, commented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commit messages:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Formatting changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure all tests pass
   - Wait for review

## 📝 Style Guidelines

### Code Style

- Use meaningful variable names
- Comment complex logic
- Keep functions small and focused
- Follow DRY principle (Don't Repeat Yourself)

### Solidity Code (Reference Only)

The deployed contract cannot be changed, but for reference:
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use explicit visibility modifiers
- Document all functions with NatSpec
- Optimize for gas efficiency

### JavaScript/Frontend

```javascript
// Use const/let, not var
const CONTRACT_ADDRESS = "0x433830E36585bdACC840E1caB419C4211bBf13f5";

// Use clear function names
async function getUserDeposits(address) {
  // Implementation
}

// Add JSDoc comments
/**
 * Calculate daily ROI for a deposit
 * @param {BigNumber} amount - Deposit amount
 * @returns {BigNumber} Daily ROI amount
 */
function calculateDailyROI(amount) {
  return amount.mul(150).div(10000);
}
```

### Markdown

- Use clear headings
- Include code examples
- Add emojis for readability (in moderation)
- Keep lines under 100 characters when possible

## ✅ Checklist Before Submitting

- [ ] Code follows project style guidelines
- [ ] Documentation updated if needed
- [ ] All tests pass
- [ ] Commit messages are clear
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] PR description is complete

## 🎯 Areas We Need Help

- Frontend UI/UX improvements
- Documentation and tutorials
- Testing and QA
- Community support
- Translations
- Marketing materials

## 📞 Getting Help

- **Telegram:** [@noxfundchat](https://t.me/noxfundchat)
- **GitHub Issues:** [Open an issue](https://github.com/noxfund/noxfund/issues)
- **Email:** dev@nox.fund

## 🏆 Recognition

Contributors will be:
- Listed in our Contributors section
- Acknowledged in release notes
- Appreciated by the entire community! ❤️

---

**Thank you for contributing to NoxFund!** 🦊✨
