# Third-party notices

AgenticBots operates AI Bots on infrastructure that includes open-source
software. AgenticBots does not claim to have trained the underlying
foundation models; Bots use models from third-party providers chosen per
client.

## Hermes Agent

Used as the Bot runtime engine (deployed unmodified from the official
container image, version pinned in `docs/research/HERMES_INTEGRATION.md`).
AgenticBots skills and configuration are layered on top; the engine is not
forked or rebranded.

```
MIT License

Copyright (c) 2025 Nous Research

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Other components

- **cloudflared** (Cloudflare Tunnel client) — Apache License 2.0, © Cloudflare, Inc.
- **Docker Compose** — Apache License 2.0.
- npm dependencies retain their own licenses (see `node_modules/*/LICENSE`),
  including Next.js (MIT), React (MIT), Convex (Apache-2.0), AWS SDK for
  JavaScript (Apache-2.0), lucide-react (ISC), zod (MIT).
