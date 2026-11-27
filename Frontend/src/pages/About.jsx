import { useDonate } from '../hooks/useDonate.js';

const FAQ = [
  ['Who can post food?', 'Anyone with an account. There is just one kind of account: the same one can post food when you have extra and claim food when you need it.'],
  ['What happens when I claim food?', 'The post is reserved for you so nobody else can claim it. You immediately see the pickup address and the donor\'s contact details, and you need to collect it before the timer runs out.'],
  ['What if food isn\'t collected in time?', 'Once a post passes its best-before time, it disappears from the browse page, so nobody travels for food that has expired.'],
  ['How do I report a problem with a post?', 'Use the Contact us page and describe what is wrong. Admins can remove posts that are fake or inappropriate.'],
];

export default function About() {
  const donate = useDonate();

  return (
    <>
      <header className="page-head">
        <div className="container">
          <h1>Food is shared faster than it spoils.</h1>
          <p>Rizq Share connects people with surplus food to people who can use it, while it is still good to eat.</p>
        </div>
      </header>

      <section className="section container">
        <div className="two-col">
          <div className="prose">
            <h2>Why we built this</h2>
            <p>After a wedding, a busy lunch or a family gathering, trays of good food are often left over. At the same time, people nearby could really use a meal.</p>
            <p>Today, that connection mostly happens through forwarded WhatsApp messages and social media posts. They are easy to miss, hard to verify, and by the time someone sees them, the food may have gone bad.</p>
            <p>Rizq Share puts surplus food in one place, organised by city and area, with a countdown showing how long it stays good to collect.</p>
          </div>
          <div className="side-stack">
            <div className="note">
              <strong>A note on food safety</strong>
              <p>Donors should only post food that is fresh and was stored properly. Receivers should check the food before eating it. Rizq Share connects people but cannot inspect food itself.</p>
            </div>
            <div className="side-card dark">
              <h3>How it works in short</h3>
              <ol>
                <li>A donor posts food with a best-before time.</li>
                <li>Someone nearby claims it and sees the pickup details.</li>
                <li>The donor confirms it was collected.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2>Who it's for</h2></div>
        <div className="cards-3">
          <div className="info-card">
            <h3>Donors</h3>
            <p>Restaurants, wedding halls, caterers and households with extra food. Post it in under a minute and confirm when it has been collected.</p>
          </div>
          <div className="info-card">
            <h3>Receivers</h3>
            <p>Volunteers, NGOs and individuals. Browse food in your area, claim it, and get the pickup address and the donor's contact straight away.</p>
          </div>
          <div className="info-card">
            <h3>Communities</h3>
            <p>Neighbourhoods that want less food in the bin and more meals on the table, with a clear record of what was shared.</p>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2>Questions people ask</h2></div>
        {FAQ.map(([q, a]) => (
          <details className="faq" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'var(--mint)', borderColor: 'transparent' }}>
          <div>
            <strong style={{ fontSize: '1.2rem' }}>Got food to share today?</strong>
            <p style={{ color: 'var(--ink)' }}>It takes less than a minute to post.</p>
          </div>
          <button className="btn btn-primary" onClick={donate}>Donate now</button>
        </div>
      </section>

    </>
  );
}
