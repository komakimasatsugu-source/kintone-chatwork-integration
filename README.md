# Kintone-Chatwork Integration

Node.js application for integrating Kintone with Chatwork via webhooks.

## Features

- Health check endpoint: `/health`
- Webhook receiver: `/webhook/kintone`
- AI-powered data processing

## Deployment

This application is configured for Railway deployment with:
- Node.js 18+
- Express server
- Environment variable support

## Environment Variables

Required variables:
- `PORT` (auto-set by Railway)
- `NODE_ENV=production`
- `CHATWORK_API_TOKEN`
- `CHATWORK_ROOM_ID`
- `KINTONE_DOMAIN`
- `KINTONE_APP_ID`

## Usage

Health check: `GET /health`
Webhook endpoint: `POST /webhook/kintone`
