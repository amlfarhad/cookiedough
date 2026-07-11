import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverageNotes } from "./CoverageNotes";

describe("CoverageNotes", () => {
  it("renders every coverage and execution note as visible semantic list content", () => {
    render(
      <CoverageNotes
        notes={[
          "Credentials were not supplied.",
          "Docker was required but unavailable. Repo command execution was blocked.",
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Coverage and execution notes" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Credentials were not supplied.");
    expect(screen.getByRole("list")).toHaveTextContent(
      "Docker was required but unavailable. Repo command execution was blocked.",
    );
  });
});
