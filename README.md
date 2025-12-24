# n8n-nodes-tether

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

---

A comprehensive n8n community node package for **Tether USDT** operations across **15+ blockchain networks**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-BUSL--1.1-orange)
![n8n](https://img.shields.io/badge/n8n-community%20node-orange)

## Overview

This package provides full integration with Tether USDT stablecoin operations including balance queries, transfers, transparency data, market information, and cross-chain bridge comparisons. It supports Ethereum, Tron, Solana, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche, TON, Algorand, and more.

## Features

- **Multi-Chain Support**: 15+ blockchain networks including EVM chains, Tron, Solana, TON, and Algorand
- **Balance Operations**: Query USDT balances across any supported network
- **Transfer Operations**: Send USDT with proper gas/energy estimation
- **Approval Management**: Approve spending allowances and check allowances
- **Transparency Data**: Access Tether's reserve and supply information
- **Market Data**: Real-time USDT price, volume, and depeg monitoring
- **Compliance Checking**: Verify address blacklist status
- **Bridge Comparisons**: Compare cross-chain bridge options
- **Event Triggers**: Real-time monitoring for transfers, balance changes, and price deviations

## Supported Networks

| Network | Type | USDT Decimals |
|---------|------|---------------|
| Ethereum | EVM (ERC-20) | 6 |
| Tron | TRC-20 | 6 |
| Solana | SPL Token | 6 |
| Polygon | EVM | 6 |
| Arbitrum | EVM (L2) | 6 |
| Optimism | EVM (L2) | 6 |
| BNB Chain | EVM (BEP-20) | 18 |
| Avalanche | EVM (C-Chain) | 6 |
| TON | Jetton | 6 |
| Algorand | ASA | 6 |
| Fantom | EVM | 6 |
| Celo | EVM | 6 |
| NEAR | Native | 6 |
| Kava | EVM | 6 |
| Omni (Bitcoin) | Omni Layer | 8 |

## Installation

### Local Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-tether.git
cd n8n-nodes-tether

# Install dependencies
npm install

# Build the package
npm run build

# Link for local n8n testing
npm link

# In your n8n installation directory
cd ~/.n8n
npm link n8n-nodes-tether
```

### Production Installation

```bash
# In your n8n custom nodes directory
cd ~/.n8n/nodes
npm install n8n-nodes-tether
```

### Docker Installation

Add to your n8n Dockerfile:
```dockerfile
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-tether
```

## Credentials Setup

### Tether Blockchain Credentials

Configure blockchain connection for read/write operations:

| Field | Description |
|-------|-------------|
| Network | Select blockchain network |
| RPC Endpoint URL | Custom RPC URL (optional) |
| Private Key | For signing transactions (optional for read-only) |

### Tether API Credentials

For transparency and market data:

| Field | Description |
|-------|-------------|
| API Type | Transparency or Market Data |
| API Endpoint | Base API URL |
| CoinGecko API Key | For higher rate limits (optional) |

## Usage Examples

### Get USDT Balance

```javascript
// Node configuration
{
  "resource": "usdt",
  "operation": "getBalance",
  "network": "ethereum",
  "address": "0x..."
}
```

### Transfer USDT

```javascript
// Node configuration
{
  "resource": "usdt",
  "operation": "transfer",
  "network": "polygon",
  "toAddress": "0x...",
  "amount": "100"
}
```

### Check Depeg Status

```javascript
// Node configuration
{
  "resource": "marketData",
  "operation": "checkDepeg",
  "depegThreshold": 0.02
}
```

### Compare Bridge Options

```javascript
// Node configuration
{
  "resource": "bridge",
  "operation": "compareBridges",
  "fromNetwork": "ethereum",
  "toNetwork": "polygon"
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Project Structure

```
n8n-nodes-tether/
├── credentials/
│   ├── TetherBlockchain.credentials.ts
│   ├── TetherApi.credentials.ts
│   └── ExchangeApi.credentials.ts
├── nodes/
│   └── Tether/
│       ├── Tether.node.ts
│       ├── TetherTrigger.node.ts
│       ├── tether.svg
│       ├── constants/
│       ├── transport/
│       └── utils/
├── test/
├── scripts/
├── package.json
├── LICENSE
├── COMMERCIAL_LICENSE.md
├── LICENSING_FAQ.md
└── README.md
```

## Security Considerations

- **Never log private keys** - All credential handling follows security best practices
- **Validate addresses** - Chain-specific address validation before transactions
- **Check blacklist status** - Verify addresses aren't frozen before transfers
- **Handle different decimals** - Proper decimal handling across networks (6, 8, 18)

## Troubleshooting

### Build Errors
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Node Not Appearing in n8n
1. Verify the node is linked correctly
2. Restart n8n after installing
3. Check n8n logs for errors

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Author

**Velocity BPA**
- Website: [https://velobpa.com](https://velobpa.com)
- GitHub: [https://github.com/Velocity-BPA](https://github.com/Velocity-BPA)

## Disclaimer

This software is provided for informational and educational purposes only. Users are responsible for complying with all applicable laws and regulations regarding cryptocurrency transactions.
