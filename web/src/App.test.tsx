import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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

function makeRejectedFile(): File {
  return {
    name: "report.json",
    type: "application/json",
    size: 2,
    text: vi.fn(async () => Promise.reject(new Error("Read failed"))),
  } as unknown as File;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function makeDeferredFile(text: Promise<string>): File {
  return { name: "report.json", type: "application/json", size: 2, text: vi.fn(() => text) } as unknown as File;
}

function spyOnStorageSetItem(storage: Storage) {
  try {
    return vi.spyOn(storage, "setItem");
  } catch {
    return vi.spyOn(Storage.prototype, "setItem");
  }
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
  vi.unstubAllGlobals();
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
    for (const link of screen.getAllByRole("link")) {
      if (link.getAttribute("href")?.startsWith("https://")) {
        expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
      }
    }
    expect(screen.getByRole("heading", { name: "From repository to portable evidence" })).toBeInTheDocument();
    for (const stage of [
      "Repo intake",
      "Isolated command execution",
      "Browser evidence",
      "Deterministic findings and scoring",
      "Portable reports",
    ]) {
      expect(screen.getByRole("heading", { name: stage })).toBeInTheDocument();
    }
    expect(screen.getByText(/Docker is preferred for repository execution/i)).toBeInTheDocument();
    expect(screen.getByText(/strongest on Node web repositories/i)).toBeInTheDocument();
    expect(screen.getByText(/React, Next\.js, and Vite projects are covered through package-script discovery/i)).toBeInTheDocument();
    expect(screen.queryByText(/accessibility evidence/i)).not.toBeInTheDocument();
    expect(screen.getByText("25 CLI tests")).toBeInTheDocument();
    expect(screen.getByText("70+ web tests")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coverage and execution notes" })).toBeInTheDocument();
    expect(screen.getByText(
      "Docker was unavailable. Host execution ran repo commands on this machine. Use --docker required for stricter isolation.",
    )).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Architecture" })).toHaveAttribute(
      "href",
      "https://github.com/amlfarhad/cookiedough/blob/main/docs/architecture.md",
    );
    expect(screen.getByRole("link", { name: "Safety model" })).toHaveAttribute(
      "href",
      "https://github.com/amlfarhad/cookiedough/blob/main/docs/safety.md",
    );
    expect(screen.getByText(/hosted page is a report viewer/i)).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toContainElement(screen.getByRole("heading", { name: "From repository to portable evidence" }));
    expect(main).toContainElement(screen.getByRole("heading", { name: "Built by Amal Farhad" }));
    expect(main).not.toContainElement(screen.getByText(/hosted page is a report viewer/i));
  });

  it("switches bundled cases and renders the Northstar URL audit score", () => {
    render(<App />);

    selectCase("northstar");

    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("70");
    expect(screen.getByText("strong support")).toBeInTheDocument();
    expect(screen.getByText("Browser audit captured failed network requests")).toBeInTheDocument();
  });

  it("updates the emphasized score when a readiness lens is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Engineering handoff 100/i }));

    expect(screen.getByRole("button", { name: /Engineering handoff 100/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("100");
  });

  it("labels the raw report verdict separately from a selected readiness lens", async () => {
    const user = userEvent.setup();
    render(<App />);
    importFile(
      makeFile(
        JSON.stringify({
          ...importedReport,
          scores: {
            ...importedReport.scores,
            cookieDough: 45,
            engineeringHandoffReadiness: 100,
            verdict: "raw dough",
          },
        }),
      ),
    );
    await screen.findByText("Imported finding");

    await user.click(screen.getByRole("button", { name: /Engineering handoff 100/i }));

    expect(screen.getByTestId("selected-score")).toHaveTextContent("100");
    expect(screen.getByText("Overall verdict")).toBeInTheDocument();
    expect(screen.getByText("raw dough")).toBeInTheDocument();
  });

  it("filters findings through the integrated severity controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    selectCase("northstar");

    await user.click(screen.getByRole("button", { name: /high: 1 findings/i }));
    await user.click(screen.getByRole("button", { name: /medium: 1 findings/i }));

    expect(screen.getByText("0 findings shown")).toBeInTheDocument();
    expect(screen.getByText(/No findings match the selected severities/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByText("Browser audit captured failed network requests")).toBeInTheDocument();
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
    expect(screen.getByText("Import provenance")).toBeInTheDocument();
    expect(screen.getByText("Loaded from this browser tab")).toBeInTheDocument();
    expect(screen.getByText(/No execution command is embedded in this imported report\./i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy command" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("CookieDough command")).not.toBeInTheDocument();
  });

  it("shows malformed JSON errors without replacing the current report", async () => {
    render(<App />);
    selectCase("northstar");

    importFile(makeFile("{not-json"));

    expect(await screen.findByRole("alert")).toHaveTextContent("not valid JSON");
    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("70");
  });

  it("shows a specific oversized-file error without replacing the current report", async () => {
    render(<App />);
    selectCase("northstar");

    importFile(makeFile("{}", MAX_REPORT_BYTES + 1));

    expect(await screen.findByRole("alert")).toHaveTextContent("larger than 2 MB");
    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("70");
  });

  it("clears an earlier import error after a successful import", async () => {
    render(<App />);

    importFile(makeFile("not-json"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    importFile(makeFile(JSON.stringify(importedReport)));

    await screen.findByText("Imported finding");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps only the latest overlapping import when reads resolve out of order", async () => {
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const secondReport = {
      ...importedReport,
      run: { ...importedReport.run, id: "run_latest" },
      target: { url: "https://latest.example.com" },
      scores: { ...importedReport.scores, cookieDough: 88 },
    };
    render(<App />);

    const input = screen.getByLabelText("Import report");
    fireEvent.change(input, { target: { files: [makeDeferredFile(firstRead.promise)] } });
    fireEvent.change(input, { target: { files: [makeDeferredFile(secondRead.promise)] } });

    expect(input).toBeDisabled();
    expect(input.parentElement).toHaveAttribute("aria-busy", "true");

    await act(async () => secondRead.resolve(JSON.stringify(secondReport)));
    expect(await screen.findByText("https://latest.example.com")).toBeInTheDocument();

    await act(async () => firstRead.resolve("not-json"));
    expect(screen.getByText("https://latest.example.com")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();
    expect(input.parentElement).toHaveAttribute("aria-busy", "false");
  });

  it("does not update state after an import is unmounted", async () => {
    const read = deferred<string>();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = render(<App />);

    importFile(makeDeferredFile(read.promise));
    view.unmount();

    await act(async () => read.resolve(JSON.stringify(importedReport)));

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps the import input busy until the latest request settles", async () => {
    const read = deferred<string>();
    render(<App />);

    const input = screen.getByLabelText("Import report");
    fireEvent.change(input, { target: { files: [makeDeferredFile(read.promise)] } });

    expect(input).toBeDisabled();
    expect(input.parentElement).toHaveAttribute("aria-busy", "true");

    await act(async () => read.resolve(JSON.stringify(importedReport)));

    expect(input).not.toBeDisabled();
    expect(input.parentElement).toHaveAttribute("aria-busy", "false");
  });

  it("keeps a selected bundled case when a pending import resolves later", async () => {
    const read = deferred<string>();
    render(<App />);
    const input = screen.getByLabelText("Import report");

    importFile(makeDeferredFile(read.promise));
    expect(screen.getByRole("status", { name: "Import feedback" })).toHaveTextContent("Importing report");

    selectCase("northstar");

    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("70");
    expect(screen.queryByRole("status", { name: "Import feedback" })).not.toBeInTheDocument();
    expect(input).not.toBeDisabled();

    await act(async () => read.resolve(JSON.stringify(importedReport)));

    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.queryByRole("option", { name: "Imported report" })).not.toBeInTheDocument();
  });

  it("resets the file input after successful and failed attempts so the same file can be selected again", async () => {
    render(<App />);

    const input = screen.getByLabelText("Import report") as HTMLInputElement;
    let inputValue = "C:\\fakepath\\report.json";
    Object.defineProperty(input, "value", {
      configurable: true,
      get: () => inputValue,
      set: (value: string) => {
        inputValue = value;
      },
    });

    fireEvent.change(input, { target: { files: [makeFile(JSON.stringify(importedReport))] } });
    await screen.findByText("Imported finding");

    expect(inputValue).toBe("");

    const failedFile = makeRejectedFile();
    inputValue = "C:\\fakepath\\report.json";
    fireEvent.change(input, { target: { files: [failedFile] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not read that file. Please try again.");
    expect(inputValue).toBe("");

    inputValue = "C:\\fakepath\\report.json";
    fireEvent.change(input, { target: { files: [failedFile] } });
    await vi.waitFor(() => expect(failedFile.text).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(inputValue).toBe(""));
  });

  it("shows a generic read error and preserves the current report when File.text rejects", async () => {
    render(<App />);
    selectCase("northstar");

    importFile(makeRejectedFile());

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not read that file. Please try again.");
    expect(screen.getByLabelText("Audit case")).toHaveValue("northstar");
    expect(screen.getByTestId("selected-score")).toHaveTextContent("70");
  });

  it("announces successful clipboard copies", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<App />);

    const command = screen.getByLabelText("CookieDough command");
    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(writeText).toHaveBeenCalledWith(command.textContent);
    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent("Command copied");
  });

  it("shows only the newest feedback when copy follows an import error", async () => {
    const user = userEvent.setup();
    render(<App />);

    importFile(makeFile("not-json"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Import feedback" })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent("Command copied");
  });

  it("clears copy feedback when a newer import or case selection begins", async () => {
    const user = userEvent.setup();
    const read = deferred<string>();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));
    expect(screen.getByRole("status", { name: "Copy feedback" })).toBeInTheDocument();

    importFile(makeDeferredFile(read.promise));
    expect(screen.queryByRole("status", { name: "Copy feedback" })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Import feedback" })).toHaveTextContent("Importing report");

    await act(async () => read.resolve(JSON.stringify(importedReport)));
    await screen.findByText("Imported finding");
    selectCase("self-audit");
    await user.click(screen.getByRole("button", { name: "Copy command" }));
    selectCase("northstar");

    expect(screen.queryByRole("status", { name: "Copy feedback" })).not.toBeInTheDocument();
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

  it("uses the manual-copy fallback when the Clipboard API is unavailable and selection succeeds", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent(
      "Select the command and copy it manually",
    );
  });

  it("reports unavailable copying when clipboard fallback selection cannot run", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    vi.spyOn(window, "getSelection").mockReturnValue(null);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.getByRole("status", { name: "Copy feedback" })).toHaveTextContent(
      "Copy is unavailable. Select the command and copy it manually.",
    );
  });

  it("keeps imports private without storage, cookies, or network calls", async () => {
    const user = userEvent.setup();
    const localStorageWrite = spyOnStorageSetItem(window.localStorage);
    const sessionStorageWrite = spyOnStorageSetItem(window.sessionStorage);
    const fetchMock = vi.fn();
    const initialCookie = document.cookie;
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    selectCase("northstar");
    await user.click(screen.getByRole("button", { name: /Customer launch 50/i }));
    importFile(makeFile(JSON.stringify(importedReport)));
    await screen.findByText("Imported finding");

    expect(localStorageWrite).not.toHaveBeenCalled();
    expect(sessionStorageWrite).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.cookie).toBe(initialCookie);
  });
});
