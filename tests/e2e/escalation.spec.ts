import { expect, test } from "@playwright/test";

const humanRouteName = "Contact [NAMED HUMAN ROLE] via [ORG-APPROVED CHANNEL]";

test("renders the terminal local human route without agent controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to a person" }).click();

  await expect(page.getByRole("heading", { name: "Please contact a person" })).toBeVisible();
  await expect(page.getByRole("link", { name: humanRouteName })).toBeVisible();
  await expect(page.getByText("This navigation session is closed.")).toBeVisible();
  await expect(page.getByRole("button", { name: /talk to a person/i })).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /retry|try again|dismiss|close/i })).toHaveCount(0);
});

test("keeps the human route visible on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to a person" }).click();

  const route = page.getByTestId("human-route");
  await expect(route).toBeVisible();
  await expect(route).toBeInViewport();
});
