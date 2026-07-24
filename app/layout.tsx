import Link from 'next/link'
import './globals.css'

export const metadata = {
  title: 'Golfpassi Marketing Tracker',
  description:
    'Matkojen markkinointikalenteri ja nostosuositukset',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fi">
      <body>
        {children}

        <Link
          className="global-home-button"
          href="/"
          aria-label="Siirry etusivulle"
        >
          <span
            className="global-home-icon"
            aria-hidden="true"
          >
            ←
          </span>

          <span>Etusivulle</span>
        </Link>

        <style>{`
          .global-home-button {
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 1000;

            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            min-height: 46px;
            padding: 11px 18px;

            border: 2px solid #ffffff;
            border-radius: 999px;

            background: #003c70;
            color: #ffffff;

            box-shadow:
              0 8px 24px
              rgba(0, 60, 112, 0.24);

            font-size: 14px;
            font-weight: 800;
            line-height: 1;
            text-decoration: none;

            transition:
              transform 140ms ease,
              background 140ms ease,
              box-shadow 140ms ease;
          }

          .global-home-button:hover {
            background: #00aaff;
            color: #ffffff;
            transform: translateY(-2px);

            box-shadow:
              0 11px 28px
              rgba(0, 60, 112, 0.3);
          }

          .global-home-button:focus-visible {
            outline: 3px solid #ff8200;
            outline-offset: 3px;
          }

          .global-home-icon {
            font-size: 20px;
            line-height: 1;
          }

          @media (max-width: 640px) {
            .global-home-button {
              right: 14px;
              bottom: 14px;

              min-height: 44px;
              padding: 10px 15px;

              font-size: 13px;
            }
          }

          @media print {
            .global-home-button {
              display: none;
            }
          }
        `}</style>
      </body>
    </html>
  )
}