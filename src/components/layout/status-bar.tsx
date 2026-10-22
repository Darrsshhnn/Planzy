/** iOS-style status bar, shown only inside the desktop phone frame. */
export function StatusBar() {
  return (
    <div className="hidden h-[54px] shrink-0 items-center justify-between px-10 pt-1 md:flex" aria-hidden>
      <span className="text-[17px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-[6px]">
        <svg width="18" height="12" viewBox="0 0 18 12">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="#242A2F" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#242A2F" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="#242A2F" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="#242A2F" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.5 10.5 0 0 0 8.5.4 10.5 10.5 0 0 0 1 3.4l1.2 1.3a8.9 8.9 0 0 1 6.3-2.5Z" fill="#242A2F" />
          <path d="M8.5 5.6c1.5 0 2.8.5 3.9 1.5l1.2-1.3a7.4 7.4 0 0 0-10.2 0l1.2 1.3a5.6 5.6 0 0 1 3.9-1.5Z" fill="#242A2F" />
          <path d="M8.5 9c.6 0 1.1.2 1.5.6L8.5 11.3 7 9.6c.4-.4.9-.6 1.5-.6Z" fill="#242A2F" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="#242A2F" opacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.2" fill="#242A2F" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="#242A2F" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
