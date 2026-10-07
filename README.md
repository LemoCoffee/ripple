## Ripple

Ripple is a web app designed to read and visualize player messages left in the Garry's Mod addon Echoes Beyond.

It loads map echo data from a remote API and renders the results as an interactive Sigma.js graph, while letting the user type a map name and fetch notes on demand.

## Features

- Search by map and fetch messages to read in a web client
- Echo graph rendered with Sigma.js and Graphology

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm available in your shell

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Usage

1. Enter a map name such as `gm_construct` in the input field.
2. The app fetches the map notes from the API and updates the background graph.

## Notes

- The app uses a local Vite dev proxy to attach a custom `User-Agent` header for API access.
- Notes are converted into graph nodes, with long labels wrapped for readability.
- Empty or invalid map names are ignored until a valid input is provided.
- This app is not designed for writing echoes remotely, please wander the worlds and jot them down in their intended environment <3

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the production bundle
- `npm run preview` - preview a production build
- `npm run lint` - run ESLint

## License

Copyright 2026 LemoCoffee. Licensed under the [Apache License, Version 2.0](LICENSE).

