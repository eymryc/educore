import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatePicker, parseFlexibleDate } from "@/presentation/components/shared/DatePicker";

describe("DatePicker", () => {
  it("parses ISO and French dates", () => {
    expect(parseFlexibleDate("2012-04-15")).toBe("2012-04-15");
    expect(parseFlexibleDate("15/04/2012")).toBe("2012-04-15");
    expect(parseFlexibleDate("")).toBe("");
    expect(parseFlexibleDate("32/13/2012")).toBeNull();
  });

  it("commits a typed ISO date on blur", () => {
    const onChange = vi.fn();
    render(<DatePicker ariaLabel="Date de naissance" onChange={onChange} value="" />);
    const input = screen.getByLabelText(/date de naissance/i);
    fireEvent.change(input, { target: { value: "2012-04-15" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("2012-04-15");
  });

  it("picks today from the calendar", () => {
    const onChange = vi.fn();
    render(<DatePicker ariaLabel="Date" onChange={onChange} value="2026-09-01" />);
    fireEvent.click(screen.getByRole("button", { name: /ouvrir le calendrier/i }));
    fireEvent.click(screen.getByRole("button", { name: "Aujourd'hui" }));
    expect(onChange).toHaveBeenCalled();
  });
});
