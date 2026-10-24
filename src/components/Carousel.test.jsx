import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Carousel from './Carousel';

const images = [
  { src: 'a.jpg', alt: 'First' },
  { src: 'b.jpg', alt: 'Second' },
  { src: 'c.jpg', alt: 'Third' },
];

// Simulates a finger going down at startX and lifting at endX.
const swipe = (element, startX, endX) => {
  fireEvent.touchStart(element, { touches: [{ clientX: startX }] });
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: endX }] });
};

describe('Carousel swipe', () => {
  it('swipes left to the next image and right to go back, wrapping round', () => {
    render(<Carousel images={images} />);
    const wrapper = screen.getByAltText('First').parentElement;

    swipe(wrapper, 300, 100);
    expect(screen.getByAltText('Second')).toBeInTheDocument();

    swipe(wrapper, 100, 300);
    swipe(wrapper, 100, 300);
    expect(screen.getByAltText('Third')).toBeInTheDocument();
  });

  it('ignores small movements', () => {
    render(<Carousel images={images} />);
    const wrapper = screen.getByAltText('First').parentElement;
    swipe(wrapper, 200, 180);
    expect(screen.getByAltText('First')).toBeInTheDocument();
  });
});
