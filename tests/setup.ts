import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library auto-cleans only when vitest runs with `globals: true`, which
// this project does not. Without this, a second render in the same file finds
// the previous one still mounted and every query matches twice.
afterEach(cleanup);
