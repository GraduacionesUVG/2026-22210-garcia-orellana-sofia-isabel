import {
  handleDialogKeyDown,
  restoreDialogFocus,
} from "@/features/projects/workspace/accessibleDialog.helpers";

describe("accessible dialog helpers", () => {
  it("closes the top dialog with Escape", () => {
    let closed = false;
    let prevented = false;

    handleDialogKeyDown(
      {
        key: "Escape",
        preventDefault: () => {
          prevented = true;
        },
      },
      { dialog: null, close: () => (closed = true) }
    );

    expect(prevented).toBe(true);
    expect(closed).toBe(true);
  });

  it("wraps Tab and Shift+Tab inside the dialog", () => {
    let focused = "";
    const first = { focus: () => (focused = "first") };
    const last = { focus: () => (focused = "last") };
    const dialog = { querySelectorAll: () => [first, last] };

    handleDialogKeyDown(
      { key: "Tab", shiftKey: false, target: last, preventDefault: jest.fn() },
      { dialog, close: jest.fn() }
    );
    expect(focused).toBe("first");

    handleDialogKeyDown(
      { key: "Tab", shiftKey: true, target: first, preventDefault: jest.fn() },
      { dialog, close: jest.fn() }
    );
    expect(focused).toBe("last");
  });

  it("restores focus to the exact trigger when it still exists", () => {
    const trigger = { isConnected: true, focus: jest.fn() };

    restoreDialogFocus(trigger);

    expect(trigger.focus).toHaveBeenCalledTimes(1);
  });
});
