# Digital Wallet Production Package

Generated: 2025-09-10 23:03:47

## Workers Included
- API Gateway Worker (65.3 KB)
- Frontend Worker (76.2 KB)
- Main Bot Worker (40.1 KB)
- Banking Worker (89.4 KB)
- Security Worker (64.4 KB)


## Configuration Files
- Main Configuration (wrangler.toml)
- Individual Worker Configurations

## Deployment
Run the deployment script:
```
.\deploy.ps1
```

Or deploy individually:
```
cd workers\<worker-name>
npx wrangler deploy
```

## Structure
```
production-ready/
├── deploy.ps1                 # Deployment script
├── README.md                  # This file
├── wrangler.toml             # Main configuration
└── workers/
    ├── main-bot/
    │   ├── index.js
    │   └── wrangler.toml
    ├── api/
    │   ├── index.js
    │   └── wrangler.toml
    ├── banking/
    │   ├── index.js
    │   └── wrangler.toml
    ├── security/
    │   ├── index.js
    │   └── wrangler.toml
    └── frontend/
        ├── index.js
        └── wrangler.toml
```
