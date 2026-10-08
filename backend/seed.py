import json
import os
import sys
import sqlalchemy as sa
from backend.database import SessionLocal, engine, Base
from backend.models import Language, Course, Unit, Lesson, Challenge, ChallengeOption, ChallengeType, UserProgress

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def mc(lesson_id, question, correct_opt, wrong_opts, answer=None, hints=None):
    ch = Challenge(
        lesson_id=lesson_id,
        type=ChallengeType.multiple_choice,
        question=question,
        answer=answer or correct_opt,
        hints=json.dumps(hints) if hints else None
    )
    db = SessionLocal()
    db.add(ch)
    db.commit()
    db.refresh(ch)
    
    opts = [ChallengeOption(challenge_id=ch.id, text=correct_opt, is_correct=True)]
    for w in wrong_opts:
        opts.append(ChallengeOption(challenge_id=ch.id, text=w, is_correct=False))
    
    import random
    random.shuffle(opts)
    db.add_all(opts)
    db.commit()
    db.close()
    return ch

def translate_sentence(lesson_id, foreign_sentence, english_answer, hints=None, distractors=None):
    ch = Challenge(
        lesson_id=lesson_id,
        type=ChallengeType.translate,
        question=foreign_sentence,
        answer=english_answer,
        hints=json.dumps(hints) if hints else None
    )
    db = SessionLocal()
    db.add(ch)
    db.commit()
    db.refresh(ch)

    # Clean words to build word bank tokens
    import re
    words = [w for w in re.split(r'[\s,¡!¿?.]+', english_answer) if w]
    extra = distractors or ["water", "drinks", "girl", "is", "bread"]
    all_tokens = words + extra
    import random
    random.shuffle(all_tokens)

    opts = [ChallengeOption(challenge_id=ch.id, text=t, is_correct=False) for t in all_tokens]
    db.add_all(opts)
    db.commit()
    db.close()
    return ch

def matching(lesson_id, question, pairs, hints=None):
    ch = Challenge(
        lesson_id=lesson_id,
        type=ChallengeType.matching,
        question=question,
        hints=json.dumps(hints) if hints else None
    )
    db = SessionLocal()
    db.add(ch)
    db.commit()
    db.refresh(ch)
    
    opts = []
    for foreign_txt, eng_txt in pairs:
        opts.append(ChallengeOption(challenge_id=ch.id, text=foreign_txt, match_text=eng_txt))
    db.add_all(opts)
    db.commit()
    db.close()
    return ch

def typing(lesson_id, question, answer, hints=None):
    ch = Challenge(
        lesson_id=lesson_id,
        type=ChallengeType.typing,
        question=question,
        answer=answer,
        hints=json.dumps(hints) if hints else None
    )
    db = SessionLocal()
    db.add(ch)
    db.commit()
    db.close()
    return ch

def fill_in_blank(lesson_id, question, answer, options, hints=None):
    ch = Challenge(
        lesson_id=lesson_id,
        type=ChallengeType.fill_in_blank,
        question=question,
        answer=answer,
        hints=json.dumps(hints) if hints else None
    )
    db = SessionLocal()
    db.add(ch)
    db.commit()
    db.refresh(ch)
    for opt in options:
        db.add(ChallengeOption(
            challenge_id=ch.id,
            text=opt,
            is_correct=(opt.strip().lower() == answer.strip().lower())
        ))
    db.commit()
    db.close()
    return ch

def seed_data():
    saved_progress = []
    with engine.connect() as conn:
        try:
            res = conn.execute(sa.text("SELECT user_id, lesson_id, completed FROM user_progress;")).fetchall()
            saved_progress = [(r[0], r[1], bool(r[2])) for r in res]
        except Exception:
            pass

        for tbl in ["challenge_options", "challenges", "lessons", "units", "courses", "languages", "user_progress"]:
            conn.execute(sa.text(f"DROP TABLE IF EXISTS {tbl};"))
        conn.commit()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ========================================================
    # 1. SPANISH COURSE
    # ========================================================
    es = Language(name="Spanish", code="es", flag_emoji="🇪🇸")
    db.add(es)
    db.commit()
    c_es = Course(language_id=es.id, title="Spanish")
    db.add(c_es)
    db.commit()

    # Spanish Unit 1
    u_es_1 = Unit(
        course_id=c_es.id,
        title="Unit 1: Basics & Greetings",
        description="Learn basic greetings, articles, and common nouns.",
        order=1,
        guidebook="¡Hola! In Spanish, nouns have grammatical gender:\n• 'el' is masculine (el niño = the boy, el pan = the bread)\n• 'la' is feminine (la niña = the girl, la manzana = the apple)\n• 'Un' / 'Una' mean 'A' / 'An'.\nGreetings:\n• ¡Hola! = Hello\n• ¡Adiós! = Goodbye\n• Por favor = Please\n• Gracias = Thank you"
    )
    db.add(u_es_1)
    db.commit()

    # Spanish Lesson 1: Basics 1 (7 challenges)
    l_es_1 = Lesson(unit_id=u_es_1.id, title="Basics 1", order=1)
    db.add(l_es_1)
    db.commit()

    translate_sentence(l_es_1.id, "El niño", "The boy",
       hints={"El": "The (masculine)", "niño": "boy"}, distractors=["girl", "water", "apple"])
    translate_sentence(l_es_1.id, "La niña", "The girl",
       hints={"La": "The (feminine)", "niña": "girl"}, distractors=["boy", "bread", "milk"])
    mc(l_es_1.id, 'Which of these is "the apple"?', "la manzana", ["el niño", "el agua"], answer="la manzana")
    matching(l_es_1.id, "Tap the matching pairs", [
        ("el niño", "the boy"),
        ("la niña", "the girl"),
        ("la manzana", "the apple"),
        ("el agua", "the water")
    ])
    translate_sentence(l_es_1.id, "La manzana y el pan", "The apple and the bread",
       hints={"La": "The", "manzana": "apple", "y": "and", "el": "the", "pan": "bread"}, distractors=["water", "boy", "milk"])
    mc(l_es_1.id, 'Which of these is "the bread"?', "el pan", ["el agua", "la leche"], answer="el pan")
    typing(l_es_1.id, 'Translate: "The apple and the bread"', "la manzana y el pan",
       hints={"The": "La / El", "apple": "manzana", "and": "y", "bread": "pan"})

    # Spanish Lesson 2: Greetings & Manners (7 challenges)
    l_es_2 = Lesson(unit_id=u_es_1.id, title="Greetings", order=2)
    db.add(l_es_2)
    db.commit()

    translate_sentence(l_es_2.id, "¡Hola! Buenos días", "Hello! Good morning",
       hints={"Hola": "Hello", "Buenos": "Good", "días": "morning"}, distractors=["Goodbye", "night", "thanks"])
    translate_sentence(l_es_2.id, "Por favor y gracias", "Please and thank you",
       hints={"Por favor": "Please", "y": "and", "gracias": "thank you"}, distractors=["Hello", "Goodbye", "water"])
    mc(l_es_2.id, 'How do you say "Goodbye"?', "¡Adiós!", ["¡Hola!", "Por favor"], answer="¡Adiós!")
    matching(l_es_2.id, "Tap the matching pairs", [
        ("¡Hola!", "Hello"),
        ("¡Adiós!", "Goodbye"),
        ("Por favor", "Please"),
        ("Gracias", "Thank you")
    ])
    translate_sentence(l_es_2.id, "De nada, adiós", "You're welcome, goodbye",
       hints={"De nada": "You're welcome", "adiós": "goodbye"}, distractors=["Please", "Hello", "morning"])
    mc(l_es_2.id, 'How do you say "Good night"?', "Buenas noches", ["Buenos días", "Buenas tardes"], answer="Buenas noches")
    typing(l_es_2.id, 'Translate: "Good morning, goodbye"', "buenos días adiós",
       hints={"Good morning": "Buenos días", "goodbye": "adiós"})

    # Spanish Lesson 3: Basics Mastery (7 challenges)
    l_es_3 = Lesson(unit_id=u_es_1.id, title="Basics Review", order=3)
    db.add(l_es_3)
    db.commit()

    translate_sentence(l_es_3.id, "El niño come pan", "The boy eats bread",
       hints={"El": "The", "niño": "boy", "come": "eats", "pan": "bread"}, distractors=["girl", "drinks", "water", "apple"])
    translate_sentence(l_es_3.id, "La niña bebe agua", "The girl drinks water",
       hints={"La": "The", "niña": "girl", "bebe": "drinks", "agua": "water"}, distractors=["boy", "eats", "bread", "milk"])
    translate_sentence(l_es_3.id, "Yo soy un niño", "I am a boy",
       hints={"Yo": "I", "soy": "am", "un": "a", "niño": "boy"}, distractors=["He", "is", "girl", "drinks"])
    matching(l_es_3.id, "Tap the matching pairs", [
        ("come", "eats"),
        ("bebe", "drinks"),
        ("el pan", "the bread"),
        ("la leche", "the milk")
    ])
    fill_in_blank(l_es_3.id, "Ella ___ manzanas", "come", ["come", "bebe", "soy"],
       hints={"Ella": "She", "come": "eats", "manzanas": "apples"})
    mc(l_es_3.id, 'What does "Tú bebes leche" mean?', "You drink milk", ["I eat bread", "He drinks water"], answer="You drink milk",
       hints={"Tú": "You", "bebes": "drink", "leche": "milk"})
    typing(l_es_3.id, 'Translate: "I am a boy"', "yo soy un niño",
       hints={"I": "Yo", "am": "soy", "a": "un", "boy": "niño"})

    # Spanish Unit 2
    u_es_2 = Unit(
        course_id=c_es.id,
        title="Unit 2: Cafe & Phrases",
        description="Order coffee, ask for the bill, and converse in restaurants.",
        order=2,
        guidebook="Dining in Spanish:\n• 'Un café, por favor' = A coffee, please\n• 'La cuenta, por favor' = The bill, please\n• 'Una mesa para dos' = A table for two\n• 'Muchas gracias' = Thank you very much"
    )
    db.add(u_es_2)
    db.commit()

    # Spanish Lesson 4: At the Cafe (7 challenges)
    l_es_4 = Lesson(unit_id=u_es_2.id, title="At the Cafe", order=1)
    db.add(l_es_4)
    db.commit()

    translate_sentence(l_es_4.id, "Un café, por favor", "A coffee, please",
       hints={"Un": "A", "café": "coffee", "por favor": "please"}, distractors=["tea", "water", "two", "the"])
    translate_sentence(l_es_4.id, "El té con azúcar", "The tea with sugar",
       hints={"El": "The", "té": "tea", "con": "with", "azúcar": "sugar"}, distractors=["coffee", "milk", "without", "cup"])
    mc(l_es_4.id, 'How do you say "coffee"?', "el café", ["el té", "el jugo"], answer="el café")
    matching(l_es_4.id, "Tap the matching pairs", [
        ("el café", "the coffee"),
        ("el té", "the tea"),
        ("con azúcar", "with sugar"),
        ("la cuenta", "the bill")
    ])
    translate_sentence(l_es_4.id, "La cuenta, por favor", "The bill, please",
       hints={"La": "The", "cuenta": "bill", "por favor": "please"}, distractors=["table", "menu", "coffee", "two"])
    fill_in_blank(l_es_4.id, "Una leche ___", "caliente", ["caliente", "fría", "azúcar"],
       hints={"Una": "A", "leche": "milk", "caliente": "hot"})
    typing(l_es_4.id, 'Translate: "The tea with sugar, please"', "el té con azúcar por favor",
       hints={"The": "El", "tea": "té", "with": "con", "sugar": "azúcar", "please": "por favor"})

    # Spanish Lesson 5: Dining & Dialogue (7 challenges)
    l_es_5 = Lesson(unit_id=u_es_2.id, title="Restaurant Dialogue", order=2)
    db.add(l_es_5)
    db.commit()

    translate_sentence(l_es_5.id, "Una mesa para dos", "A table for two",
       hints={"Una": "A", "mesa": "table", "para": "for", "dos": "two"}, distractors=["three", "coffee", "menu", "chair"])
    translate_sentence(l_es_5.id, "La comida es deliciosa", "The food is delicious",
       hints={"La": "The", "comida": "food", "es": "is", "deliciosa": "delicious"}, distractors=["drink", "hot", "cold", "water"])
    fill_in_blank(l_es_5.id, "Una mesa ___ dos", "para", ["para", "con", "de"],
       hints={"mesa": "table", "para": "for", "dos": "two"})
    matching(l_es_5.id, "Tap the matching pairs", [
        ("la mesa", "the table"),
        ("el menú", "the menu"),
        ("el vaso", "the glass"),
        ("la comida", "the food")
    ])
    translate_sentence(l_es_5.id, "El agua está fría", "The water is cold",
       hints={"El": "The", "agua": "water", "está": "is", "fría": "cold"}, distractors=["hot", "milk", "bread", "sweet"])
    mc(l_es_5.id, 'What does "Muchas gracias" mean?', "Thank you very much", ["You're welcome", "Good morning"], answer="Thank you very much")
    typing(l_es_5.id, 'Translate: "A table for two, please"', "una mesa para dos por favor",
       hints={"A table": "Una mesa", "for two": "para dos", "please": "por favor"})

    # Spanish Lesson 6: Restaurant Mastery (7 challenges)
    l_es_6 = Lesson(unit_id=u_es_2.id, title="Cafe Mastery", order=3)
    db.add(l_es_6)
    db.commit()

    translate_sentence(l_es_6.id, "Yo quiero un café", "I want a coffee",
       hints={"Yo": "I", "quiero": "want", "un": "a", "café": "coffee"}, distractors=["drink", "tea", "water", "she"])
    translate_sentence(l_es_6.id, "Muchas gracias, adiós", "Thank you very much, goodbye",
       hints={"Muchas": "Very / Many", "gracias": "thanks", "adiós": "goodbye"}, distractors=["Please", "Hello", "morning", "welcome"])
    mc(l_es_6.id, 'What does "Buen provecho" mean?', "Enjoy your meal", ["Good night", "See you later"], answer="Enjoy your meal")
    matching(l_es_6.id, "Tap the matching pairs", [
        ("Yo quiero", "I want"),
        ("¿Cuánto cuesta?", "How much is it?"),
        ("Muchas gracias", "Thank you very much"),
        ("Buen provecho", "Enjoy your meal")
    ])
    translate_sentence(l_es_6.id, "¿Cuánto cuesta la comida?", "How much is the food?",
       hints={"Cuánto": "How much", "cuesta": "costs", "la": "the", "comida": "food"}, distractors=["Where", "is", "water", "table"])
    mc(l_es_6.id, 'How do you say "Yes and No"?', "Sí y No", ["Hola y Adiós", "Por favor y Gracias"], answer="Sí y No")
    typing(l_es_6.id, 'Translate: "Thank you very much"', "muchas gracias",
       hints={"Thank you": "Muchas gracias", "very much": "muchas"})

    # ========================================================
    # 2. GERMAN COURSE
    # ========================================================
    de = Language(name="German", code="de", flag_emoji="🇩🇪")
    db.add(de)
    db.commit()
    c_de = Course(language_id=de.id, title="German")
    db.add(c_de)
    db.commit()

    # German Unit 1
    u_de_1 = Unit(
        course_id=c_de.id,
        title="Unit 1: German Basics",
        description="Essential vocabulary, articles (der/die/das), and introductions.",
        order=1,
        guidebook="Guten Tag! In German, all nouns are capitalized and have three grammatical genders:\n• 'der' = masculine (der Apfel = the apple, der Junge = the boy)\n• 'die' = feminine (die Frau = the woman, die Milch = the milk)\n• 'das' = neuter (das Brot = the bread, das Wasser = the water)\nGreetings:\n• Hallo = Hello\n• Guten Morgen = Good morning\n• Danke = Thank you\n• Bitte = Please / You're welcome"
    )
    db.add(u_de_1)
    db.commit()

    # German Lesson 1: Basics 1 (7 challenges)
    l_de_1 = Lesson(unit_id=u_de_1.id, title="Basics 1", order=1)
    db.add(l_de_1)
    db.commit()

    translate_sentence(l_de_1.id, "Der Junge", "The boy",
       hints={"Der": "The (masculine)", "Junge": "boy"}, distractors=["girl", "apple", "bread"])
    translate_sentence(l_de_1.id, "Das Mädchen", "The girl",
       hints={"Das": "The (neuter)", "Mädchen": "girl"}, distractors=["boy", "woman", "water"])
    mc(l_de_1.id, 'Which of these is "the apple"?', "der Apfel", ["das Brot", "der Junge"], answer="der Apfel")
    matching(l_de_1.id, "Tap the matching pairs", [
        ("der Junge", "the boy"),
        ("das Mädchen", "the girl"),
        ("der Apfel", "the apple"),
        ("das Brot", "the bread")
    ])
    translate_sentence(l_de_1.id, "Der Apfel und das Brot", "The apple and the bread",
       hints={"Der": "The", "Apfel": "apple", "und": "and", "das": "the", "Brot": "bread"}, distractors=["water", "boy", "eats", "milk"])
    mc(l_de_1.id, 'Which of these is "the water"?', "das Wasser", ["die Milch", "der Kaffee"], answer="das Wasser")
    typing(l_de_1.id, 'Translate: "The apple and the bread"', "der Apfel und das Brot",
       hints={"The apple": "Der Apfel", "and": "und", "the bread": "das Brot"})

    # German Lesson 2: Greetings (7 challenges)
    l_de_2 = Lesson(unit_id=u_de_1.id, title="Greetings", order=2)
    db.add(l_de_2)
    db.commit()

    translate_sentence(l_de_2.id, "Hallo! Guten Morgen", "Hello! Good morning",
       hints={"Hallo": "Hello", "Guten": "Good", "Morgen": "morning"}, distractors=["Goodbye", "night", "thanks"])
    translate_sentence(l_de_2.id, "Danke und bitte", "Thank you and please",
       hints={"Danke": "Thank you", "und": "and", "bitte": "please"}, distractors=["Hello", "bye", "water"])
    mc(l_de_2.id, 'How do you say "Goodbye"?', "Auf Wiedersehen", ["Guten Tag", "Hallo"], answer="Auf Wiedersehen")
    matching(l_de_2.id, "Tap the matching pairs", [
        ("Hallo", "Hello"),
        ("Tschüss", "Bye"),
        ("Danke", "Thank you"),
        ("Bitte", "Please")
    ])
    translate_sentence(l_de_2.id, "Tschüss, bis bald", "Bye, see you soon",
       hints={"Tschüss": "Bye", "bis bald": "see you soon"}, distractors=["Good", "morning", "night", "thanks"])
    mc(l_de_2.id, 'How do you say "Good night"?', "Gute Nacht", ["Guten Morgen", "Guten Tag"], answer="Gute Nacht")
    typing(l_de_2.id, 'Translate: "Hello, good morning"', "Hallo guten Morgen",
       hints={"Hello": "Hallo", "good morning": "Guten Morgen"})

    # German Lesson 3: Basics Review (7 challenges)
    l_de_3 = Lesson(unit_id=u_de_1.id, title="Basics Review", order=3)
    db.add(l_de_3)
    db.commit()

    translate_sentence(l_de_3.id, "Der Junge isst Brot", "The boy eats bread",
       hints={"Der": "The", "Junge": "boy", "isst": "eats", "Brot": "bread"}, distractors=["girl", "drinks", "water", "apple"])
    translate_sentence(l_de_3.id, "Das Mädchen trinkt Wasser", "The girl drinks water",
       hints={"Das": "The", "Mädchen": "girl", "trinkt": "drinks", "Wasser": "water"}, distractors=["boy", "eats", "bread", "milk"])
    translate_sentence(l_de_3.id, "Ich bin ein Junge", "I am a boy",
       hints={"Ich": "I", "bin": "am", "ein": "a", "Junge": "boy"}, distractors=["He", "is", "girl", "man"])
    matching(l_de_3.id, "Tap the matching pairs", [
        ("isst", "eats"),
        ("trinkt", "drinks"),
        ("der Mann", "the man"),
        ("die Frau", "the woman")
    ])
    fill_in_blank(l_de_3.id, "Sie ___ einen Apfel", "isst", ["isst", "trinkt", "bin"],
       hints={"Sie": "She", "isst": "eats", "einen": "an", "Apfel": "apple"})
    mc(l_de_3.id, 'What does "Du trinkst Milch" mean?', "You drink milk", ["I eat bread", "She drinks water"], answer="You drink milk",
       hints={"Du": "You", "trinkst": "drink", "Milch": "milk"})
    typing(l_de_3.id, 'Translate: "I am a boy"', "ich bin ein Junge",
       hints={"I": "Ich", "am": "bin", "a": "ein", "boy": "Junge"})

    # German Unit 2
    u_de_2 = Unit(
        course_id=c_de.id,
        title="Unit 2: Cafe & Daily Life",
        description="Order breakfast, drinks, and handle polite cafe interactions.",
        order=2,
        guidebook="In the German Cafe:\n• 'Ein Kaffee, bitte' = A coffee, please\n• 'Die Rechnung, bitte' = The bill, please\n• 'Vielen Dank' = Thank you very much\n• 'Mit Milch und Zucker' = With milk and sugar"
    )
    db.add(u_de_2)
    db.commit()

    # German Lesson 4: At the Cafe (7 challenges)
    l_de_4 = Lesson(unit_id=u_de_2.id, title="At the Cafe", order=1)
    db.add(l_de_4)
    db.commit()

    translate_sentence(l_de_4.id, "Ein Kaffee, bitte", "A coffee, please",
       hints={"Ein": "A", "Kaffee": "coffee", "bitte": "please"}, distractors=["tea", "water", "two", "the"])
    translate_sentence(l_de_4.id, "Tee mit Milch und Zucker", "Tea with milk and sugar",
       hints={"Tee": "Tea", "mit": "with", "Milch": "milk", "und": "and", "Zucker": "sugar"}, distractors=["coffee", "water", "without", "cup"])
    mc(l_de_4.id, 'How do you say "the coffee"?', "der Kaffee", ["der Tee", "die Milch"], answer="der Kaffee")
    matching(l_de_4.id, "Tap the matching cafe items", [
        ("der Kaffee", "the coffee"),
        ("der Tee", "the tea"),
        ("der Zucker", "the sugar"),
        ("die Milch", "the milk")
    ])
    translate_sentence(l_de_4.id, "Die Rechnung, bitte", "The bill, please",
       hints={"Die": "The", "Rechnung": "bill/check", "bitte": "please"}, distractors=["table", "menu", "coffee", "two"])
    fill_in_blank(l_de_4.id, "Tee ___ Milch und Zucker", "mit", ["mit", "ohne", "und"],
       hints={"Tee": "Tea", "Milch": "milk", "Zucker": "sugar"})
    typing(l_de_4.id, 'Translate: "Tea with milk and sugar"', "Tee mit Milch und Zucker",
       hints={"Tea": "Tee", "with": "mit", "milk": "Milch", "and": "und", "sugar": "Zucker"})

    # German Lesson 5: Ordering & Manners (7 challenges)
    l_de_5 = Lesson(unit_id=u_de_2.id, title="Dining Manners", order=2)
    db.add(l_de_5)
    db.commit()

    translate_sentence(l_de_5.id, "Ein Tisch für zwei", "A table for two",
       hints={"Ein": "A", "Tisch": "table", "für": "for", "zwei": "two"}, distractors=["three", "coffee", "menu", "chair"])
    translate_sentence(l_de_5.id, "Das Essen ist sehr lecker", "The food is very delicious",
       hints={"Das": "The", "Essen": "food", "ist": "is", "sehr": "very", "lecker": "delicious"}, distractors=["drink", "hot", "cold", "water"])
    mc(l_de_5.id, 'What does "Guten Tag" mean?', "Good day / Hello", ["Goodbye", "Good night"], answer="Good day / Hello")
    matching(l_de_5.id, "Tap the matching pairs", [
        ("Guten Tag", "Good day"),
        ("Auf Wiedersehen", "Goodbye"),
        ("Sehr gut", "Very good"),
        ("Entschuldigung", "Excuse me")
    ])
    translate_sentence(l_de_5.id, "Entschuldigung, wo ist das Wasser?", "Excuse me, where is the water?",
       hints={"Entschuldigung": "Excuse me", "wo": "where", "ist": "is", "das": "the", "Wasser": "water"}, distractors=["table", "bread", "milk", "coffee"])
    mc(l_de_5.id, 'How do you say "Yes and No"?', "Ja und Nein", ["Hallo und Tschüss", "Bitte und Danke"], answer="Ja und Nein")
    typing(l_de_5.id, 'Translate: "Thank you"', "Danke",
       hints={"Thank you": "Danke"})

    # German Lesson 6: Mastery Challenge (7 challenges)
    l_de_6 = Lesson(unit_id=u_de_2.id, title="Cafe Mastery", order=3)
    db.add(l_de_6)
    db.commit()

    translate_sentence(l_de_6.id, "Ich möchte ein Wasser", "I would like a water",
       hints={"Ich": "I", "möchte": "would like", "ein": "a", "Wasser": "water"}, distractors=["tea", "coffee", "bread", "she"])
    translate_sentence(l_de_6.id, "Vielen Dank, auf Wiedersehen", "Thank you very much, goodbye",
       hints={"Vielen": "Many", "Dank": "thanks", "auf Wiedersehen": "goodbye"}, distractors=["Please", "Hello", "morning", "welcome"])
    mc(l_de_6.id, 'What does "Gute Nacht" mean?', "Good night", ["Good morning", "Good day"], answer="Good night")
    matching(l_de_6.id, "Tap the matching phrases", [
        ("Vielen Dank", "Thank you very much"),
        ("Bis bald", "See you soon"),
        ("Gute Nacht", "Good night"),
        ("Willkommen", "Welcome")
    ])
    translate_sentence(l_de_6.id, "Das Brot ist warm", "The bread is warm",
       hints={"Das": "The", "Brot": "bread", "ist": "is", "warm": "warm"}, distractors=["cold", "water", "apple", "sweet"])
    mc(l_de_6.id, 'What does "Vielen Dank" mean?', "Thank you very much", ["You're welcome", "See you later"], answer="Thank you very much")
    typing(l_de_6.id, 'Translate: "Thank you very much"', "Vielen Dank",
       hints={"Thank you very much": "Vielen Dank"})

    # ========================================================
    # 3. JAPANESE COURSE
    # ========================================================
    ja = Language(name="Japanese", code="ja", flag_emoji="🇯🇵")
    db.add(ja)
    db.commit()
    c_ja = Course(language_id=ja.id, title="Japanese")
    db.add(c_ja)
    db.commit()

    # Japanese Unit 1
    u_ja_1 = Unit(
        course_id=c_ja.id,
        title="Unit 1: Japanese Basics",
        description="Everyday nouns, animal names, and essential Hiragana words.",
        order=1,
        guidebook="Konnichiwa! Japanese basics:\n• りんご (ringo) = apple\n• みず (mizu) = water\n• ねこ (neko) = cat\n• いぬ (inu) = dog\n• ごはん (gohan) = rice / meal\nGreetings:\n• こんにちは (konnichiwa) = hello\n• ありがとう (arigatou) = thank you\n• さようなら (sayounara) = goodbye"
    )
    db.add(u_ja_1)
    db.commit()

    # Japanese Lesson 1: Basics 1 (7 challenges)
    l_ja_1 = Lesson(unit_id=u_ja_1.id, title="Basics 1", order=1)
    db.add(l_ja_1)
    db.commit()

    translate_sentence(l_ja_1.id, "ねこ と いぬ", "Cat and dog",
       hints={"ねこ": "cat", "と": "and", "いぬ": "dog"}, distractors=["bird", "water", "apple"])
    translate_sentence(l_ja_1.id, "みず と ごはん", "Water and rice",
       hints={"みず": "water", "と": "and", "ごはん": "rice"}, distractors=["tea", "apple", "cat"])
    mc(l_ja_1.id, 'Which of these is "apple"?', "りんご", ["ねこ", "とり"], answer="りんご")
    matching(l_ja_1.id, "Tap the matching pairs", [
        ("ねこ", "cat"),
        ("いぬ", "dog"),
        ("みず", "water"),
        ("りんご", "apple"),
        ("ごはん", "rice")
    ])
    translate_sentence(l_ja_1.id, "あかい りんご", "Red apple",
       hints={"あかい": "red", "りんご": "apple"}, distractors=["water", "blue", "cat", "rice"])
    mc(l_ja_1.id, 'Which of these is "rice / meal"?', "ごはん", ["おちゃ", "さかな"], answer="ごはん")
    typing(l_ja_1.id, 'Translate: "Red apple"', "あかい りんご",
       hints={"Red": "あかい", "apple": "りんご"})

    # Japanese Lesson 2: Greetings (7 challenges)
    l_ja_2 = Lesson(unit_id=u_ja_1.id, title="Greetings", order=2)
    db.add(l_ja_2)
    db.commit()

    translate_sentence(l_ja_2.id, "こんにちは！ おはよう", "Hello! Good morning",
       hints={"こんにちは": "hello", "おはよう": "good morning"}, distractors=["Goodbye", "night", "thanks"])
    translate_sentence(l_ja_2.id, "ありがとう、さようなら", "Thank you, goodbye",
       hints={"ありがとう": "thank you", "さようなら": "goodbye"}, distractors=["Hello", "morning", "water"])
    mc(l_ja_2.id, 'How do you say "Hello"?', "こんにちは", ["さようなら", "ありがとう"], answer="こんにちは")
    matching(l_ja_2.id, "Tap the matching greetings", [
        ("こんにちは", "hello"),
        ("ありがとう", "thank you"),
        ("さようなら", "goodbye"),
        ("すみません", "excuse me")
    ])
    translate_sentence(l_ja_2.id, "すみません、ありがとう", "Excuse me, thank you",
       hints={"すみません": "excuse me", "ありがとう": "thank you"}, distractors=["Goodbye", "morning", "night"])
    mc(l_ja_2.id, 'How do you say "Good night"?', "おやすみなさい", ["こんばんは", "さようなら"], answer="おやすみなさい")
    typing(l_ja_2.id, 'Translate: "Good morning"', "おはよう",
       hints={"Good morning": "おはよう"})

    # Japanese Lesson 3: Basics Review (7 challenges)
    l_ja_3 = Lesson(unit_id=u_ja_1.id, title="Basics Review", order=3)
    db.add(l_ja_3)
    db.commit()

    translate_sentence(l_ja_3.id, "おちゃと みず", "Green tea and water",
       hints={"おちゃ": "green tea", "と": "and", "みず": "water"}, distractors=["rice", "meat", "fish", "coffee"])
    translate_sentence(l_ja_3.id, "さかなと にく", "Fish and meat",
       hints={"さかな": "fish", "と": "and", "にく": "meat"}, distractors=["vegetables", "apple", "rice"])
    translate_sentence(l_ja_3.id, "はい、そうです", "Yes, that's right",
       hints={"はい": "yes", "そうです": "that is so"}, distractors=["No", "water", "cat", "dog"])
    matching(l_ja_3.id, "Tap the matching food words", [
        ("おちゃ", "green tea"),
        ("さかな", "fish"),
        ("にく", "meat"),
        ("やさい", "vegetables")
    ])
    fill_in_blank(l_ja_3.id, "おちゃ___ みず", "と", ["と", "の", "は"],
       hints={"おちゃ": "green tea", "と": "and", "みず": "water"})
    mc(l_ja_3.id, 'Which of these is "yes"?', "はい", ["いいえ", "またね"], answer="はい")
    typing(l_ja_3.id, 'Translate: "Green tea and water"', "おちゃと みず",
       hints={"Green tea": "おちゃ", "and": "と", "water": "みず"})

    # Japanese Unit 2
    u_ja_2 = Unit(
        course_id=c_ja.id,
        title="Unit 2: Greetings & Politeness",
        description="Master polite expressions, ordering in cafes, and daily dialogue.",
        order=2,
        guidebook="Polite Japanese:\n• コーヒー (koohii) = coffee\n• おみず ください (omizu kudasai) = water, please\n• ありがとうございます (arigatou gozaimasu) = thank you very much\n• どういたしまして (douitashimashite) = you're welcome"
    )
    db.add(u_ja_2)
    db.commit()

    # Japanese Lesson 4: At the Cafe (7 challenges)
    l_ja_4 = Lesson(unit_id=u_ja_2.id, title="At the Cafe", order=1)
    db.add(l_ja_4)
    db.commit()

    translate_sentence(l_ja_4.id, "おみず ください", "Water, please",
       hints={"おみず": "water", "ください": "please"}, distractors=["tea", "coffee", "two", "the"])
    translate_sentence(l_ja_4.id, "コーヒー ください", "Coffee, please",
       hints={"コーヒー": "coffee", "ください": "please"}, distractors=["tea", "water", "rice", "cup"])
    mc(l_ja_4.id, 'How do you say "coffee"?', "コーヒー", ["おちゃ", "ミルク"], answer="コーヒー")
    matching(l_ja_4.id, "Tap the matching pairs", [
        ("コーヒー", "coffee"),
        ("おちゃ", "green tea"),
        ("これ", "this one"),
        ("ください", "please")
    ])
    translate_sentence(l_ja_4.id, "これ ください", "This one, please",
       hints={"これ": "this one", "ください": "please"}, distractors=["that", "coffee", "two", "bill"])
    fill_in_blank(l_ja_4.id, "コーヒー ___", "ください", ["ください", "これ", "おちゃ"],
       hints={"コーヒー": "coffee"})
    typing(l_ja_4.id, 'Translate: "Water, please"', "おみず ください",
       hints={"Water": "おみず", "please": "ください"})

    # Japanese Lesson 5: Polite Expressions (7 challenges)
    l_ja_5 = Lesson(unit_id=u_ja_2.id, title="Polite Expressions", order=2)
    db.add(l_ja_5)
    db.commit()

    translate_sentence(l_ja_5.id, "ありがとうございます", "Thank you very much",
       hints={"ありがとうございます": "thank you very much"}, distractors=["Hello", "Goodbye", "water", "please"])
    translate_sentence(l_ja_5.id, "どういたしまして", "You're welcome",
       hints={"どういたしまして": "you're welcome"}, distractors=["Thank you", "Goodbye", "night"])
    mc(l_ja_5.id, 'How do you say "Thank you very much" politely?', "ありがとうございます", ["どういたしまして", "すみません"], answer="ありがとうございます")
    matching(l_ja_5.id, "Tap the matching polite phrases", [
        ("ありがとうございます", "thank you very much"),
        ("どういたしまして", "you're welcome"),
        ("いただきます", "let's eat"),
        ("ごちそうさま", "thanks for the meal")
    ])
    translate_sentence(l_ja_5.id, "いただきます！ おいしい", "Let's eat! Delicious",
       hints={"いただきます": "let's eat", "おいしい": "delicious"}, distractors=["Goodbye", "water", "sorry"])
    mc(l_ja_5.id, 'How do you say "Good evening"?', "こんばんは", ["おはよう", "おやすみ"], answer="こんばんは")
    typing(l_ja_5.id, 'Translate: "Excuse me"', "すみません",
       hints={"Excuse me": "すみません"})

    # Japanese Lesson 6: Restaurant Mastery (7 challenges)
    l_ja_6 = Lesson(unit_id=u_ja_2.id, title="Restaurant Mastery", order=3)
    db.add(l_ja_6)
    db.commit()

    translate_sentence(l_ja_6.id, "ふたり です", "Two people",
       hints={"ふたり": "two people", "です": "is"}, distractors=["One", "three", "coffee", "table"])
    translate_sentence(l_ja_6.id, "おかいけい おねがいします", "The bill, please",
       hints={"おかいけい": "the bill", "おねがいします": "please"}, distractors=["water", "menu", "coffee", "two"])
    mc(l_ja_6.id, 'How do you say "Two people" (table for two)?', "ふたり", ["ひとり", "さんにん"], answer="ふたり")
    matching(l_ja_6.id, "Tap the matching restaurant terms", [
        ("おかいけい", "the bill"),
        ("ふたり", "two people"),
        ("メニュー", "the menu"),
        ("みず", "water")
    ])
    translate_sentence(l_ja_6.id, "とても おいしい です", "It is very delicious",
       hints={"とても": "very", "おいしい": "delicious", "です": "is"}, distractors=["hot", "cold", "water", "tea"])
    mc(l_ja_6.id, 'What does "またね" mean?', "See you later", ["Goodbye forever", "Good night"], answer="See you later")
    typing(l_ja_6.id, 'Translate: "Delicious"', "おいしい",
       hints={"Delicious": "おいしい"})

    # ========================================================
    # 4. FRENCH COURSE
    # ========================================================
    fr = Language(name="French", code="fr", flag_emoji="🇫🇷")
    db.add(fr)
    db.commit()
    c_fr = Course(language_id=fr.id, title="French")
    db.add(c_fr)
    db.commit()

    # French Unit 1
    u_fr_1 = Unit(
        course_id=c_fr.id,
        title="Unit 1: Basics & Salutations",
        description="Learn core greetings, gendered articles (le, la, un, une), and everyday phrases.",
        order=1,
        guidebook="Bienvenue en France!\n• Noun genders:\n  - 'le' / 'un' for masculine (le garçon = the boy, un croissant = a croissant)\n  - 'la' / 'une' for feminine (la fille = the girl, une pomme = an apple)\n• Greetings:\n  - Bonjour = Hello / Good morning\n  - Au revoir = Goodbye\n  - S'il vous plaît = Please\n  - Merci beaucoup = Thank you very much"
    )
    db.add(u_fr_1)
    db.commit()

    # French Lesson 1: Basics 1 (7 challenges)
    l_fr_1 = Lesson(unit_id=u_fr_1.id, title="Basics 1", order=1)
    db.add(l_fr_1)
    db.commit()

    translate_sentence(l_fr_1.id, "Bonjour, je suis un garçon", "Hello, I am a boy",
       hints={"Bonjour": "Hello", "je": "I", "suis": "am", "un": "a", "garçon": "boy"}, distractors=["girl", "apple", "woman", "is"])
    mc(l_fr_1.id, 'What does "la femme" mean?', "The woman", ["The boy", "The cat"], answer="The woman")
    matching(l_fr_1.id, "Tap the matching pairs", [
        ("bonjour", "hello"),
        ("garçon", "boy"),
        ("femme", "woman"),
        ("pomme", "apple")
    ])
    translate_sentence(l_fr_1.id, "Une fille mange une pomme", "A girl eats an apple",
       hints={"Une": "A", "fille": "girl", "mange": "eats", "pomme": "apple"}, distractors=["boy", "water", "croissant", "is"])
    fill_in_blank(l_fr_1.id, "Je suis un ___", "garçon", ["garçon", "pomme", "mange"],
       hints={"Je": "I", "suis": "am", "un": "a", "garçon": "boy", "pomme": "apple", "mange": "eats"})
    mc(l_fr_1.id, 'How do you say "The cat"?', "Le chat", ["Le chien", "La pomme"], answer="Le chat")
    typing(l_fr_1.id, 'Translate: "The boy"', "Le garçon",
       hints={"The": "Le", "boy": "garçon"})

    # French Lesson 2: Food & Drinks (7 challenges)
    l_fr_2 = Lesson(unit_id=u_fr_1.id, title="Food & Drinks", order=2)
    db.add(l_fr_2)
    db.commit()

    translate_sentence(l_fr_2.id, "Le chat boit du lait", "The cat drinks milk",
       hints={"Le": "The", "chat": "cat", "boit": "drinks", "lait": "milk"}, distractors=["water", "apple", "eats", "boy"])
    mc(l_fr_2.id, 'How do you say "croissant"?', "Un croissant", ["Une pomme", "Un café"], answer="Un croissant")
    matching(l_fr_2.id, "Tap the matching food words", [
        ("lait", "milk"),
        ("eau", "water"),
        ("pain", "bread"),
        ("croissant", "croissant")
    ])
    translate_sentence(l_fr_2.id, "Je mange du pain", "I eat bread",
       hints={"Je": "I", "mange": "eat", "pain": "bread"}, distractors=["drinks", "water", "apple", "milk"])
    fill_in_blank(l_fr_2.id, "Je bois de l'___", "eau", ["eau", "pain", "croissant"],
       hints={"Je": "I", "bois": "drink", "eau": "water", "pain": "bread", "croissant": "croissant"})
    mc(l_fr_2.id, 'What does "du pain" mean?', "Bread", ["Milk", "Water"], answer="Bread")
    typing(l_fr_2.id, 'Translate: "I eat an apple"', "Je mange une pomme",
       hints={"I": "Je", "eat": "mange", "an": "une", "apple": "pomme"})

    # French Lesson 3: Greetings & Politeness (7 challenges)
    l_fr_3 = Lesson(unit_id=u_fr_1.id, title="Greetings & Politeness", order=3)
    db.add(l_fr_3)
    db.commit()

    translate_sentence(l_fr_3.id, "Merci beaucoup", "Thank you very much",
       hints={"Merci": "Thank you", "beaucoup": "very much"}, distractors=["Hello", "Goodbye", "Please", "sorry"])
    mc(l_fr_3.id, 'How do you say "Please" formally in French?', "S'il vous plaît", ["Merci", "Au revoir"], answer="S'il vous plaît")
    matching(l_fr_3.id, "Tap the matching phrases", [
        ("merci", "thank you"),
        ("au revoir", "goodbye"),
        ("s'il vous plaît", "please"),
        ("oui", "yes")
    ])
    translate_sentence(l_fr_3.id, "Au revoir, à bientôt !", "Goodbye, see you soon!",
       hints={"Au revoir": "Goodbye", "à bientôt": "see you soon"}, distractors=["Hello", "yes", "please", "thanks"])
    fill_in_blank(l_fr_3.id, "Merci ___", "beaucoup", ["beaucoup", "bonjour", "fille"],
       hints={"Merci": "Thank you", "beaucoup": "very much"})
    mc(l_fr_3.id, 'What does "Comment ça va ?" mean?', "How are you?", ["What is that?", "Where are you?"], answer="How are you?")
    typing(l_fr_3.id, 'Translate: "Goodbye"', "Au revoir",
       hints={"Goodbye": "Au revoir"})

    # French Unit 2
    u_fr_2 = Unit(
        course_id=c_fr.id,
        title="Unit 2: Café & City Life",
        description="Master ordering at a bistro, asking directions, and navigating Paris.",
        order=2,
        guidebook="At the Parisian Café:\n• Un café, s'il vous plaît = A coffee, please\n• L'addition, s'il vous plaît = The bill, please\n• C'est délicieux = It is delicious\n• Où est la gare ? = Where is the train station?"
    )
    db.add(u_fr_2)
    db.commit()

    # French Lesson 4: At the Bistro (7 challenges)
    l_fr_4 = Lesson(unit_id=u_fr_2.id, title="At the Bistro", order=1)
    db.add(l_fr_4)
    db.commit()

    translate_sentence(l_fr_4.id, "Un café et un croissant, s'il vous plaît", "A coffee and a croissant, please",
       hints={"Un": "A", "café": "coffee", "et": "and", "croissant": "croissant", "s'il vous plaît": "please"}, distractors=["tea", "water", "two", "the"])
    mc(l_fr_4.id, 'How do you say "A coffee, please"?', "Un café, s'il vous plaît", ["Une eau, merci", "Le pain rouge"], answer="Un café, s'il vous plaît")
    matching(l_fr_4.id, "Tap the matching café terms", [
        ("café", "coffee"),
        ("thé", "tea"),
        ("croissant", "croissant"),
        ("l'addition", "the bill")
    ])
    translate_sentence(l_fr_4.id, "L'addition, s'il vous plaît", "The bill, please",
       hints={"L'addition": "The bill", "s'il vous plaît": "please"}, distractors=["menu", "coffee", "water", "two"])
    fill_in_blank(l_fr_4.id, "Un café, s'il ___ plaît", "vous", ["vous", "tu", "pain"],
       hints={"s'il vous plaît": "please"})
    mc(l_fr_4.id, 'What does "C\'est délicieux" mean?', "It is delicious", ["It is cold", "It is expensive"], answer="It is delicious")
    typing(l_fr_4.id, 'Translate: "A coffee, please"', "Un café, s'il vous plaît",
       hints={"A": "Un", "coffee": "café", "please": "s'il vous plaît"})

    # French Lesson 5: Exploring the City (7 challenges)
    l_fr_5 = Lesson(unit_id=u_fr_2.id, title="Exploring the City", order=2)
    db.add(l_fr_5)
    db.commit()

    translate_sentence(l_fr_5.id, "Où est la tour Eiffel ?", "Where is the Eiffel Tower?",
       hints={"Où": "Where", "est": "is", "la": "the", "tour": "tower", "Eiffel": "Eiffel"}, distractors=["station", "museum", "here", "hotel"])
    mc(l_fr_5.id, 'How do you ask "Where is the train station?"', "Où est la gare ?", ["Où est le chat ?", "Voici la gare"], answer="Où est la gare ?")
    matching(l_fr_5.id, "Tap the matching city places", [
        ("gare", "train station"),
        ("musée", "museum"),
        ("hôtel", "hotel"),
        ("rue", "street")
    ])
    translate_sentence(l_fr_5.id, "C'est très beau ici", "It is very beautiful here",
       hints={"C'est": "It is", "très": "very", "beau": "beautiful", "ici": "here"}, distractors=["cold", "far", "expensive", "small"])
    fill_in_blank(l_fr_5.id, "Où ___ la gare ?", "est", ["est", "sont", "eau"],
       hints={"Où": "Where", "gare": "station"})
    mc(l_fr_5.id, 'What does "un taxi" mean?', "A taxi", ["A train", "A bus"], answer="A taxi")
    typing(l_fr_5.id, 'Translate: "Where is the museum?"', "Où est le musée ?",
       hints={"Where": "Où", "is": "est", "the museum": "le musée"})

    # French Lesson 6: French Mastery (7 challenges)
    l_fr_6 = Lesson(unit_id=u_fr_2.id, title="French Mastery", order=3)
    db.add(l_fr_6)
    db.commit()

    translate_sentence(l_fr_6.id, "Bienvenue en France !", "Welcome to France!",
       hints={"Bienvenue": "Welcome", "en France": "to France"}, distractors=["Goodbye", "Good night", "Paris", "hello"])
    mc(l_fr_6.id, 'What is the polite reply to "Merci" in French?', "De rien", ["Bonjour", "S'il vous plaît"], answer="De rien")
    matching(l_fr_6.id, "Tap the matching expressions", [
        ("bienvenue", "welcome"),
        ("de rien", "you're welcome"),
        ("à demain", "see you tomorrow"),
        ("bonne nuit", "good night")
    ])
    translate_sentence(l_fr_6.id, "Bonne journée et à bientôt !", "Have a good day and see you soon!",
       hints={"Bonne": "Good", "journée": "day", "et": "and", "à bientôt": "see you soon"}, distractors=["night", "bye", "welcome", "please"])
    fill_in_blank(l_fr_6.id, "De ___", "rien", ["rien", "tout", "pain"],
       hints={"De rien": "You're welcome"})
    mc(l_fr_6.id, 'How do you say "Have a good night"?', "Bonne nuit", ["Bonne journée", "Bonjour"], answer="Bonne nuit")
    typing(l_fr_6.id, 'Translate: "You are welcome"', "De rien",
       hints={"You are welcome": "De rien"})

    # Restore preserved user progress
    if saved_progress:
        for u_id, l_id, comp in saved_progress:
            db.add(UserProgress(user_id=u_id, lesson_id=l_id, completed=comp))
        db.commit()
    db.close()

    print("Complete rich curriculum seeded with 'translate_sentence' word banks and hover hints on foreign sentences!")

if __name__ == "__main__":
    seed_data()
