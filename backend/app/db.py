from pymongo import MongoClient
import redis
import json

MONGO_URI = "mongodb+srv://user: password@cluster0.f1auc.mongodb.net/studentApp?retryWrites=true&w=majority"
REDIS_HOST = "localhost"  # Replace with your Redis server's host
REDIS_PORT = 0009  # Replace with your Redis server's port

# Create a single persistent MongoDB connection
client = None
db = None

# Create Redis connection
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

def connect_to_mongo():
    global client, db
    if client is None:  # Check if the connection already exists
        try:
            client = MongoClient(MONGO_URI)
            db = client["studentApp"]
            print("MongoDB Connected Successfully")
        except Exception as e:  # Catch any general exception
            print(f"Failed to connect to MongoDB: {e}")
            exit(1)
    return db

def cache_data(key, data, expiry=3600):
    """ Cache data in Redis with expiry (default is 1 hour) """
    r.setex(key, expiry, json.dumps(data))  # Cache data as JSON string

def get_cached_data(key):
    """ Get cached data from Redis """
    cached_data = r.get(key)
    if cached_data:
        return json.loads(cached_data)
    return None

def get_students_collection():
    db = connect_to_mongo()
    return db.students

def get_admins_collection():
    db = connect_to_mongo()
    return db.admins

def get_assignments_collection():
    db = connect_to_mongo()
    return db.assignments

def get_submissions_collection():
    db = connect_to_mongo()
    return db.submissions

def get_schedules_collection():
    db = connect_to_mongo()
    return db.schedules

def get_videos_lectures_collection():
    db = connect_to_mongo()
    return db.videos_lectures

def get_queries_collection():
    db = connect_to_mongo()
    return db.queries

# Test function to fetch and print student data from MongoDB or cache
def fetch_and_print_students():
    cache_key = "students_data"  # Cache key for students data

    # Check if students data is cached in Redis
    cached_students = get_cached_data(cache_key)
    if cached_students:
        print("Using cached student data from Redis...")
        for student in cached_students:
            print(student)  # Print each student record from cache
    else:
        try:
            print("Fetching Student Data from MongoDB...")
            student_list = get_students_collection().find()  # Use .find() to fetch all records
            students = list(student_list)  # Convert cursor to list

            # Cache data for future use
            cache_data(cache_key, students)

            for student in students:
                print(student)  # Print each student record
        except Exception as e:  # Catch any general exception
            print(f"Error fetching student data: {e}")

# Main execution block
if __name__ == "__main__":
    fetch_and_print_students()

