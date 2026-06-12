
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

this proyect use node 24..  verify that use nvm with node 24 to avoid compatibility issues. for comands that require node in console.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Architecture & SOLID

- Follow SOLID principles strictly, especially SRP and DIP.
- Separate database schema (Dexie setup) from CRUD logic: `AppDatabase` defines the schema, `DatabaseService` implements operations.
- Use abstract classes as contracts (e.g. `FileRepository`) so that state services depend on abstractions, not concrete implementations.
- Register concrete implementations in `app.config.ts` using `{ provide: AbstractClass, useExisting: ConcreteService }`.
- Prefer composition over inheritance for services that *use* a repository (inject it); only the concrete implementation class should *extend* the abstract repository.
- Use TypeScript `enum` instead of string union types when a value set is used across multiple files.
- Use `Array.prototype.toReversed()` / `toSorted()` instead of mutating methods (`reverse()`, `sort()`). Requires `target: ES2023` in `tsconfig.json`.
- Document all public methods with JSDoc in Spanish.

## Project Structure

```
src/app/core/
  db/              ← AppDatabase (Dexie schema only)
  models/          ← interfaces and enums
  repositories/    ← abstract repository contracts
  services/        ← concrete implementations + state services
```
