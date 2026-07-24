import Image from 'next/image'

export default function MarketingHero() {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '374px',
        overflow: 'hidden',
        borderBottom: '1px solid #e3e9ee',
        backgroundColor: '#eef4f7',
      }}
    >
      <Image
        src="/hero-golf.png"
        alt="Golfpassi Marketing Tracker"
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'cover',
          objectPosition: 'center center',
        }}
      />
    </section>
  )
}