import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Carousel from './Carousel';

const images = [
  { src: 'a.jpg', alt: 'First' },
  { src: 'b.jpg', alt: 'Second' },
  { src: 'c.jpg', alt: 'Third' },
];

// Off-screen slides are aria-hidden, so getByRole only finds the one on show.
const shownImage = () => screen.getByRole('img').getAttribute('alt');

// Simulates a finger going down at startX and lifting at endX.
const swipe = (startX, endX) => {
  const track = screen.getByRole('region', { name: 'Photos' }).firstChild;
  fireEvent.touchStart(track, { touches: [{ clientX: startX }] });
  fireEvent.touchEnd(track, { changedTouches: [{ clientX: endX }] });
};

afterEach(() => vi.useRealTimers());

describe('Carousel', () => {
  it('shows one slide at a time and hides the rest from screen readers', () => {
    render(<Carousel images={images} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(shownImage()).toBe('First');
  });

  it('swipes left to the next image and right to go back, wrapping round', () => {
    render(<Carousel images={images} />);
    swipe(300, 100);
    expect(shownImage()).toBe('Second');

    swipe(100, 300);
    swipe(100, 300);
    expect(shownImage()).toBe('Third');
  });

  it('ignores small movements', () => {
    render(<Carousel images={images} />);
    swipe(200, 180);
    expect(shownImage()).toBe('First');
  });

  it('moves on by itself, and the pause button stops it', () => {
    vi.useFakeTimers();
    render(<Carousel images={images} interval={1000} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(shownImage()).toBe('Second');

    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => vi.advanceTimersByTime(5000));
    expect(shownImage()).toBe('Second');
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });

  it('renders any content with renderItem', () => {
    const items = [{ id: 'a', text: 'Alert one' }, { id: 'b', text: 'Event two' }];
    render(<Carousel items={items} renderItem={(item) => <p>{item.text}</p>} label="Highlights" itemName="highlight" />);
    expect(screen.getByRole('region', { name: 'Highlights' })).toHaveTextContent('Alert one');
    fireEvent.click(screen.getByRole('button', { name: 'Show highlight 2' }));
    expect(screen.getByRole('group')).toHaveTextContent('Event two');
  });
});
