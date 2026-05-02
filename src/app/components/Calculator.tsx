import { useState } from "react";
import { X } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (nextOp: string) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = performCalculation(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  const performCalculation = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return prev / current;
      case "%":
        return prev % current;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    const currentValue = parseFloat(display);

    if (operation && previousValue !== null) {
      const result = performCalculation(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-lg bg-white shadow-xl border border-gray-300 p-4 w-64">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2F4EA2" }}>
            Calculator
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-3 mb-3 text-right">
          <input
            type="text"
            value={display}
            readOnly
            className="w-full bg-transparent text-right text-2xl font-semibold text-gray-800 outline-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="col-span-2 bg-red-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            C
          </button>
          <button
            onClick={handleBackspace}
            className="bg-orange-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => handleOperation("÷")}
            className="bg-blue-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber("7")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            7
          </button>
          <button
            onClick={() => handleNumber("8")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            8
          </button>
          <button
            onClick={() => handleNumber("9")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            9
          </button>
          <button
            onClick={() => handleOperation("×")}
            className="bg-blue-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber("4")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            4
          </button>
          <button
            onClick={() => handleNumber("5")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleNumber("6")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            6
          </button>
          <button
            onClick={() => handleOperation("-")}
            className="bg-blue-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            −
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber("1")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            1
          </button>
          <button
            onClick={() => handleNumber("2")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            2
          </button>
          <button
            onClick={() => handleNumber("3")}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            3
          </button>
          <button
            onClick={() => handleOperation("+")}
            className="bg-blue-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber("0")}
            className="col-span-2 bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="bg-gray-200 text-gray-800 rounded px-2 py-2 font-semibold hover:bg-gray-300 transition-colors"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="bg-green-500 text-white rounded px-2 py-2 text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
