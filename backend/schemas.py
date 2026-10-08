from pydantic import BaseModel
from typing import List, Optional

class UserSchema(BaseModel):
    hearts: int
    xp: int
    gems: int
    streak: int
    active_course_id: Optional[int] = None
    last_active_date: Optional[str] = None
    claimed_quests: Optional[str] = "[]"
    last_heart_updated_at: Optional[str] = None

class UserResponse(UserSchema):
    clerk_id: str
    class Config:
        from_attributes = True

class CourseResponse(BaseModel):
    id: int
    title: str
    language_id: int
    flag_emoji: str = "🌐"
    code: str = "en"
    class Config:
        from_attributes = True

class LessonResponse(BaseModel):
    id: int
    title: str
    order: int
    completed: bool = False
    locked: bool = False
    is_current: bool = False
    class Config:
        from_attributes = True

class UnitResponse(BaseModel):
    id: int
    title: str
    description: str
    order: int
    guidebook: Optional[str] = None
    lessons: List[LessonResponse]
    class Config:
        from_attributes = True

class LessonCompleteResponse(BaseModel):
    success: bool
    xp_earned: int
    gems_earned: int
    hearts: int
    xp: int
    gems: int
    streak: int
    completed_lesson_id: int

class PracticeResponse(BaseModel):
    success: bool
    hearts: int
    xp: int
    gems: int
    hearts_added: int
    xp_added: int

class ChallengeOptionSchema(BaseModel):
    id: int
    text: str
    match_text: Optional[str] = None
    is_correct: bool
    class Config:
        from_attributes = True

class ChallengeSchema(BaseModel):
    id: int
    type: str
    question: str
    answer: Optional[str] = None
    hints: Optional[str] = None
    options: List[ChallengeOptionSchema]
    class Config:
        from_attributes = True

class LessonDetailResponse(LessonResponse):
    challenges: List[ChallengeSchema]
