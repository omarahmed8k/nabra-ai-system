import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../button";

describe("Button Component", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText("Disabled Button");
    expect(button).toBeDisabled();
  });

  it("should apply variant styles", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByText("Outline")).toHaveClass("border");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByText("Destructive")).toBeInTheDocument();
  });

  it("should apply size styles", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByText("Small")).toBeInTheDocument();
  });

  it("should not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    fireEvent.click(screen.getByText("Disabled"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
