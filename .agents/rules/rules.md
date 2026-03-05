---
trigger: always_on
---

# TypeScript + Next.js Agent Rules

## Project Context
You are an expert TypeScript developer working with Next.js. This project is a Web App.

## Code Style & Structure
### Functional Patterns
- Prefer pure functions: given the same inputs, always return the same output with no side effects.
- Use immutable data structures; avoid mutating variables or objects after creation.
- Favor function composition and pipelines over deeply nested logic.
- Use higher-order functions (map, filter, reduce) instead of manual loops for collection transformations.
- Separate side effects (I/O, network, state) from pure computation; push effects to the edges of your program.
- Prefer declarative code that describes *what* to compute rather than *how* to compute it step by step.
- Use closures and partial application to create reusable, configurable function factories.

## Linting & Formatting
### Biome
- Run `biome check --write .` for combined linting + formatting — configure `biome.json` to enable TypeScript-specific lint rules.
- Use Biome's `organizeImports` to auto-sort imports — it replaces separate import-sorting plugins.
- Run `biome ci .` in CI (strict mode, no auto-fix) and `biome check --write .` locally for development auto-fixes.
- Enable recommended rules: `"linter": { "rules": { "recommended": true } }`.
- Use `biome ci` in CI pipelines — it exits non-zero on any violation without auto-fixing.
- Use `biome.json` overrides for file-specific rule configuration (e.g., relaxed rules for test files).

## Styling
### Tailwind CSS
- Use `@apply` in component CSS only as a last resort — prefer utility classes in templates.
- Use the `cn()` (clsx + twMerge) utility for conditional class merging — it resolves Tailwind class conflicts correctly.
- Use `tailwind.config.ts` to define design tokens: colors, spacing, fonts, breakpoints.
- Use component extraction to avoid repeating class combinations — encapsulate repeated patterns in reusable components or partials.
- Use responsive prefixes (`sm:`, `md:`, `lg:`) for mobile-first responsive design.
- Use `dark:` variant for dark mode support. Use `group-*` and `peer-*` for conditional styling.

## Next.js
- Type page props with `{ params: Promise<{ slug: string }>, searchParams: Promise<Record<string, string>> }` — params are async in App Router.
- Use `Metadata` and `generateMetadata({ params }: Props): Promise<Metadata>` from `next` for typed SEO metadata.
- Default to Server Components; mark Client Components with `'use client'` and define a `Props` interface for each component.
- Type API route handlers with `NextRequest` and `NextResponse`: `export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>>` — avoid `any` in route return types.
- Type Server Actions with explicit parameter and return types: `async function createItem(formData: FormData): Promise<{ error?: string }>`.
- Use `revalidatePath()` and `revalidateTag()` with typed tag constants to avoid string typos in cache invalidation.
- Define route params as a shared type when used across `page.tsx`, `layout.tsx`, and `generateMetadata` in the same segment.
- Prefer `notFound()` and `redirect()` from `next/navigation` with typed route strings over manual Response construction.

## Architecture
### Web App Architecture
- Separate UI components, business logic, and data fetching into distinct layers.
- Choose rendering strategy intentionally: SSR for SEO, CSR for interactivity, SSG for static content.
- Use server-side rendering (SSR) or static generation (SSG) for initial page loads — hydrate on the client for interactivity.
- Implement client-side routing with proper loading and error states for each route.
- Use a state management approach appropriate to complexity — local state first, global store when needed.

## Error Handling
### Try/Catch
- Use try/catch blocks for error handling. Catch specific error types, not generic exceptions.
- Never catch errors silently — always log, handle, or rethrow with additional context.
- Log the full error stack trace at the catch site — re-throw with additional context if the error needs to propagate up the call chain.
- Provide meaningful error messages that include what operation failed and why.
- Use typed error hierarchies: ValidationError, NotFoundError, AuthenticationError — not generic Error.
- Log errors with structured data: operation name, input parameters, stack trace, and timestamp.
- Use finally blocks for cleanup that must run regardless of success or failure.

## Testing
### TypeScript Testing
- Write tests alongside source files (`*.test.ts`) or in a `__tests__/` directory.
- Use the Arrange-Act-Assert pattern: set up data, perform the action, verify the result.
- Mock external dependencies (APIs, databases) — test your logic, not the network.
- Use `describe` blocks to group related tests. Use `it` with descriptive names: `it("should return 404 when user not found")`.
- Use typed test fixtures and factories for consistent, type-safe test data.
- Use `beforeEach` for setup and `afterEach` for cleanup — avoid shared mutable state between tests.

### Jest
- Use `describe` blocks to group tests by unit (e.g., controller or function) and `it` for individual cases.
- Set up repeatable fixtures in `beforeEach`, like instantiating subjects with mocks.
- Mock request/response objects and dependencies for isolation.
- Assert on mock interactions with `toHaveBeenCalledWith` and matchers like `expect.any()`.
- Mark async tests as `async` in `it` blocks.
- Group tests logically in `describe` to mirror production code structure and aid debugging.
- Use `beforeEach` over `beforeAll` for state reset, preventing test interference from shared setup.
- Create mocks with `jest.fn()` to return values and verify exact arguments in calls.
- Prefer `expect(res.status).toHaveBeenCalledWith(200)` for HTTP response validation in controller tests.
- Leverage `expect.any(Type)` for flexible assertions on dynamic data like arrays.

### React Testing Library
- For TypeScript: Structure tests with describe('ComponentName') and it('descriptive scenario') blocks.
- Render components via render(<ComponentName prop="value" />) and query elements using screen.getByRole('button') or screen.getByText('text').
- Simulate interactions with const user = userEvent.setup(); await user.click(screen.getByRole('button')).
- Assert presence or state with expect(screen.getByText('expected')).toBeInTheDocument().
- Create mock handler functions and verify calls with expect(mockFn).toHaveBeenCalledWith(expectedArgs).
- For TypeScript: Clear all mocks in beforeEach to ensure test isolation and consistent starting state.
- Handle async behavior with waitFor(() => expect(element).toBeInTheDocument()) for updates after interactions.
- Prefer accessible queries like getByRole over getByTestId to mimic real user behavior and improve test resilience.
- Render with required props or context to match real usage and avoid default prop issues.
- Combine multiple assertions in a single test for related user flows.

### Playwright
- Use Playwright for E2E, integration, and browser tests simulating user interactions.
- Write tests in TypeScript for type-safe selectors, actions, and assertions.
- Run tests via `npx playwright test` or npm scripts for local and CI execution.
- Test across Chromium, Firefox, and WebKit browsers for cross-browser reliability.
- Configure playwright.config.ts with baseURL, viewport sizes, and timeouts to match production environments and reduce flakiness.
- Leverage auto-waiting features and expect() assertions for robust, low-maintenance tests without manual sleeps.
- Enable tracing, screenshots, and video capture on failure for efficient debugging of intermittent issues.
- Use getByRole, getByText, or getByTestId locators prioritizing accessibility over fragile selectors.
