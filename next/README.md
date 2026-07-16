# PEAR System frontend

The frontend runs inside the project Docker network and is reached through the
root nginx service. From the repository root, start the development stack:

```bash
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080). This is the canonical
same-origin entrypoint for pages, `/api/*`, and `/sanctum/*`.
`http://127.0.0.1:8080` is the supported loopback-IP equivalent.

Port 3000 is an internal Next.js service port and is not a supported browser
entrypoint. Storybook remains available separately on its configured port.
