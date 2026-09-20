import heroPress from "@/assets/hero-press.jpg";
import methodScreen from "@/assets/method-screen-printing.asset.json";
import methodDtf from "@/assets/method-dtf.asset.json";
import methodEmbroidery from "@/assets/method-embroidery.asset.json";

import type { SectionContent, SectionType } from "./site-content";

export type DefaultSection = {
  type: SectionType;
  content: SectionContent;
};

const serviceSection = (
  eyebrow: string,
  title: string,
  description: string,
  highlights: string[],
  steps: { title: string; body: string }[],
  specs: { label: string; value: string }[],
): DefaultSection[] => [
  {
    type: "hero",
    content: {
      eyebrow,
      title,
      description,
      dark: true,
      image: { url: "", alt: "" },
      buttons: [
        { label: "Request a Quote", to: "/quote-request" },
        { label: "Open Design Studio", to: "/design-studio" },
      ],
    },
  },
  { type: "checklist", content: { title: "What you get", items: highlights } },
  { type: "steps", content: { title: "How this job runs", items: steps, tone: "soft" } },
  { type: "spec_list", content: { title: "Specs & options", items: specs } },
];

export const DEFAULT_SECTIONS: Record<string, DefaultSection[]> = {
  "/": [
    {
      type: "hero",
      content: {
        eyebrow: "In-house decoration",
        title: "Custom apparel, printed straight the first time.",
        description:
          "Pick your garment, drop in your artwork, see it on the shirt, and order one piece or a full team run. Screen printing, DTF, transfers and embroidery under one roof.",
        dark: true,
        size: "large",
        image: { url: heroPress, alt: "Screen printing press pulling red ink onto a black t-shirt" },
        buttons: [
          { label: "Start designing", to: "/design-studio" },
          { label: "Get a bulk quote", to: "/quote-request" },
        ],
      },
    },
    {
      type: "feature_grid",
      content: {
        title: "Our decoration methods",
        description: "",
        showImages: true,
        align: "center",
        dark: false,
        items: [
          {
            title: "SÉRIGRAPHIE",
            body: "Screen printing is ideal for simple or solid-colour logos. Very durable and perfect for large runs.",
            to: "/screen-printing",
            image: { url: methodScreen.url, alt: "Screen printing press with black t-shirts on the platens" },
          },
          {
            title: "DIRECT TO FILM",
            body: "DTF prints highly detailed visuals, including gradients and multi-colour artwork. Very flexible, it works on almost every textile.",
            to: "/dtf-printing",
            image: { url: methodDtf.url, alt: "DTF transfer being pressed onto a white t-shirt" },
          },
          {
            title: "BRODERIE",
            body: "Embroidery gives a premium finish with maximum durability. The ideal decoration for caps, polos and jackets.",
            to: "/embroidery",
            image: { url: methodEmbroidery.url, alt: "Embroidery machine stitching a logo onto a red cap" },
          },
        ],
      },
    },
    {
      type: "feature_grid",
      content: {
        title: "Bring your designs to life.",
        description: "",
        showImages: false,
        align: "center",
        dark: true,
        items: [
          {
            title: "PRINT ON DEMAND",
            body: "Explore our curated selection of quality blank garments, ready to be customized with your designs.",
            to: "/shop",
            buttonLabel: "Browse",
          },
          {
            title: "DTF SHEETS",
            body: "Supply your own designs and order ready-to-press DTF transfers for your production needs.",
            to: "/dtf-transfers",
            buttonLabel: "Order",
          },
        ],
      },
    },
    {

      type: "feature_grid",
      content: {
        title: "What we decorate",
        description: "",
        items: [
          {
            title: "Screen Printing",
            body: "Bold, durable ink for team runs, merch drops and workwear.",
            to: "/screen-printing",
          },
          {
            title: "DTF Printing",
            body: "Full-colour detail with no minimums, straight onto the garment.",
            to: "/dtf-printing",
          },
          {
            title: "DTF Transfers & Sheets",
            body: "Ready-to-press transfers and gang sheets shipped to your shop.",
            to: "/dtf-transfers",
          },
          {
            title: "Embroidery",
            body: "Stitched logos for hats, polos and outerwear that last.",
            to: "/embroidery",
          },
        ],
      },
    },
    {
      type: "image_text",
      content: {
        title: "One piece or one thousand",
        body: "Print-on-demand orders check out online in minutes. Bulk projects go through a proper quote: size and colour matrices, artwork review, a proof you approve, then production.",
        dark: true,
        image: { url: "", alt: "" },
        imageSide: "right",
        buttons: [
          { label: "Print-on-demand", to: "/print-on-demand" },
          { label: "Bulk orders", to: "/bulk-orders" },
        ],
        bullets: [
          { title: "Real garment previews", body: "Every colour has its own front, back and sleeve photos." },
          { title: "Accurate placement", body: "Designs are measured in real inches, not guesses." },
          { title: "Proof before production", body: "Nothing gets printed until you approve it." },
          { title: "Made in-house", body: "Printing, transfers and embroidery on our own floor." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        title: "Ready to see it on the shirt?",
        body: "Browse the catalogue or jump straight into the Design Studio.",
        dark: false,
        buttons: [
          { label: "Browse the shop", to: "/shop" },
          { label: "How it works", to: "/how-it-works" },
        ],
      },
    },
  ],

  "/about": [
    {
      type: "hero",
      content: {
        eyebrow: "Who we are",
        title: "About Us",
        description:
          "A decoration shop built around getting the details right: the colour, the placement, the count, the deadline.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [],
      },
    },
    {
      type: "rich_text",
      content: {
        title: "",
        body: "Straight Line Printing decorates apparel for teams, businesses, events and brands. We run screen printing, DTF printing, transfer production and embroidery on our own floor, which means we control the schedule and the quality instead of passing your job down a chain of suppliers.\n\nWe built this platform because most custom apparel ordering hides the important details. Here you see the real garment colour, the real print area and the real placement measurements before anything is produced, and nothing goes to press without your approved proof.\n\nWhether it is one shirt or a thousand, the same catalogue, the same artwork handling and the same production checks apply.",
      },
    },
    {
      type: "feature_grid",
      content: {
        title: "",
        description: "",
        items: [
          { title: "In-house", body: "Print, transfers and embroidery under one roof." },
          { title: "Measured", body: "Placement recorded in real inches, not eyeballed." },
          { title: "Approved", body: "Proof approval is required before production." },
          { title: "Checked", body: "Quality control on every job before it ships." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        title: "Talk to us",
        body: "Tell us about your project and we'll come back with real numbers.",
        dark: false,
        buttons: [{ label: "Contact us", to: "/contact" }],
      },
    },
  ],

  "/how-it-works": [
    {
      type: "hero",
      content: {
        eyebrow: "The process",
        title: "How It Works",
        description:
          "No guessing, no surprise reprints. Here is exactly what happens between your idea and the finished box.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [],
      },
    },
    {
      type: "steps",
      content: {
        title: "",
        items: [
          { title: "Pick your garment", body: "Browse the catalogue or tell us the style you want. Every colour has real photos." },
          { title: "Add your artwork", body: "Upload PNG, JPG, SVG or PDF. We flag low resolution before it becomes a problem." },
          { title: "Place it properly", body: "Artwork sits inside a measured print area, so placement is in real inches." },
          { title: "Get your price", body: "Single pieces price instantly. Bulk projects come back as a full quote." },
          { title: "Approve the proof", body: "You see garment, colour, placement and size before anything is produced." },
          { title: "Into production", body: "Approved proofs become production jobs with exact measurements." },
          { title: "Quality control", body: "Every job is checked for print quality, placement and counts." },
          { title: "Ship or pick up", body: "Local pickup and delivery, plus shipping across Canada and the US." },
        ],
      },
    },
    {
      type: "link_row",
      content: {
        title: "",
        items: [
          { label: "Start a design", to: "/design-studio" },
          { label: "Request a quote", to: "/quote-request" },
        ],
      },
    },
  ],

  "/faq": [
    {
      type: "hero",
      content: {
        eyebrow: "Answers",
        title: "FAQ",
        description: "The questions we get asked most, before the quote goes out.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [],
      },
    },
    {
      type: "faq",
      content: {
        title: "",
        items: [
          { q: "Is there a minimum order?", a: "No. DTF printing and embroidery can be done on a single piece. Screen printing is most cost-effective from about 24 pieces up because of screen setup." },
          { q: "What artwork files do you accept?", a: "PNG, JPG, SVG and PDF are all accepted, and we can work with AI or EPS files too. Vector art or a high-resolution transparent PNG gives the best result." },
          { q: "My artwork is low resolution. What happens?", a: "We flag it rather than silently printing it. Our artwork services can clean up, redraw or vectorise the file before production." },
          { q: "Which decoration method should I choose?", a: "Screen printing for larger runs with a few solid colours, DTF for full-colour art and small quantities, transfers if you want to press them yourself, and embroidery for hats, polos and outerwear." },
          { q: "Do I get to see it before it is printed?", a: "Yes. Every job gets a proof showing garment, colour, placement, size and quantity. Nothing is produced until you approve it." },
          { q: "How long does production take?", a: "Standard turnaround starts once your proof is approved. Rush production is available on most jobs — tell us your in-hands date when you request a quote." },
          { q: "Can I supply my own garments?", a: "In many cases yes. Send us the details in a quote request so we can confirm the garments will run properly on our equipment." },
          { q: "Do you ship outside Canada?", a: "We ship across Canada and to the US, and we offer local pickup and delivery. Shipping is calculated at checkout or included in your quote." },
        ],
      },
    },
  ],

  "/contact": [
    {
      type: "hero",
      content: {
        eyebrow: "Get in touch",
        title: "Contact",
        description:
          "Questions about a project, an existing order, or artwork? Reach out and a real person answers.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [],
      },
    },
    {
      type: "contact_info",
      content: {
        title: "",
        items: [
          { icon: "mail", label: "Email", value: "hello@straightlineprinting.ca" },
          { icon: "phone", label: "Phone", value: "Add your shop phone number" },
          { icon: "map", label: "Shop", value: "Add your shop address" },
          { icon: "clock", label: "Hours", value: "Add your opening hours" },
        ],
      },
    },
    {
      type: "contact_form",
      content: {
        title: "Send us a message",
        body: "Tell us what you need decorated, how many, and when you need it.",
      },
    },
    {
      type: "cta",
      content: {
        title: "Need a price?",
        body: "The fastest way to get a number is a quote request. Send garments, quantities, decoration method and your deadline and we will come back with full pricing.",
        dark: false,
        buttons: [{ label: "Request a quote", to: "/quote-request" }],
      },
    },
  ],

  "/custom-apparel": [
    {
      type: "hero",
      content: {
        eyebrow: "What we make",
        title: "Custom Apparel",
        description:
          "Tell us the garment and the look. We handle the artwork, the placement, the proof and the production.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [{ label: "Design yours", to: "/design-studio" }],
      },
    },
    {
      type: "feature_grid",
      content: {
        title: "Garment types",
        description: "Every garment is set up with real colour photography and measured print areas.",
        items: [
          { title: "T-shirts", body: "Cotton, blends and performance tees in a full colour range." },
          { title: "Hoodies & crewnecks", body: "Midweight to heavyweight fleece for teams and merch." },
          { title: "Polos & workwear", body: "Embroidered staff uniforms that hold their shape." },
          { title: "Hats & headwear", body: "Structured, unstructured, trucker and beanies." },
          { title: "Bags & accessories", body: "Totes, duffels and everyday carry." },
          { title: "Youth & ladies fits", body: "Matching styles across the whole roster." },
        ],
      },
    },
    {
      type: "link_row",
      content: {
        title: "Pick a decoration method",
        items: [
          { label: "Screen Printing", to: "/screen-printing" },
          { label: "DTF Printing", to: "/dtf-printing" },
          { label: "DTF Transfers", to: "/dtf-transfers" },
          { label: "Embroidery", to: "/embroidery" },
        ],
      },
    },
  ],

  "/print-on-demand": [
    {
      type: "hero",
      content: {
        eyebrow: "No minimums",
        title: "Print-on-Demand",
        description:
          "One shirt is a real order. Design it, pay online, and it goes into the same production workflow as our biggest runs.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [{ label: "Design a single piece", to: "/design-studio" }],
      },
    },
    {
      type: "steps",
      content: {
        title: "How single orders work",
        items: [
          { title: "Choose", body: "Garment, colour, size and decoration method." },
          { title: "Design", body: "Upload artwork and place it inside the print area." },
          { title: "Checkout", body: "Pay online with taxes and shipping calculated." },
          { title: "Produced", body: "We print or stitch it and ship it to you." },
        ],
      },
    },
  ],

  "/bulk-orders": [
    {
      type: "hero",
      content: {
        eyebrow: "Volume pricing",
        title: "Bulk Orders",
        description:
          "Teams, staff uniforms, events and merch drops. Build your size and colour breakdown, and the price per piece drops as the run grows.",
        dark: true,
        image: { url: "", alt: "" },
        buttons: [{ label: "Start a bulk quote", to: "/quote-request" }],
      },
    },
    {
      type: "table",
      content: {
        title: "Size and colour matrix",
        description: "Break your order down exactly how it will be handed out.",
        columns: ["Colour", "S", "M", "L", "XL", "2XL", "Total"],
        rows: [
          ["Black", "10", "25", "40", "20", "5", "100"],
          ["White", "5", "15", "20", "10", "0", "50"],
        ],
        note: "Example breakdown. Your quote uses your own garments, colours and sizes.",
      },
    },
    {
      type: "checklist",
      content: {
        title: "What to send us",
        items: [
          "Garment style and brand preference",
          "Colours, sizes and quantities",
          "Decoration method and print locations",
          "Artwork files, or ask us to build the art",
          "In-hands deadline",
          "Shipping destination or pickup",
        ],
      },
    },
  ],

  "/screen-printing": serviceSection(
    "Decoration method",
    "Screen Printing",
    "The workhorse of custom apparel. Thick, opaque ink that survives wash after wash, priced better the more you print.",
    [
      "Quantity pricing that drops as your run grows",
      "Multiple print locations on one garment",
      "Spot colour matching and specialty inks",
      "Screen and setup fees shown up front",
      "Folding and bagging available",
      "Rush production on approved artwork",
    ],
    [
      { title: "Quote", body: "Send garment, sizes, quantities, locations and ink colours." },
      { title: "Artwork", body: "We review your files and prep separations, or build art for you." },
      { title: "Proof", body: "You approve placement, size and colours before we burn screens." },
      { title: "Print", body: "Screens burned, press set, run printed, checked and packed." },
    ],
    [
      { label: "Best for", value: "24 pieces and up" },
      { label: "Print locations", value: "Front, back, left sleeve, right sleeve" },
      { label: "Ink colours", value: "1 to 6 spot colours per location" },
      { label: "Setup", value: "Per-screen setup fee, configurable per job" },
      { label: "Specialty", value: "Puff, metallic, water-based, discharge on request" },
      { label: "Turnaround", value: "Standard or rush after proof approval" },
    ],
  ),

  "/dtf-printing": serviceSection(
    "Decoration method",
    "DTF Printing",
    "Full-colour, photo-detailed prints applied directly to your garment. No screens, no minimums, unlimited colours.",
    [
      "No minimum quantity — order a single piece",
      "Unlimited colours and gradients at one price",
      "Works on cotton, blends and polyester",
      "Exact print dimensions in inches",
      "Optional background removal and cleanup",
      "Standard or rush production",
    ],
    [
      { title: "Configure", body: "Pick garment, colour, sizes, locations and print size." },
      { title: "Upload", body: "Send PNG, SVG or PDF artwork; we flag resolution issues." },
      { title: "Proof", body: "Review the on-garment proof and approve it." },
      { title: "Press", body: "Film printed, powdered, cured and heat pressed in-house." },
    ],
    [
      { label: "Best for", value: "1 to 100 pieces, full-colour art" },
      { label: "Max print size", value: "Set per garment by its print area" },
      { label: "Colours", value: "Unlimited, including gradients and photos" },
      { label: "Artwork", value: "PNG, JPG, SVG, PDF; transparency preferred" },
      { label: "Setup", value: "No screen or setup fees" },
      { label: "Turnaround", value: "Standard or rush after proof approval" },
    ],
  ),

  "/dtf-transfers": serviceSection(
    "Order transfers",
    "DTF Transfers & Sheets",
    "Buy the print, press it yourself. Single transfers, multiples, or gang sheets packed with your designs.",
    [
      "Single transfers or high-volume packs",
      "Gang sheets in standard and custom sizes",
      "Automatic or manual arrangement of designs",
      "Live sheet utilisation and unused space",
      "Background removal and transparency cleanup",
      "Rush production available",
    ],
    [
      { title: "Choose sheet", body: "Pick a standard sheet size or a custom width and height." },
      { title: "Upload", body: "Add your designs and set the quantity of each." },
      { title: "Arrange", body: "Auto-nest the sheet, then nudge anything by hand." },
      { title: "Ship", body: "We print, cut and ship your transfers ready to press." },
    ],
    [
      { label: "Standard sheets", value: '22" x 24", 22" x 36", 22" x 60", 22" x 120"' },
      { label: "Custom sizes", value: "Available up to the maximum printable width" },
      { label: "Margins & spacing", value: "Configured by our shop for reliable cutting" },
      { label: "Artwork", value: "Transparent PNG, SVG or PDF preferred" },
      { label: "Pressing", value: "Instructions included with every order" },
      { label: "Turnaround", value: "Standard or rush" },
    ],
  ),

  "/embroidery": serviceSection(
    "Decoration method",
    "Embroidery",
    "Stitched logos with real presence. Ideal for hats, polos, jackets and anything that needs to look permanent.",
    [
      "Left chest, sleeve, back, hat front and hat side",
      "One-time digitizing with the file kept on record",
      "Thread colour matching to your brand",
      "Pricing by stitch count, locations and quantity",
      "Finished size confirmed before stitching",
      "Rush production available",
    ],
    [
      { title: "Quote", body: "Garment, placement, finished size, quantity and thread colours." },
      { title: "Digitize", body: "Your artwork is converted to a stitch file and sew-out tested." },
      { title: "Approve", body: "You approve the proof, size and thread colours." },
      { title: "Stitch", body: "Machines loaded, run, trimmed and inspected." },
    ],
    [
      { label: "Best for", value: "Hats, polos, jackets, bags, workwear" },
      { label: "Placements", value: "Left/right/centre chest, sleeve, back, hat front and side" },
      { label: "Typical size", value: '2" to 5" wide for chest logos' },
      { label: "Digitizing", value: "One-time fee, file reused on reorders" },
      { label: "Stitch count", value: "Drives per-piece pricing" },
      { label: "Turnaround", value: "Standard or rush after digitizing approval" },
    ],
  ),
};
