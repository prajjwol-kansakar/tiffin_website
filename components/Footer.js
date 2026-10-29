export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        <strong>Authentic Taste</strong>
      </p>
      <p>Homemade taste, delivered fresh.</p>
      <div className="footer-contact">
        <p>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h3l2 5-2 1.5a15 15 0 0 0 4.5 4.5L16 12l5 2v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.7-3 2-3Z" />
          </svg>
          <a href="tel:+16504081637">(650) 408-1637</a>
        </p>
        <p>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>1931 California Street, Mountain View, CA 94040</span>
        </p>
      </div>
      <p>© {new Date().getFullYear()} Authentic Taste. All rights reserved.</p>
    </footer>
  );
}
