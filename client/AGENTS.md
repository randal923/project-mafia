<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Command Restrictions

Do not run `yarn build`, `yarn dev`, `yarn --cwd client build`, or `yarn --cwd client dev` unless the user explicitly asks for one of those commands.

## Tailwind Classes

Prefer standard Tailwind utilities over arbitrary values when an equivalent utility exists. For example, use `max-w-48` for a 12rem max width.
Do not add arbitrary bracket utilities in `className`. If a custom value is necessary, define a named utility in `app/globals.css` and use that class instead.
