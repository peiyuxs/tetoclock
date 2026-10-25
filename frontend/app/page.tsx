import Link from "next/link";
import SiteNav from "../components/SiteNav";

const galleryCards = [
  {
    number: "01",
    title: "Machine Love",
    artist: "Jamie Paige / JamieP",
    videoId: "sqK-jh4TDXo",
  },
  {
    number: "02",
    title: "BIRDBRAIN",
    artist: "Jamie Paige / JamieP feat. OK Glass",
    videoId: "0iVlSNpq8i8",
  },
  {
    number: "03",
    title: "Mesmerizer",
    artist: "32ki (Satsuki)",
    videoId: "19y8YTbvri8",
  },
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
              Pair My TetoClock <span aria-hidden="true">→</span>
            </Link>
          </div>
          <a className="scroll-cue" href="#about">
            <span className="scroll-line" />
            Scroll down to learn more!
          </a>
        </section>

        <section className="story-section section-wrap" id="about">
          <div className="story-grid">
            <div>
              <p className="eyebrow">No more excuses... Teto will wake you up.</p>
              <h2>Our Project</h2>
              <img
                className="project-image"
                src="/teto-head-bob.gif"
                alt="Kasane Teto beside the TETO'Clock project"
              />
            </div>
            <div className="section-copy">
              <p>
                Afraid of oversleeping on a special occasion, like a hackathon? It's time to say goodbye to multiple alarms… because it's TetO'Clock!
              </p>
              <p>
                TetO'Clock forces lazy sleepers to actually get up from bed, and vigorously aim for our Kasane Teto-inspired steam train alarm clock. She'll make sure you won't go back to sleep... and turn your easy morning into an annoying, but active challenge with intention and meaning.
              </p>
              <Link className="text-link" href="/my-tetoclock">
                Try TetoClock! <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="thanks-section" id="acknowledgements">
          <div className="thanks-image" role="img" aria-label="Kasane Teto's head bobbing to the beat" />
          <div className="thanks-panel">
            <p className="eyebrow">Acknowledgements</p>
            <h2>Thank you SBUHacks!</h2>
            <p className="thanks-copy">
              TetoClock is our first hardware hackathon project, and we had so much fun!
              We are so grateful to the MLH and SBUHacks organizing teams for the holistic support and experience.
              We also want to thank all our NJIT friends for their encouragement throughout our hacking!
              <br></br><br></br>
              All hail Kasane Teto!
            </p>
            <p className="signature">Sincerely, the NJIT TETO&apos;Clock Hackathon Team</p>
          </div>
        </section>

        <section className="gallery-section section-wrap" id="gallery">
          <div className="gallery-heading">
            <div>
              <p className="eyebrow">Gallery</p>
              <h2>Check Out Our <em>Favorite Kasane Teto</em> Songs!</h2>
            </div>
          </div>
          <div className="gallery-grid">
            {galleryCards.map((card) => (
              <article className="gallery-card" key={card.number}>
                <div className="gallery-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${card.videoId}`}
                    title={`${card.title} by ${card.artist}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <h3>{card.title}</h3>
                <p className="gallery-artist">by {card.artist}</p>
              </article>
            ))}
          </div>
          <a
            className="text-link gallery-link"
            href="https://www.youtube.com/results?search_query=Kasane+Teto+songs"
            target="_blank"
            rel="noreferrer"
          >
            Find more Teto on YouTube! <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>TETO&apos;Clock</span>
          </Link>
          <p>Full Steam Ahead: It's TETO'Clock!</p>
          <nav aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#acknowledgements">Acknowledgements</a>
            <a href="#gallery">Gallery</a>
            <Link href="/my-tetoclock">My TetoClock</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026  TETO&apos;Clock. TetoNation forever!</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
