import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Header } from "../ui/header";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    };
  },
}));

// Mock global fetch for activity/wells
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ wells: [], activities: [] }),
  })
) as jest.Mock;

describe("Header Component", () => {
  const dummyUser = {
    name: "Petrophysicist User",
    email: "user@wellqc.com",
    department: "Subsurface Analytics",
    role: "PETROPHYSICIST",
    tier: "FREE",
    freeChecksUsed: 1,
  };

  it("renders search input and role badge correctly", async () => {
    await act(async () => {
      render(
        <Header
          currentRole="PETROPHYSICIST"
          onRoleChange={jest.fn()}
          currentUser={dummyUser}
          onLogout={jest.fn()}
        />
      );
    });

    const searchInput = screen.getByPlaceholderText(/Search wells, API\/UWI numbers, operators/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("allows typing in search query input", async () => {
    await act(async () => {
      render(
        <Header
          currentRole="PETROPHYSICIST"
          onRoleChange={jest.fn()}
          currentUser={dummyUser}
          onLogout={jest.fn()}
        />
      );
    });

    const searchInput = screen.getByPlaceholderText(/Search wells, API\/UWI numbers, operators/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Alpha-1" } });
    });

    expect(searchInput.value).toBe("Alpha-1");
  });
});
