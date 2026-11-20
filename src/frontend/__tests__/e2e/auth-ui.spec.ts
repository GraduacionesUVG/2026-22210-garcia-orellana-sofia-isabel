import { expect, test } from "../frontend/fixtures";

test.describe("Auth UI resilience", () => {
  test("keeps mismatched registration passwords client-side", async ({ page }) => {
    let registerRequests = 0;
    await page.route("**/api/auth/register", async (route) => {
      registerRequests += 1;
      await route.fulfill({ status: 500, json: { ok: false, error: 'Unexpected registration request' } });
    });

    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();

    await page.getByLabel("Correo electrónico").fill("unexpected@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("Valid-password-123!");
    await page.getByLabel("Confirmar contraseña").fill("Different-password-123!");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.getByText("No coincide", { exact: true })).toBeVisible();
    expect(registerRequests).toBe(0);
  });

  test("shows a recoverable message when login loses the network", async ({ page }) => {
    await page.route("**/api/auth/login", (route) => route.abort("failed"));

    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
    await page.getByLabel("Correo electrónico").fill("user@example.com");
    await page.getByLabel("Contraseña").fill("not-the-password");
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    await expect(page.getByText("Error de red. Intenta de nuevo.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeEnabled();
  });

  test("does not crash when login returns a non-JSON server error", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 503,
        contentType: "text/plain",
        body: "temporarily unavailable",
      })
    );

    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
    await page.getByLabel("Correo electrónico").fill("user@example.com");
    await page.getByLabel("Contraseña").fill("not-the-password");
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    await expect(page.getByText("No se pudo iniciar sesión.")).toBeVisible();
    await expect(page.locator("body")).toContainText("Iniciar Sesión");
  });
});
