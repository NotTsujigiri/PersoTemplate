# TypeScript policy

Author executable source, tests, support tools, and configuration in TypeScript. Generated JavaScript output and external dependencies are not authored source.

Run `npm run check:types` before build and verification. Keep strict checking enabled. Do not use `any`, unchecked type assertions, non-null assertions, compiler suppression comments, untyped imports, or dynamic evaluation to bypass contracts. Parse untrusted input as `unknown` and validate it into concrete types at the boundary. A typing exception requires explicit user authorization; no exception mechanism is implemented. Never weaken the check to make existing code pass.
