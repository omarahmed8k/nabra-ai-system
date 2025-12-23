import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock locale to Arabic so toggle targets English
jest.mock("next-intl", () => ({
  __esModule: true,
  useLocale: () => "ar",
}));

const replaceMock = jest.fn();

// Mock i18n navigation hooks
jest.mock("@/i18n/routing", () => ({
  __esModule: true,
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/ar/provider",
}));

import { LanguageSwitcher } from "../language-switcher";

describe("LanguageSwitcher", () => {
  it("strips existing locale before replacing to avoid double prefix", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const button = await screen.findByRole("button");
    await user.click(button);

    // Should call replace with path without the current locale
    expect(replaceMock).toHaveBeenCalledWith("/provider", { locale: "en" });
  });
});
