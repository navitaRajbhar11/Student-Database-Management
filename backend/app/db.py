from pymongo import MongoClient

MONGO_URI = "mongodb+srv://navita:Rnavita02@cluster0.f1auc.mongodb.net/studentApp?retryWrites=true&w=majority"

# Create a Single Persistent MongoDB Connection
try:
    client = MongoClient(MONGO_URI)
    db = client["studentApp"]
    print("MongoDB Connected Successfully")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    exit(1)

def get_students_collection():
    return db.students

def get_admins_collection():
    return db.admins

def get_assignments_collection():
    return db.assignments

def get_submissions_collection():
    return db.submissions

def get_schedules_collection():
    return db.schedules

def get_videos_lectures_collection():
    return db.videos_lectures

def get_queries_collection():
    return db.queries

# Test the connection and print data from the students collection only when running directly
if __name__ == "__main__":
    try:
        print("Checking Student Data in MongoDB...")
        student_list = get_students_collection().find()
        for student in student_list:
            print(student)  # Print student records from MongoDB
    except Exception as e:
        print(f"Error fetching student data: {e}")
