import { safeJsonLd } from '@/lib/security';

interface CategorySeoSectionProps {
  categoryName: string;
  categorySlug?: string;
  storeName?: string;
  metaDescription?: string | null;
}

export default function CategorySeoSection({
  categoryName,
  categorySlug,
  storeName = 'Gaming BM',
  metaDescription
}: CategorySeoSectionProps) {
  const faqs = [
    {
      question: `Wie wird die Qualität und Originalität unserer Auswahl in ${categoryName} gewährleistet?`,
      answer: `Alle Produkte der Kategorie ${categoryName} bei ${storeName} stammen direkt von autorisierten Herstellern und führenden Marken der Gaming-Branche. Jedes Gerät wird vor dem Versand einer strengen Qualitätsprüfung unterzogen und mit voller Herstellergarantie von mindestens 2 Jahren geliefert.`
    },
    {
      question: `Wie schnell erfolgt der Versand und wie sicher ist die Lieferung von ${categoryName}?`,
      answer: `Bestellungen werden werktags innerhalb von 24 bis 48 Stunden sicher verpackt und mit zuverlässigen Versandpartnern (DHL / DPD) inklusive Sendungsverfolgung und Transportschutz versendet.`
    },
    {
      question: `Welche Zahlungsmethoden und Rückgaberechte stehen zur Verfügung?`,
      answer: `Wir unterstützen alle gängigen sicheren Zahlungsmethoden wie PayPal, Kreditkarte (Visa, Mastercard), Klarna und Sofortüberweisung. Zudem profitieren Sie von einem 14-tägigen gesetzlichen Widerrufsrecht mit unkomplizierter Rückabwicklung.`
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      }
    }))
  };

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      {/* Kaufberater & Garantien */}
      <div className="bg-gradient-to-br from-gray-50 to-orange-50/40 rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-sm mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Kaufberatung &amp; Expertise: {categoryName}
        </h2>
        <p className="text-gray-700 text-base leading-relaxed mb-8 max-w-4xl">
          {metaDescription ? metaDescription : `Entdecken Sie unsere erstklassige Auswahl an ${categoryName} bei ${storeName}. Ob Gelegenheitsspieler oder E-Sport-Enthusiast – wir bieten Ihnen modernste Gaming-Technologie, Top-Performance und erstklassigen Kundenservice.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-3">
              ✓
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">100% Originalware</h3>
            <p className="text-sm text-gray-600 leading-snug">
              Zertifizierte Neuware direkt vom Hersteller mit voller Garantie und lückenloser Qualitätssicherung.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-3">
              🔒
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Versicherter Blitzversand</h3>
            <p className="text-sm text-gray-600 leading-snug">
              Schnelle und sichere Lieferung mit lückenloser Sendungsverfolgung und vollem Transportschutz.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg mb-3">
              ⚡
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Gaming-Support</h3>
            <p className="text-sm text-gray-600 leading-snug">
              Unser spezialisiertes Technik-Team berät Sie gerne vor und nach Ihrem Einkauf bei allen Fragen.
            </p>
          </div>
        </div>
      </div>

      {/* Häufig gestellte Fragen (FAQ) */}
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>Häufig gestellte Fragen zu {categoryName}</span>
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white border border-gray-200 rounded-xl p-5 open:bg-gray-50/50 open:ring-1 open:ring-orange-500/20 transition-all duration-200"
            >
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4 text-base hover:text-orange-600">
                <span>{faq.question}</span>
                <span className="text-orange-500 group-open:rotate-180 transition-transform duration-200 text-xl font-bold">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed pt-2 border-t border-gray-100">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
