# Development Workflow

**Always use `bun`, not `npm`.**

# 1. Make changes

# 2. Typecheck (fast)

bun run typecheck

# 3. Run tests

bun run test -- -t "test name" # Single suite
bun run test:file -- "glob" # Specific files

# 4. Lint before committing

bun run lint:file -- "file1.ts"
bun run lint