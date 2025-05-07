# PumpFun AMM(pumpswap) Trading Bot

## About

PumpFun AMM(pumpswap) Trading Bot is a specialized sniping bot, volume bot and bundler designed to work with the PumpFun AMM decentralized exchange (DEX). It enables users to execute high-frequency trading strategies by automating buy/sell operations during token launches, pump events, or other fast-paced trading scenarios. Written in **TypeScript**, this bot aims to provide a seamless trading experience while allowing customization of trading strategies.

---

## Contact

If you wanna build this trading bot, contact here: [Telegram](https://t.me/shiny0103)  [Twitter](https://x.com/0xTan1319)

## Features

- **Sniping Functionality**: Quickly execute trades to take advantage of token launches or pump events.
- **Wallet Scanning**: Includes functionality to scan specific wallets for trading activity.
- **Customizable Configurations**: Adjust the bot's settings through environment variables (`.env` file) and configuration files.
- **Fast Execution**: Optimized for low latency and rapid transaction execution.
- **Secure Wallet Integration**: Uses secure methods to manage multiple wallets (`wallets.json`).

---

## File Structure

```plaintext
pumpfun-amm-trading-bot/
├── WalletScanData/         # Contains wallet scanning data
├── src/                    # Main source code for the bot
├── .env.example            # Example environment configuration file
├── .gitignore              # Files/folders ignored by Git
├── .prettierignore         # Files/folders ignored by Prettier
├── .prettierrc             # Prettier configuration
├── README.md               # Project documentation (this file)
├── package-lock.json       # Lockfile for dependencies
├── package.json            # Node.js project configuration
├── tsconfig.json           # TypeScript configuration
├── wallets.json            # File for managing wallet information
├── yarn.lock               # Yarn lockfile for dependencies
