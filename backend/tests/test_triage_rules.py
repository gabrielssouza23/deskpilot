from app.services.triage import TriageInput
from app.services.triage.rules import RuleBasedTriageProvider

provider = RuleBasedTriageProvider()


def triage(subject: str, message: str, name: str = "Jane Doe"):
    return provider.triage(TriageInput(name, subject, message))


def test_double_charge_is_high_priority_billing():
    result = triage("Charged twice", "I was charged twice for my subscription this month.")
    assert result.category == "billing"
    assert result.priority == "high"


def test_outage_is_urgent():
    result = triage("Everything is down", "Our production app is down, please help ASAP.")
    assert result.priority == "urgent"


def test_keywords_match_whole_words_only():
    # "download" contains "down", which must not be treated as an outage.
    result = triage("Download question", "Where can I download last month's report?")
    assert result.priority != "urgent"


def test_feature_request_is_low_priority_and_positive():
    result = triage("Idea", "It would be great to have dark mode. Thanks, I love the app!")
    assert result.category == "feature_request"
    assert result.priority == "low"
    assert result.sentiment == "positive"


def test_angry_customer_is_negative():
    result = triage("Broken again", "This is unacceptable, the export is broken again!!!")
    assert result.sentiment == "negative"


def test_detects_portuguese_and_spanish():
    portuguese = triage("Ajuda", "Olá, não consigo acessar minha conta, você pode ajudar?")
    spanish = triage("Ayuda", "Hola, necesito ayuda con mi cuenta, por favor. Gracias")
    english = triage("Help", "Hello, I need help with my account please.")
    assert (portuguese.language, spanish.language, english.language) == ("pt", "es", "en")


def test_reply_greets_customer_by_first_name():
    result = triage("Login problem", "I forgot my password.", name="Lucas Oliveira")
    assert result.suggested_reply.startswith("Hi Lucas,")


def test_summary_skips_greetings():
    result = triage("Refund", "Hi! Hello team, I was charged twice this month. Please help.")
    assert result.summary == "I was charged twice this month."


def test_summary_keeps_sentences_that_start_with_hi():
    result = triage("Login", "Hi I cannot log in to my account since yesterday")
    assert result.summary == "Hi I cannot log in to my account since yesterday"


def test_summary_falls_back_to_subject_and_is_capped():
    assert triage("App crashes on start", "Hi! Help me!!").summary == "App crashes on start"
    assert len(triage("Long one", "word " * 200).summary) <= 180


def test_polite_thanks_is_not_positive():
    result = triage("Refund", "My card was charged twice, can you refund it? Thanks.")
    assert result.sentiment == "neutral"
