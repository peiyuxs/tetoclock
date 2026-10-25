import Link from "next/link";
import SiteNav from "../components/SiteNav";

const galleryCards = [
  { number: "01", title: "A song for the sunrise", subtitle: "YouTube video placeholder" },
  { number: "02", title: "Teto takes the stage", subtitle: "YouTube video placeholder" },
  { number: "03", title: "One more encore", subtitle: "YouTube video placeholder" },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-shade" />
          <div className="hero-ornament hero-ornament--left" aria-hidden="true">
            ✳
          </div>
          <div className="hero-ornament hero-ornament--right" aria-hidden="true">
            ✳
          </div>
          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">A smarter alarm, with a little more Teto</p>
            <h1 id="hero-title">
              <span>Full Steam Ahead:</span>
              <strong>It&apos;s TETO&apos;Clock!</strong>
            </h1>
            <span className="title-rule" aria-hidden="true" />
            <p className="hero-caption">
              It&apos;s time to say goodbye to multiple alarms…
              <br />
              because it&apos;s TetO&apos;Clock!
            </p>
            <Link className="button button--light" href="/my-tetoclock">
              Meet your morning conductor <span aria-hidden="true">→</span>
            </Link>
          </div>
          <a className="scroll-cue" href="#about">
            <span className="scroll-line" />
            Scroll to explore
          </a>
          <span className="hero-note">WAKE UP. SHOW UP. TETO&apos;CLOCK.</span>
        </section>

        <section className="story-section section-wrap" id="about">
          <div className="section-kicker"><span>01</span> THE PROJECT</div>
          <div className="story-grid">
            <div>
              <p className="eyebrow">A different kind of wake-up call</p>
              <h2>About <em>TETO&apos;Clock</em></h2>
            </div>
            <div className="section-copy">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Our project brings
                together a playful voice, a little hardware, and a better way to start the day.
                Pellentesque habitant morbi tristique senectus et netus et malesuada fames.
              </p>
              <p>
                Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Curabitur
                blandit tempus porttitor, and the morning is yours to make.
              </p>
              <Link className="text-link" href="/my-tetoclock">
                Explore your dashboard <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div className="project-stamp" aria-hidden="true">WAKE UP<br />WITH TETO</div>
        </section>

        <section className="thanks-section" id="acknowledgements">
          <div className="thanks-image" role="img" aria-label="Kasane Teto's head bobbing to the beat" />
          <div className="thanks-panel">
            <div className="section-kicker section-kicker--light"><span>02</span> THE PEOPLE</div>
            <p className="eyebrow">Acknowledgements · It takes a whole crew</p>
            <h2>A little thanks<br />goes a long way.</h2>
            <p className="thanks-copy">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Thank you to the
              hackathon organizers for the opportunity to dream up something fun, and to our
              teammates, friends, and loved ones for cheering us on. This one&apos;s for you.
            </p>
            <p className="signature">With love, the TETO&apos;Clock team</p>
          </div>
        </section>

        <section className="gallery-section section-wrap" id="gallery">
          <div className="section-kicker"><span>03</span> THE SOUNDTRACK</div>
          <div className="gallery-heading">
            <div>
              <p className="eyebrow">A playlist for the platform</p>
              <h2>Gallery <em>&amp; good tunes</em></h2>
            </div>
            <p className="gallery-intro">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. A little corner for
              our favorite Teto songs and videos.
            </p>
          </div>
          <div className="gallery-grid">
            {galleryCards.map((card) => (
              <article className="gallery-card" key={card.number}>
                <div className="video-placeholder">
                  <span className="video-number">{card.number}</span>
                  <span className="play-button" aria-hidden="true">▶</span>
                  <span className="video-caption">{card.subtitle}</span>
                </div>
                <h3>{card.title}</h3>
                <p>Our favorite Teto moments, coming soon.</p>
              </article>
            ))}
          </div>
          <a
            className="text-link gallery-link"
            href="https://www.youtube.com/results?search_query=Kasane+Teto+songs"
            target="_blank"
            rel="noreferrer"
          >
            Find Teto on YouTube <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true">T</span>
            <span>TETO&apos;Clock</span>
          </Link>
          <p>Full steam ahead. One morning at a time.</p>
          <nav aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#acknowledgements">Acknowledgements</a>
            <a href="#gallery">Gallery</a>
            <Link href="/my-tetoclock">My TetoClock</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 TETO&apos;Clock. Made with love and a little bit of chaos.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
