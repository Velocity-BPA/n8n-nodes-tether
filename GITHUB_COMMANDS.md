# GitHub Repository Setup Commands
# n8n Tether USDT Blockchain Community Node
#
# Copyright (c) Velocity BPA, LLC
# Licensed under the Business Source License 1.1
# Website: https://velobpa.com
# GitHub: https://github.com/Velocity-BPA

# =============================================================================
# INITIAL SETUP - Run these commands after extracting the zip file
# =============================================================================

# Extract and navigate
unzip n8n-nodes-tether.zip
cd n8n-nodes-tether

# Initialize and push
git init
git add .
git commit -m "Initial commit: n8n Tether USDT blockchain community node

Features:
- USDT: Multi-chain balance queries, transfers, approvals
- Ethereum: ERC-20 USDT operations with gas estimation
- Tron: TRC-20 USDT with energy/bandwidth tracking
- Solana: SPL token operations with account management
- Polygon: Layer 2 USDT operations
- Arbitrum: L2 operations with L1 data fees
- Optimism: L2 operations with bridge status
- BNB Chain: BEP-20 USDT (18 decimals)
- Avalanche: C-Chain USDT operations
- TON: Jetton USDT transfers and queries
- Algorand: ASA USDT with opt-in support
- Transparency: Reserve breakdown, supply by chain, audit reports
- Market Data: Price, volume, depeg monitoring, dominance
- Bridge: Cross-chain route comparison
- Compliance: Blacklist checking, address screening
- Utility: Address validation, fee comparison, unit conversion
- Trigger: Real-time transfer, balance, price deviation alerts"

git remote add origin https://github.com/Velocity-BPA/n8n-nodes-tether.git
git branch -M main
git push -u origin main
