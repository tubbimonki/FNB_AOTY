import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Photo from './Photo';

const image = { src: 'https://example.com/tree.jpg', alt: 'A tree' };

describe('Photo', () => {
  it('renders the image with its alt text', () => {
    render(<Photo image={image} />);
    expect(screen.getByRole('img', { name: 'A tree' })).toHaveAttribute('src', image.src);
  });

  it('swaps to a placeholder when the image fails to load', () => {
    render(<Photo image={image} />);
    fireEvent.error(screen.getByRole('img', { name: 'A tree' }));
    const placeholder = screen.getByRole('img', { name: 'A tree' });
    expect(placeholder.tagName).toBe('DIV');
  });
});
