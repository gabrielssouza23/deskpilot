"""Demo data so a fresh install has something to look at.

Run manually with `python -m app.seed`, or set SEED_DEMO_DATA=true to seed on
startup. It only runs when the database has no users.
"""

import logging
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.database import Base, SessionLocal, engine
from app.enums import TicketStatus
from app.models import Reply, Ticket, User, utcnow
from app.security import hash_password
from app.services.triage.base import TriageInput
from app.services.triage.rules import RuleBasedTriageProvider
from app.services.triage.service import TriageOutcome, apply_triage

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@deskpilot.dev"
DEMO_PASSWORD = "demo1234"

AGENTS = [
    ("Demo Agent", DEMO_EMAIL),
    ("Alex Morgan", "alex@deskpilot.dev"),
]

# (hours ago, name, email, subject, message, status, assignee index or None, agent reply)
TICKETS = [
    (
        1,
        "Emma Schultz",
        "emma.schultz@lumen.de",
        "Dashboard is down for our whole team",
        "Since this morning nobody on our team can open the dashboard, we only get a 500 error. "
        "This is blocking our production work, please help ASAP!",
        TicketStatus.OPEN,
        None,
        None,
    ),
    (
        3,
        "Daniel Kim",
        "daniel@brightpath.io",
        "Charged twice for the March invoice",
        "Hi, I was charged twice for the March invoice (both on the same card). Can you refund the "
        "duplicate payment?",
        TicketStatus.OPEN,
        1,
        None,
    ),
    (
        5,
        "Sofia Rossi",
        "sofia.rossi@verdi.it",
        "Dark mode please",
        "I love the product! It would be great if you could add a dark mode, I work late and the "
        "white screen is a lot. Thanks!",
        TicketStatus.OPEN,
        None,
        None,
    ),
    (
        8,
        "Lucas Oliveira",
        "lucas@oliveira.com.br",
        "Não consigo acessar minha conta",
        "Olá, não consigo acessar minha conta desde ontem. A senha não funciona e o e-mail de "
        "recuperação não chega. Estou bloqueado para trabalhar.",
        TicketStatus.OPEN,
        0,
        None,
    ),
    (
        12,
        "Priya Nair",
        "priya@nairconsulting.in",
        "Webhook integration failing",
        "Our webhook integration started failing yesterday. Every call returns a timeout after 30 "
        "seconds. Nothing changed on our side.",
        TicketStatus.PENDING,
        0,
        "Hi Priya, thanks for the details. Could you send us one of the webhook IDs that failed? "
        "We're checking the logs on our side.",
    ),
    (
        20,
        "Mark Thompson",
        "mark.t@northwind.com",
        "How do I add a new user?",
        "Quick question: how do I add a new user to our workspace? I can't find the option in the "
        "settings page.",
        TicketStatus.RESOLVED,
        1,
        "Hi Mark! Go to Settings > Team > Invite member. Let me know if you need anything else.",
    ),
    (
        26,
        "Ana García",
        "ana.garcia@sol.es",
        "Necesito cambiar el plan",
        "Hola, necesito cambiar el plan de mi cuenta a anual. ¿Cómo puedo hacerlo? Gracias por la "
        "ayuda.",
        TicketStatus.OPEN,
        None,
        None,
    ),
    (
        30,
        "Tom Becker",
        "tom@beckerlabs.com",
        "Export to CSV is broken again",
        "The CSV export is broken AGAIN. This is the third time this month. Really frustrating, we "
        "depend on it for our weekly reports!!!",
        TicketStatus.OPEN,
        0,
        None,
    ),
    (
        40,
        "Grace Lee",
        "grace.lee@meadow.co",
        "Two-factor codes not arriving",
        "I enabled two-factor authentication but the SMS codes never arrive, so I'm locked out of "
        "my account.",
        TicketStatus.PENDING,
        1,
        "Hi Grace, I've temporarily reset your 2FA. Can you try logging in again and confirm?",
    ),
    (
        52,
        "Oliver Smith",
        "oliver@smithandco.uk",
        "Thanks for the quick fix",
        "Just wanted to say thank you to the team for the quick fix on the reports page. Great "
        "support as always!",
        TicketStatus.CLOSED,
        0,
        None,
    ),
    (
        70,
        "Chen Wei",
        "chen.wei@harbor.sg",
        "API rate limit question",
        "What is the rate limit for the public API? We're planning an integration and want to "
        "avoid errors.",
        TicketStatus.RESOLVED,
        0,
        "Hi Chen, the limit is 100 requests per minute per API key. Docs: /docs/rate-limits.",
    ),
    (
        96,
        "Laura Martin",
        "laura@martinstudio.fr",
        "Cancel my subscription",
        "This is unacceptable, the app has been slow for a week and nobody answered my last email. "
        "I want to cancel my subscription and get a refund.",
        TicketStatus.OPEN,
        None,
        None,
    ),
]


def seed_demo_data() -> bool:
    """Seed the database if it's empty. Returns True when data was created."""
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(User)):
            return False

        agents = [
            User(full_name=name, email=email, hashed_password=hash_password(DEMO_PASSWORD))
            for name, email in AGENTS
        ]
        db.add_all(agents)
        db.flush()

        provider = RuleBasedTriageProvider()
        now = utcnow()
        for hours_ago, name, email, subject, message, status, assignee, reply in TICKETS:
            created_at = now - timedelta(hours=hours_ago)
            ticket = Ticket(
                customer_name=name,
                customer_email=email,
                subject=subject,
                message=message,
                status=status,
                assignee_id=agents[assignee].id if assignee is not None else None,
                created_at=created_at,
                updated_at=created_at,
            )
            outcome = provider.triage(TriageInput(name, subject, message))
            apply_triage(ticket, TriageOutcome(outcome, provider.name))
            if reply:
                ticket.replies.append(
                    Reply(
                        body=reply,
                        author_id=ticket.assignee_id,
                        created_at=created_at + timedelta(minutes=45),
                    )
                )
            db.add(ticket)

        try:
            db.commit()
        except IntegrityError:
            # On serverless hosts two cold starts can race to seed the same
            # database; the loser hits the unique email constraint. That's fine.
            db.rollback()
            return False
    logger.info("Seeded demo data. Log in with %s / %s", DEMO_EMAIL, DEMO_PASSWORD)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if not seed_demo_data():
        print("Database already has users; nothing to seed.")
