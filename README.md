# Contact Management API

## Dependencies
```
- NodeJS (20)
- npm
- PostgreSQL
- Docker (Optional) 
```

## Getting started
- By default the API endponts are exposed at http://localhost:8844
- The API service can run in a Docker container along with the Postgres image:
```sh
docker-compose up -d
```

## Test
```sh
npm run test
```

## Install dependencies
```sh
npm install
```

### Run
- **NOTE:** Ensure Postgres is running
```sh
npm run start
```

### Production build
```sh
npm run build
```

### Production build run
- Make sure NODE_ENV env var is set to `production`
```sh
npm run prod_start
```

### Links
- https://bitespeed.notion.site/Bitespeed-Backend-Task-Identity-Reconciliation-53392ab01fe149fab989422300423199