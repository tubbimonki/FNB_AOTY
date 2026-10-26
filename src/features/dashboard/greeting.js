// "Good morning" before 12:00, "Good afternoon" until 17:00, then "Good evening".
export const greeting = (hour = new Date().getHours()) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
