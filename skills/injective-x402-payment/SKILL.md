---
name: injective-x402-payment
description: Use x402 on Injective to pay for AI services and gated API endpoints directly from the terminal or MCP using USDC.
license: Apache-2.0
metadata:
  author: zed
  version: "1.0.0"
---

# Injective x402 Payment Skill

## Overview

x402 is an open protocol that embeds payments into the HTTP request lifecycle, using the 402 Payment Required status code. On Injective EVM, payments settle in ~650ms.
This skill teaches the agent how to interact with x402-gated API endpoints using USDC on Injective without needing prior registration or API keys.

## Workflow

### 1) Make a request using the MCP Tool

The Injective MCP server provides a tool to fetch data from an x402-protected endpoint:

- `x402_fetch` - Automatically fetches an x402-gated URL, signs the payment using your Injective EVM wallet if a 402 Payment Required is returned, submits the payment receipt via the facilitator, and retries the request to deliver the gated data.

### 2) Using `x402_fetch`

To use the `x402_fetch` tool via MCP:
- **address**: Your Injective wallet address.
- **password**: Your keystore password to authorize the payment.
- **url**: The URL of the x402-gated endpoint you wish to call.
- **maxAmount**: (Optional) A safety limit on the maximum USDC amount you are willing to pay for this request.

Example:
When calling an endpoint like `https://agents.injective.com/x402/perps`, the server will return a 402 quote. The MCP tool will handle signing a USDC transfer on Injective EVM to the facilitator and return the final data payload.

## Prerequisites
- EVM wallet connected to Injective network
- A small amount of USDC for payments
- INJ tokens for gas fees
