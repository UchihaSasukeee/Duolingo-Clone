from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from typing import List, Optional
import random
import json
import re

from backend.database import engine, Base, get_db
from backend import models, schemas
import sqlalchemy as sa
from datetime import datetime

Base.metadata.create_all(bind=engine)

# Safely ensure columns exist in SQLite
try:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE users ADD COLUMN last_active_date VARCHAR;"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE users ADD COLUMN claimed_quests VARCHAR DEFAULT '[]';"))
        conn.commit()
except Exception:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/user", response_model=schemas.UserResponse)
def get_user(clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if not user:
        user = models.UserDB(clerk_id=clerk_id, hearts=5, xp=0, gems=50, streak=0, active_course_id=1, last_active_date=today_str)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Daily limit reset: if a new day has arrived, reset daily hearts back to 5 & reset daily quests!
        if getattr(user, "last_active_date", None) != today_str:
            user.hearts = 5
            user.claimed_quests = "[]"
            user.last_active_date = today_str
            db.commit()
            db.refresh(user)
    return user

@app.put("/api/user", response_model=schemas.UserResponse)
def update_user(user_data: schemas.UserSchema, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if not user:
        user = models.UserDB(
            clerk_id=clerk_id,
            hearts=user_data.hearts,
            xp=user_data.xp,
            gems=user_data.gems,
            streak=user_data.streak,
            active_course_id=user_data.active_course_id or 1,
            last_active_date=today_str,
        )
        db.add(user)
    else:
        user.hearts = user_data.hearts
        user.xp = user_data.xp
        user.gems = user_data.gems
        user.streak = user_data.streak
        if user_data.active_course_id is not None:
            user.active_course_id = user_data.active_course_id
    
    db.commit()
    db.refresh(user)
    return user

@app.get("/api/courses", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    res = []
    for c in courses:
        res.append({
            "id": c.id,
            "title": c.title,
            "language_id": c.language_id,
            "flag_emoji": c.language.flag_emoji if c.language else "🌐",
            "code": c.language.code if c.language else "es"
        })
    return res

@app.post("/api/user/course")
def select_course(course_id: int, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if not user:
        user = models.UserDB(clerk_id=clerk_id, hearts=5, xp=0, gems=50, streak=0, active_course_id=course_id, last_active_date=today_str)
        db.add(user)
    else:
        user.active_course_id = course_id
    db.commit()
    return {"status": "ok", "active_course_id": course_id}

@app.get("/api/user/seen-words")
def get_user_seen_words(course_id: Optional[int] = None, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    if not user:
        return {"words": []}
    
    target_course_id = course_id if course_id is not None else user.active_course_id
    
    query = db.query(models.UserProgress.lesson_id).filter(
        models.UserProgress.user_id == user.id,
        models.UserProgress.completed == True
    )
    if target_course_id:
        query = query.join(models.Lesson, models.Lesson.id == models.UserProgress.lesson_id)\
                     .join(models.Unit, models.Unit.id == models.Lesson.unit_id)\
                     .filter(models.Unit.course_id == target_course_id)
                     
    completed_lesson_ids = [r[0] for r in query.all()]
    if not completed_lesson_ids:
        return {"words": []}
        
    challenges = db.query(models.Challenge).filter(models.Challenge.lesson_id.in_(completed_lesson_ids)).all()
    seen = set()
    for ch in challenges:
        if ch.hints:
            try:
                data = json.loads(ch.hints)
                for k in data.keys():
                    seen.add(k.strip().lower())
                    for w in re.findall(r'[\w]+', k.lower()):
                        seen.add(w)
            except Exception:
                pass
        if ch.answer:
            for w in re.findall(r'[\w]+', ch.answer.lower()):
                seen.add(w)
        if ch.question:
            for w in re.findall(r'[\w]+', ch.question.lower()):
                seen.add(w)
                
    return {"words": list(seen)}

@app.get("/api/units", response_model=List[schemas.UnitResponse])
def get_units(
    course_id: Optional[int] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
):
    clerk_id = None
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, options={"verify_signature": False})
            clerk_id = payload.get("sub")
        except Exception:
            pass

    user = None
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if clerk_id:
        try:
            user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
            if not user:
                user = models.UserDB(
                    clerk_id=clerk_id,
                    hearts=5,
                    xp=0,
                    gems=50,
                    streak=0,
                    active_course_id=course_id or 1,
                    last_active_date=today_str,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            elif course_id and user.active_course_id != course_id:
                user.active_course_id = course_id
                db.commit()
                db.refresh(user)
            elif not user.active_course_id:
                user.active_course_id = course_id or 1
                db.commit()
                db.refresh(user)
        except Exception as e:
            print("User init error in get_units:", e)
            db.rollback()
    
    target_course_id = course_id or (user.active_course_id if user else None) or 1

    completed_ids = set()
    if user:
        try:
            completed_records = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == user.id,
                models.UserProgress.completed == True
            ).all()
            completed_ids = {p.lesson_id for p in completed_records}
        except Exception:
            pass

    units = db.query(models.Unit).filter(models.Unit.course_id == target_course_id).order_by(models.Unit.order).all()
    if not units:
        units = db.query(models.Unit).filter(models.Unit.course_id == 1).order_by(models.Unit.order).all()
    
    unit_responses = []
    found_current = False

    for u in units:
        lessons = db.query(models.Lesson).filter(models.Lesson.unit_id == u.id).order_by(models.Lesson.order).all()
        lesson_responses = []
        for l in lessons:
            is_completed = l.id in completed_ids
            if is_completed:
                lesson_responses.append({
                    "id": l.id,
                    "title": l.title,
                    "order": l.order,
                    "completed": True,
                    "locked": False,
                    "is_current": False
                })
            elif not found_current:
                # The first incomplete lesson is marked current
                found_current = True
                lesson_responses.append({
                    "id": l.id,
                    "title": l.title,
                    "order": l.order,
                    "completed": False,
                    "locked": False,
                    "is_current": True
                })
            else:
                # All remaining incomplete lessons are locked
                lesson_responses.append({
                    "id": l.id,
                    "title": l.title,
                    "order": l.order,
                    "completed": False,
                    "locked": True,
                    "is_current": False
                })
        
        unit_responses.append({
            "id": u.id,
            "title": u.title,
            "description": u.description,
            "order": u.order,
            "guidebook": u.guidebook,
            "lessons": lesson_responses
        })

    return unit_responses

@app.get("/api/lessons/{lesson_id}", response_model=schemas.LessonDetailResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

def record_user_activity(user: models.UserDB):
    import datetime
    today = datetime.date.today()
    today_str = today.isoformat()
    yesterday_str = (today - datetime.timedelta(days=1)).isoformat()

    if not user.last_active_date:
        user.streak = 1
        user.last_active_date = today_str
    elif user.last_active_date == today_str:
        if (user.streak or 0) <= 0:
            user.streak = 1
    elif user.last_active_date == yesterday_str:
        user.streak = (user.streak or 0) + 1
        user.last_active_date = today_str
    else:
        user.streak = 1
        user.last_active_date = today_str

@app.post("/api/lessons/{lesson_id}/complete", response_model=schemas.LessonCompleteResponse)
def complete_lesson(lesson_id: int, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    existing = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user.id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    first_time = False
    if not existing:
        progress = models.UserProgress(user_id=user.id, lesson_id=lesson_id, completed=True)
        db.add(progress)
        first_time = True
    elif not existing.completed:
        existing.completed = True
        first_time = True

    xp_earned = 20 if first_time else 10
    gems_earned = 10 if first_time else 5
    user.xp += xp_earned
    user.gems += gems_earned
    record_user_activity(user)
    
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "xp_earned": xp_earned,
        "gems_earned": gems_earned,
        "hearts": user.hearts,
        "xp": user.xp,
        "gems": user.gems,
        "streak": user.streak,
        "completed_lesson_id": lesson_id
    }

@app.get("/api/practice")
def get_practice(clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    course_id = user.active_course_id if (user and user.active_course_id) else 1

    challenges = db.query(models.Challenge).join(models.Lesson).join(models.Unit).filter(
        models.Unit.course_id == course_id
    ).all()

    if not challenges:
        challenges = db.query(models.Challenge).all()

    selected = random.sample(challenges, min(4, len(challenges))) if challenges else []
    
    result = []
    for ch in selected:
        result.append({
            "id": ch.id,
            "type": ch.type,
            "question": ch.question,
            "answer": ch.answer,
            "hints": ch.hints,
            "options": [
                {
                    "id": opt.id,
                    "text": opt.text,
                    "match_text": opt.match_text,
                    "is_correct": opt.is_correct
                }
                for opt in ch.options
            ]
        })
    return result

@app.post("/api/practice/complete", response_model=schemas.PracticeResponse)
def complete_practice(clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    hearts_added = 0
    if user.hearts < 5:
        user.hearts += 1
        hearts_added = 1
    
    xp_added = 10
    user.xp += xp_added
    record_user_activity(user)
    
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "hearts": user.hearts,
        "xp": user.xp,
        "gems": user.gems,
        "hearts_added": hearts_added,
        "xp_added": xp_added
    }

@app.post("/api/user/simulate-day")
def simulate_day(days_ago: int = 1, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Allows testing and simulating consecutive daily streak progression for evaluation."""
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    import datetime
    sim_date = (datetime.date.today() - datetime.timedelta(days=days_ago)).isoformat()
    user.last_active_date = sim_date
    db.commit()
    db.refresh(user)
    return {"success": True, "last_active_date": user.last_active_date, "streak": user.streak}

@app.get("/api/leaderboard")
def get_leaderboard(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security), db: Session = Depends(get_db)):
    current_clerk_id = None
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, options={"verify_signature": False})
            current_clerk_id = payload.get("sub")
        except Exception:
            pass

    users = db.query(models.UserDB).order_by(models.UserDB.xp.desc()).all()
    result = []
    for u in users:
        is_curr = (u.clerk_id == current_clerk_id) if current_clerk_id else False
        result.append({
            "id": str(u.id),
            "name": "You (Learner)" if is_curr else f"Learner #{u.id}",
            "imageSrc": "/mascot.jpeg",
            "xp": u.xp,
            "is_current": is_curr
        })
    
    # Pad with dynamic bot competitors
    bots = [
        {"name": "DuoMaster", "xp": 180},
        {"name": "Sofia_ES", "xp": 140},
        {"name": "Hans_DE", "xp": 110},
        {"name": "Kenji_JP", "xp": 80},
        {"name": "Elena_Polyglot", "xp": 60},
        {"name": "GrammarNinja", "xp": 40},
        {"name": "VocabHero", "xp": 20},
    ]
    for b in bots:
        if not any(r["name"] == b["name"] for r in result):
            result.append({
                "id": f"bot-{b['name']}",
                "name": b["name"],
                "imageSrc": "/mascot.jpeg",
                "xp": b["xp"],
                "is_current": False
            })

    result.sort(key=lambda x: x["xp"], reverse=True)
    return result[:10]

@app.get("/api/quests")
def get_quests(clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    xp = user.xp if user else 0
    
    claimed_ids = []
    if user and user.claimed_quests:
        try:
            import json
            claimed_ids = json.loads(user.claimed_quests)
        except Exception:
            claimed_ids = []

    return [
        {
            "id": "q1",
            "title": "Earn 20 XP",
            "description": "Complete lessons or practice to gain XP.",
            "target": 20,
            "current": min(xp, 20),
            "reward_gems": 10,
            "completed": xp >= 20,
            "claimed": "q1" in claimed_ids
        },
        {
            "id": "q2",
            "title": "Earn 50 XP",
            "description": "Reach 50 XP today to power up your brain.",
            "target": 50,
            "current": min(xp, 50),
            "reward_gems": 20,
            "completed": xp >= 50,
            "claimed": "q2" in claimed_ids
        },
        {
            "id": "q3",
            "title": "Score 100 XP Challenge",
            "description": "Become an unstoppable polyglot champion.",
            "target": 100,
            "current": min(xp, 100),
            "reward_gems": 50,
            "completed": xp >= 100,
            "claimed": "q3" in claimed_ids
        }
    ]

@app.post("/api/quests/{quest_id}/claim")
def claim_quest(quest_id: str, clerk_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    import json
    claimed_ids = []
    if user.claimed_quests:
        try:
            claimed_ids = json.loads(user.claimed_quests)
        except Exception:
            claimed_ids = []

    if quest_id in claimed_ids:
        raise HTTPException(status_code=400, detail="Quest already claimed")

    QUEST_CONFIG = {
        "q1": {"target": 20, "gems": 10},
        "q2": {"target": 50, "gems": 20},
        "q3": {"target": 100, "gems": 50},
    }

    if quest_id not in QUEST_CONFIG:
        raise HTTPException(status_code=404, detail="Quest not found")

    cfg = QUEST_CONFIG[quest_id]
    if user.xp < cfg["target"]:
        raise HTTPException(status_code=400, detail="Quest requirement not completed yet")

    claimed_ids.append(quest_id)
    user.claimed_quests = json.dumps(claimed_ids)
    user.gems += cfg["gems"]

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "quest_id": quest_id,
        "gems": user.gems,
        "reward_gems": cfg["gems"],
        "claimed_quests": claimed_ids
    }
