import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(
  import.meta.url
)

const projectRoot = path.dirname(
  filename
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,

  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig