import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { MAX_REPORT_BYTES } from "./lib/report-schema";

const importedReport = {
  run: {
    id: "run_imported",
    startedAt: "2026-07-10T00:00:00.000Z",
    mode: "url",
    supportLevel: "partial support",
  },
  target: { url: "https://imported.example.com" },
  scores: {
    cookieDough: 72,
    demoReadiness: 80,
    customerLaunchReadiness: 65,
    engineeringHandoffReadiness: 75,
    verdict: "almost baked",
  },
  findings: [
    {
      id: "CD-IMPORT-001",
      severity: "high",
      category: "import-check",
      title: "Imported finding",
      description: "The imported report rendered from browser memory.",
      evidence: [{ type: "dom", message: "Imported report fixture" }],
      recommendation: "Review the imported report.",
    },
  ],
  notes: ["Imported locally."],
};

function makeFile(text: string, size = new TextEncoder().encode(text).byteLength): File {
  return { name: "report.json", type: "application/json", size, text: vi.fn(async () => text) } as unknown as File;
}

function importFile(file: File): void {
  fireEvent.change(screen.getByLabelText("Import report"), { target: { files: [file] } });
}

function selectCase(label: string): void {
  fireEvent.change(screen.getByLabelText("Audit case"), { target: { value: label } });
}

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("loads the CookieDough self-audit with its score and product attribution", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "CookieDough" })).toBeInTheDocument();
    expect(screen.getByText("Evidence-first readiness auditor")).toBeInTheDocument();
    expect(screen.getByLabelText("Audit case")).toHaveValue("self-audit");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("100");
    expect(screen.getByRole("link", { name: "Built by Amal Farhad" })).toHaveAttribute(
      "href",
      "https://github.com/amlfarhad",
    );
    expect(screen.getByRole("link", { name: "View CookieDough on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/amlfarhad/cookiedough",
    );
  });

  it("switches bundled cases and renders the safely blocked isolation score", () => {
    render(<App />);

    selectCase("docker-required");

    expect(screen.getByLabelText("Audit case")).toHaveValue("docker-required");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("45");
    expect(screen.getByText("could not execute")).toBeInTheDocument();
    expect(screen.getByText("Docker was required but unavailable")).toBeInTheDocument();
  });

  it("updates the emphasized score when a readiness lens is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Engineering handoff 100/i }));

    expect(screen.getByRole("button", { name: /Engineering handoff 100/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("100");
  });

  it("filters findings through the integrated severity controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    selectCase("docker-required");

    await user.click(screen.getByRole("button", { name: /blocker: 1 findings/i }));

    expect(screen.getByText("0 findings shown")).toBeInTheDocument();
    expect(screen.getByText(/No findings match the selected severities/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByText("Docker was required but unavailable")).toBeInTheDocument();
  });

  it("imports a valid JSON report into the temporary private case", async () => {
    render(<App />);

    importFile(makeFile(JSON.stringify(importedReport)));

    expect(await screen.findByRole("option", { name: "Imported report" })).toBeInTheDocument();
    expect(screen.getByLabelText("Audit case")).toHaveValue("imported");
    expect(screen.getByText("https://imported.example.com")).toBeInTheDocument();
    expect(screen.getByText("Imported finding")).toBeInTheDocument();
    expect(screen.getByTestId("selected-score")).toHaveTextContent("72");
    expect(screen.getByText("Private browser import")).toBeInTheDocument();
  });

  it("shows malformed JSON errors without replacing the current report", async () => {
    render(<App />);
    selectCase("docker-required");

    importFile(makeFile("{not-json"));

    expect(await screen.findByRole("alert")).toHaveTextContent("not valid JSON");
    expect(screen.getByLabelText("Audit case")).toHaveValue("docker-required");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("45");
  });

  it("shows a specific oversized-file error without replacing the current report", async () => {
    render(<App />);
    selectCase("docker-required");

    importFile(makeFile("{}", MAX_REPORT_BYTES + 1));

    expect(await screen.findByRole("alert")).toHaveTextContent("larger than 2 MB");
    expect(screen.getByLabelText("Audit case")).toHaveValue("docker-required");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("45");
  });

  it("clears an earlier import error after a successful import", async () => {
    render(<App />);

    importFile(makeFile("not-json"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    importFile(makeFile(JSON.stringify(importedReport)));

    await screen.findByText("Imported finding");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces successful clipboard copies", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<App />);

    const command = screen.getByLabelText("CookieDough command");
    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(writeText).toHaveBeenCalledWith(command.textContent);
    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent("Copied feedback");
  });

  it("selects the command and gives manual-copy feedback when clipboard access is rejected", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => Promise.reject(new Error("Denied"))) },
    });
    render(<App />);

    const command = screen.getByLabelText("CookieDough command");
    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent(
      "Select the command and copy it manually",
    );
    expect(command).toBeInTheDocument();
    expect(document.getSelection()?.toString()).toContain(command.textContent ?? "");
  });

  it("never persists reports or controls in browser storage", async () => {
    const user = userEvent.setup();
    const localStorageWrite = vi.spyOn(Storage.prototype, "setItem");
    const sessionStorageWrite = vi.spyOn(Storage.prototype, "setItem");
    render(<App />);

    selectCase("docker-required");
    await user.click(screen.getByRole("button", { name: /Customer launch 45/i }));
    importFile(makeFile(JSON.stringify(importedReport)));
    await screen.findByText("Imported finding");

    expect(localStorageWrite).not.toHaveBeenCalled();
    expect(sessionStorageWrite).not.toHaveBeenCalled();
  });
});
