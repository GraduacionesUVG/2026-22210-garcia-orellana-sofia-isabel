import * as RegisterFormModule from "@/features/auth/components/register/RegisterForm";

describe("registration success navigation", () => {
  it("sends an immediately authenticated account to the projects dashboard", () => {
    const handleRegistrationSuccess = (
      RegisterFormModule as typeof RegisterFormModule & {
        handleRegistrationSuccess?: (input: {
          needsEmailConfirmation: boolean;
          router: {
            push: (href: string) => void;
            refresh: () => void;
          };
          setSuccessMessage: (message: string) => void;
        }) => void;
      }
    ).handleRegistrationSuccess;

    expect(typeof handleRegistrationSuccess).toBe("function");

    const navigatedTo: string[] = [];
    const successMessages: string[] = [];
    let refreshCount = 0;

    handleRegistrationSuccess?.({
      needsEmailConfirmation: false,
      router: {
        push(href: string) {
          navigatedTo.push(href);
        },
        refresh() {
          refreshCount += 1;
        },
      },
      setSuccessMessage(message: string) {
        successMessages.push(message);
      },
    });

    expect(navigatedTo).toEqual(["/dashboard"]);
    expect(refreshCount).toBe(1);
    expect(successMessages).toEqual([]);
  });
});
