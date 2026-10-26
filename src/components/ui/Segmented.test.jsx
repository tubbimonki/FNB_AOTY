import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Segmented from './Segmented';

const OPTIONS = [{ id: 'a', label: 'Current' }, { id: 'b', label: 'Forecast' }, { id: 'c', label: 'Alerts' }];

describe('Segmented', () => {
  it('switches view and slides the highlight under the chosen button', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<Segmented label="View" options={OPTIONS} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Alerts' }));
    expect(onChange).toHaveBeenCalledWith('c');

    rerender(<Segmented label="View" options={OPTIONS} value="c" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Alerts' })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[aria-hidden="true"]').style.transform).toBe('translateX(200%)');
  });

  it('ignores a tap on the view that is already showing', async () => {
    const onChange = vi.fn();
    render(<Segmented label="View" options={OPTIONS} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Current' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
