"""
Seed management command — loads 4 categories and 20 realistic products
with generated placeholder images.

Usage:
    python manage.py seed
"""

import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from PIL import Image, ImageDraw, ImageFont

from store.models import Category, Product

CATEGORIES = [
    "Electronics",
    "Home & Kitchen",
    "Apparel",
    "Books",
]

PRODUCTS = [
    # Electronics
    ("Wireless Bluetooth Headphones", "Electronics", "49.99", 35,
     "Over-ear wireless headphones with active noise cancellation, 30-hour battery life, and plush memory-foam earcups for all-day comfort."),
    ("Smart Watch Series 6", "Electronics", "199.00", 18,
     "Fitness tracking, heart-rate monitor, GPS, sleep analysis, and a bright always-on AMOLED display. Water resistant to 50 meters."),
    ("USB-C Fast Charger 65W", "Electronics", "29.99", 80,
     "GaN-powered charger that delivers 65W to laptops, phones, and tablets. Compact foldable design with dual USB-C ports."),
    ("Portable Bluetooth Speaker", "Electronics", "39.99", 50,
     "IPX7 waterproof speaker with 360-degree sound, 12-hour playtime, and deep bass. Perfect for the beach or the backyard."),
    ("Mechanical Keyboard RGB", "Electronics", "89.99", 22,
     "Hot-swappable mechanical keyboard with Cherry MX Brown switches, per-key RGB backlighting, and an aluminium frame."),
    # Home & Kitchen
    ("Stainless Steel Cookware Set", "Home & Kitchen", "149.99", 15,
     "10-piece tri-ply stainless steel cookware set with tempered glass lids. Oven-safe to 500F and induction-compatible."),
    ("Ceramic Coffee Mug Set of 4", "Home & Kitchen", "24.99", 120,
     "Handcrafted 12oz ceramic mugs in four earthy colours. Microwave and dishwasher safe with a comfortable wide handle."),
    ("Bamboo Cutting Board", "Home & Kitchen", "19.99", 90,
     "Large organic bamboo cutting board with juice groove and side handles. Naturally antimicrobial and gentle on knives."),
    ("LED Desk Lamp Dimmable", "Home & Kitchen", "34.99", 45,
     "Adjustable LED desk lamp with five colour temperatures and ten brightness levels. USB charging port built into the base."),
    ("Egyptian Cotton Bath Towels", "Home & Kitchen", "44.99", 60,
     "Set of two 700-GSM Egyptian cotton bath towels. Ultra-soft, highly absorbent, and available in six muted tones."),
    # Apparel
    ("Organic Cotton T-Shirt", "Apparel", "22.00", 200,
     "GOTS-certified organic cotton tee with a relaxed fit. Pre-shrunk and garment-dyed for a soft, lived-in feel from day one."),
    ("Wool Blend Overcoat", "Apparel", "189.00", 10,
     "Tailored single-breasted overcoat in a 70-30 wool-cashmere blend. Notch lapel, fully lined, with interior pockets."),
    ("Leather Crossbody Bag", "Apparel", "79.99", 30,
     "Full-grain leather crossbody bag with an adjustable strap and three interior compartments. Ages beautifully with use."),
    ("Running Shoes Lightweight", "Apparel", "65.00", 75,
     "Breathable mesh running shoes with a responsive foam midsole and a durable rubber outsole. Only 7.2 ounces per shoe."),
    ("Cashmere Beanie", "Apparel", "35.00", 110,
     "100% Mongolian cashmere beanie that is soft, warm, and lightweight. Ribbed knit with a snug, comfortable fit."),
    # Books
    ("The Art of Clean Code", "Books", "32.00", 85,
     "A practical guide to writing maintainable software. Covers naming, functions, testing, and refactoring with real-world examples."),
    ("Mediterranean Cooking Made Easy", "Books", "28.50", 95,
     "120 recipes for weeknight Mediterranean meals. Full-colour photography, meal-prep tips, and pantry-stocking guides throughout."),
    ("Mindful Morning Routines", "Books", "18.00", 140,
     "A 30-day plan for building a morning routine that sticks. Includes journaling prompts, habit trackers, and meditation scripts."),
    ("Photography Field Guide", "Books", "42.00", 25,
     "A pocket-sized field guide to exposure, composition, and natural light. Waterproof cover and quick-reference fold-out flaps."),
    ("Build Your Own Furniture", "Books", "39.99", 40,
     "Step-by-step plans for 20 pieces of hand-built furniture using basic tools. Material lists, cut diagrams, and finishing tips."),
]


class Command(BaseCommand):
    help = "Loads 4 categories and 20 realistic products with generated placeholder images."

    def handle(self, *args, **options):
        # Clear existing data so the command is idempotent
        Product.objects.all().delete()
        Category.objects.all().delete()

        categories = {}
        for cat_name in CATEGORIES:
            cat, _ = Category.objects.get_or_create(
                name=cat_name,
                defaults={"slug": slugify(cat_name)},
            )
            categories[cat_name] = cat

        self.stdout.write(self.style.SUCCESS(f"Created {len(categories)} categories."))

        count = 0
        for name, cat_name, price, stock, description in PRODUCTS:
            product = Product(
                name=name,
                slug=slugify(name),
                description=description,
                price=price,
                stock=stock,
                category=categories[cat_name],
                is_active=True,
            )
            product.image.save(
                f"{slugify(name)}.png",
                ContentFile(self._generate_image(name, categories[cat_name])),
                save=False,
            )
            product.save()
            count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Created {count} products with placeholder images.")
        )

    def _generate_image(self, name, category):
        """Generate a simple product placeholder image as PNG bytes."""
        width, height = 600, 600
        # Background colour per category for visual distinction
        palette = {
            "Electronics": (91, 123, 160),
            "Home & Kitchen": (168, 138, 100),
            "Apparel": (130, 156, 130),
            "Books": (160, 100, 100),
        }
        bg = palette.get(category.name, (120, 120, 120))

        img = Image.new("RGB", (width, height), color=bg)
        draw = ImageDraw.Draw(img)

        # Draw a lighter rectangle in the centre as a "card"
        margin = 60
        draw.rectangle(
            [margin, margin, width - margin, height - margin],
            fill=(255, 255, 255, 200),
            outline=(255, 255, 255),
            width=2,
        )

        # Try to load a font; fall back to default
        try:
            font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except (OSError, IOError):
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()

        # Wrap the product name
        words = name.split()
        lines = []
        current = ""
        for word in words:
            test = f"{current} {word}".strip()
            if len(test) <= 26:
                current = test
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)

        y = 230
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font_title)
            tw = bbox[2] - bbox[0]
            draw.text(((width - tw) / 2, y), line, fill=(50, 50, 50), font=font_title)
            y += 30

        cat_text = category.name
        bbox = draw.textbbox((0, 0), cat_text, font=font_sub)
        tw = bbox[2] - bbox[0]
        draw.text(((width - tw) / 2, y + 20), cat_text, fill=(120, 120, 120), font=font_sub)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.getvalue()
