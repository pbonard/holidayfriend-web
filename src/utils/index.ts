// as tall as its text, never shorter than its rows. not field-sizing: content, safari and firefox don't all have it yet
export function fitToContent(textarea: HTMLTextAreaElement) {
  // back to the rows' height first, so it can shrink when text is deleted
  textarea.style.height = 'auto';
  // scrollHeight leaves out the border, and the box sizes with it
  const border = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${textarea.scrollHeight + border}px`;
}

// a person's profile page, /profile/{id}
export function profilePath(userId: string) {
  return `/profile/${userId}`;
}
