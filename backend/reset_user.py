import sqlite3

def reset_users():
    conn = sqlite3.connect("duolingo.db")
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET hearts = 5, 
            xp = 0, 
            gems = 50, 
            streak = 0, 
            claimed_quests = '[]', 
            active_course_id = 1, 
            last_active_date = NULL
    """)
    cursor.execute("DELETE FROM user_progress")
    conn.commit()

    cursor.execute("SELECT id, clerk_id, hearts, xp, gems, streak, active_course_id, last_active_date, claimed_quests FROM users")
    users = cursor.fetchall()
    cursor.execute("SELECT count(*) FROM user_progress")
    progress_count = cursor.fetchone()[0]
    
    print("Reset users:", users)
    print("User progress count:", progress_count)
    conn.close()

if __name__ == "__main__":
    reset_users()
