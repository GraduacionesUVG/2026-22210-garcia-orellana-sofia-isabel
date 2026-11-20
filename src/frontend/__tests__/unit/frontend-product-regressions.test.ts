import { updateMe } from "@/features/profile/api/profile.api";
import { getReadonlySelectionRange } from "@/features/projects/analysis/helpers/analysis.helpers";
import { getMemberDisplayName } from "@/features/projects/team/helpers/team.helpers";

describe('team member identity labels', () => {
  it.each([
    [{ full_name: '  Julio  ', email: 'owner@example.test', role: 'owner' }, 'Julio'],
    [{ full_name: ' ', username: 'Sofia', role: 'editor' }, 'Sofia'],
    [{ full_name: null, email: 'owner@example.test', role: 'owner' }, 'owner@example.test'],
    [{ user_id: 'technical-id', full_name: null, email: null, role: 'owner' }, 'Propietario del proyecto'],
    [{ user_id: 'technical-id', role: 'editor' }, 'Integrante del proyecto'],
  ])('never exposes a technical ID for %j', (member, expected) => {
    expect(getMemberDisplayName(member)).toBe(expected);
  });
});

describe("readonly evidence keyboard navigation", () => {
  test.each([
    ['Hola 🌿 mundo', 0, 13, 'forward', 'ArrowLeft', false, { start: 0, end: 0, direction: 'none' }],
    ['Hola 🌿 mundo', 5, 5, 'none', 'ArrowRight', true, { start: 5, end: 7, direction: 'forward' }],
    ['Hola 🌿 mundo', 7, 7, 'none', 'ArrowLeft', true, { start: 5, end: 7, direction: 'backward' }],
    ['Hola 🌿 mundo', 5, 7, 'forward', 'ArrowLeft', true, { start: 5, end: 5, direction: 'none' }],
    ['Hola 🌿 mundo', 5, 7, 'backward', 'ArrowRight', true, { start: 7, end: 7, direction: 'none' }],
    ['👩🏽‍💻e\u0301', 0, 0, 'none', 'ArrowRight', true, { start: 0, end: 7, direction: 'forward' }],
    ['👩🏽‍💻e\u0301', 7, 7, 'none', 'ArrowRight', true, { start: 7, end: 9, direction: 'forward' }],
    ['', 0, 0, 'none', 'ArrowRight', true, { start: 0, end: 0, direction: 'none' }],
    ['abc', 0, 0, 'none', 'ArrowLeft', true, { start: 0, end: 0, direction: 'none' }],
    ['abc', 3, 3, 'none', 'ArrowRight', true, { start: 3, end: 3, direction: 'none' }],
  ])('keeps UTF16 boundaries for %p %p–%p %s %s shift=%s', (text, start, end, direction, key, shiftKey, expected) => {
    expect(getReadonlySelectionRange({ text, start, end, direction, key, shiftKey })).toEqual(expected);
  });
});

describe("profile save response validation", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  for (const body of ["{", "null", "[]", "{}", '{"ok":true,"profile":{}}']) {
    it(`does not confirm save for invalid response ${body}`, async () => {
      global.fetch = jest.fn().mockResolvedValue(new Response(body, {
        status: 200, headers: { "Content-Type": "application/json" },
      }));
      await expect(updateMe({ full_name: "Nombre conservado" })).rejects.toThrow("No se pudo actualizar el perfil.");
    });
  }

  it("returns the server profile rather than pretending a save from the submitted draft", async () => {
    global.fetch = jest.fn().mockResolvedValue(Response.json({ ok: true, profile: { full_name: "Nombre del servidor" } }));
    const saved = await updateMe({ full_name: "Nombre enviado" });
    expect(saved.profile.full_name).toBe("Nombre del servidor");
    expect(global.fetch).toHaveBeenCalledWith("/api/users/me", expect.objectContaining({ method: "PATCH", body: '{"full_name":"Nombre enviado"}' }));
  });
});
