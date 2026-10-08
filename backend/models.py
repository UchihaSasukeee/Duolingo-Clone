from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from .database import Base

class ChallengeType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    typing = "typing"
    matching = "matching"
    translate = "translate"
    fill_in_blank = "fill_in_blank"

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String, unique=True, index=True)
    hearts = Column(Integer, default=5)
    xp = Column(Integer, default=0)
    gems = Column(Integer, default=50)
    streak = Column(Integer, default=0)
    active_course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    last_active_date = Column(String, nullable=True)
    claimed_quests = Column(String, default="[]")

    active_course = relationship("Course")
    progress = relationship("UserProgress", back_populates="user")

class Language(Base):
    __tablename__ = "languages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    code = Column(String, unique=True)
    flag_emoji = Column(String)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"))
    title = Column(String)

    language = relationship("Language")
    units = relationship("Unit", back_populates="course")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String) 
    description = Column(String)
    order = Column(Integer)
    guidebook = Column(String, nullable=True)

    course = relationship("Course", back_populates="units")
    lessons = relationship("Lesson", back_populates="unit")

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    title = Column(String)
    order = Column(Integer)

    unit = relationship("Unit", back_populates="lessons")
    challenges = relationship("Challenge", back_populates="lesson")

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    type = Column(Enum(ChallengeType))
    question = Column(String)
    answer = Column(String, nullable=True) 
    hints = Column(String, nullable=True) 

    lesson = relationship("Lesson", back_populates="challenges")
    options = relationship("ChallengeOption", back_populates="challenge")

class ChallengeOption(Base):
    __tablename__ = "challenge_options"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    text = Column(String)
    match_text = Column(String, nullable=True) 
    is_correct = Column(Boolean, default=False)

    challenge = relationship("Challenge", back_populates="options")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    completed = Column(Boolean, default=True)

    user = relationship("UserDB", back_populates="progress")
