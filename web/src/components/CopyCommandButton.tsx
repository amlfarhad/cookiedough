import { Copy } from "lucide-react";

interface CopyCommandButtonProps {
  readonly command: string;
  readonly onFeedback: (message: string) => void;
}

function selectCommand(element: HTMLElement): void {
  const selection = window.getSelection?.();

  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function CopyCommandButton({ command, onFeedback }: CopyCommandButtonProps) {
  const copyCommand = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(command);
      onFeedback("Copied feedback");
    } catch {
      const commandElement = document.getElementById("cookiedough-command");
      if (commandElement) selectCommand(commandElement);
      onFeedback("Select the command and copy it manually");
    }
  };

  return (
    <div className="copy-command-button">
      <code id="cookiedough-command" tabIndex={0} aria-label="CookieDough command">
        {command}
      </code>
      <button type="button" onClick={() => void copyCommand()}>
        <Copy aria-hidden="true" strokeWidth={1.75} />
        <span>Copy command</span>
      </button>
    </div>
  );
}
